const cron = require("node-cron");
const Alert = require("../models/Alert");
const { getLatestPrice } = require("../services/scrapeService");
const { sendEmail } = require("../services/notifyService");
const smsService = require("../services/smsService");

// Configuration
const CONCURRENT_BATCH_SIZE = parseInt(process.env.ALERT_BATCH_SIZE) || 5; // Process 5 alerts concurrently
const BATCH_DELAY_MS = parseInt(process.env.ALERT_BATCH_DELAY) || 2000; // 2 second delay between batches

console.log(" Price Alert Cron Initialized");
console.log(` Batch processing config: ${CONCURRENT_BATCH_SIZE} concurrent alerts, ${BATCH_DELAY_MS}ms delay between batches`);

/**
 * Process a single alert
 * @param {Object} alert - Alert document
 * @param {number} index - Alert index
 * @param {number} total - Total alerts
 * @returns {Promise<Object>} - Result object with status and details
 */
async function processAlert(alert, index, total) {
  const result = {
    alertId: alert._id,
    success: false,
    triggered: false,
    price: null,
    error: null
  };

  try {
    console.log(`\n[${index + 1}/${total}] Checking alert ID: ${alert._id}`);
    console.log(`   Product: ${alert.productName}`);
    console.log(`   Stores: ${alert.stores && alert.stores.length > 0 ? alert.stores.join(', ') : 'All stores'}`);
    console.log(`   Target Price: ₹${alert.targetPrice}`);
    if (alert.productUrl) {
      console.log(`   Product URL: ${alert.productUrl} (will use direct page scraping)`);
    } else {
      console.log(`   Product URL: Not provided (will use search method)`);
    }

    // Get latest price (use productUrl if available, otherwise search)
    const currentPrice = await getLatestPrice(
      alert.productName,
      alert.stores,
      alert.productUrl
    );

    result.price = currentPrice;
    result.success = true;

    // Update last checked price and history
    alert.lastCheckedPrice = currentPrice;
    alert.priceHistory.push({ price: currentPrice, timestamp: new Date() });

    // Keep only last 50 entries to avoid model bloat
    if (alert.priceHistory.length > 50) {
      alert.priceHistory.shift();
    }

    await alert.save();

    console.log(`   Current Price: ₹${currentPrice}`);
    console.log(`   Price Difference: ₹${currentPrice - alert.targetPrice}`);

    // Compare
    if (currentPrice <= alert.targetPrice) {
      result.triggered = true;
      console.log(`    PRICE ALERT TRIGGERED! Price dropped below target.`);

      // Update alert
      alert.isTriggered = true;
      alert.triggeredAt = new Date();
      alert.currentPrice = currentPrice;
      await alert.save();

      // Notify user via Email
      try {
        await sendEmail({
          to: alert.userEmail,
          subject: " Price Drop Alert!",
          text: `Great news! The price for "${alert.productName}" has dropped to ₹${currentPrice}, which is below your target price of ₹${alert.targetPrice}.\n\nCheck it out now!`,
        });
        console.log(`    Notification email sent to ${alert.userEmail}`);
      } catch (emailError) {
        console.error(`    Failed to send notification email:`, emailError.message);
      }

      // Notify user via SMS
      if (alert.userPhone) {
        try {
          await smsService.sendSMS({
            to: alert.userPhone,
            message: `[PriceCompare] 🎉 Price Drop! "${alert.productName}" is now ₹${currentPrice}. Target: ₹${alert.targetPrice}. Check it out!`
          });
        } catch (smsError) {
          console.error(`    Failed to send SMS:`, smsError.message);
        }
      }
    } else {
      console.log(`    Price still above target. Continuing to monitor...`);
    }

  } catch (alertError) {
    result.error = alertError.message;
    console.error(`\n Error processing alert ID ${alert._id}:`, alertError.message);
    console.error(`   Stack trace:`, alertError.stack);

    // Log alert details for debugging
    console.error(`   Alert details:`, {
      id: alert._id,
      productName: alert.productName,
      store: alert.store,
      userEmail: alert.userEmail
    });
  }

  return result;
}

/**
 * Process alerts in batches with concurrency control
 * @param {Array} alerts - Array of alert documents
 * @returns {Promise<Object>} - Summary of processing results
 */
async function processAlertsInBatches(alerts) {
  const results = {
    checked: 0,
    triggered: 0,
    errors: 0,
    details: []
  };

  // Process alerts in batches
  for (let i = 0; i < alerts.length; i += CONCURRENT_BATCH_SIZE) {
    const batch = alerts.slice(i, i + CONCURRENT_BATCH_SIZE);
    const batchNumber = Math.floor(i / CONCURRENT_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(alerts.length / CONCURRENT_BATCH_SIZE);

    console.log(`\n Processing batch ${batchNumber}/${totalBatches} (${batch.length} alerts)...`);

    // Process batch concurrently
    const batchPromises = batch.map((alert, batchIndex) =>
      processAlert(alert, i + batchIndex, alerts.length)
    );

    const batchResults = await Promise.allSettled(batchPromises);

    // Process results
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const alertResult = result.value;
        results.checked++;
        results.details.push(alertResult);

        if (alertResult.triggered) {
          results.triggered++;
        }
        if (alertResult.error) {
          results.errors++;
        }
      } else {
        results.errors++;
        results.checked++;
        results.details.push({
          alertId: batch[index]._id,
          success: false,
          triggered: false,
          price: null,
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    // Delay between batches (except for the last batch)
    if (i + CONCURRENT_BATCH_SIZE < alerts.length) {
      console.log(` Waiting ${BATCH_DELAY_MS}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return results;
}

// Every 30 minutes
cron.schedule("*/30 * * * *", async () => {
  const startTime = Date.now();
  console.log(`⏱ Running price alert check at ${new Date().toISOString()}...`);

  try {
    // 1️ Get all active alerts
    const alerts = await Alert.find({ isTriggered: false });
    console.log(` Found ${alerts.length} active alert(s) to check`);

    if (alerts.length === 0) {
      console.log(" No active alerts to check");
      return;
    }

    // Process alerts in batches
    const results = await processAlertsInBatches(alerts);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n Price alert check completed in ${duration}s`);
    console.log(`   Checked: ${results.checked} alerts`);
    console.log(`   Triggered: ${results.triggered} alerts`);
    console.log(`   Errors: ${results.errors} alerts`);
    console.log(`   Average time per alert: ${(duration / results.checked).toFixed(2)}s`);

  } catch (error) {
    console.error(`\n Fatal error in price alert cron job:`, error.message);
    console.error(`   Stack trace:`, error.stack);
    console.error(`   Error occurred at:`, new Date().toISOString());
  }
});
