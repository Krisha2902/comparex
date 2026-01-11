/**
 * SMS Notification Service
 * Placeholder for SMS gateway integration (e.g., Twilio, Vonage)
 */
class SMSService {
    constructor() {
        // Configuration for SMS provider
        this.apiKey = process.env.SMS_API_KEY;
        this.apiSecret = process.env.SMS_API_SECRET;
        this.fromNumber = process.env.SMS_FROM_NUMBER;
    }

    /**
     * Send SMS notification
     * @param {Object} options - SMS options
     * @param {string} options.to - Recipient phone number
     * @param {string} options.message - SMS message content
     * @returns {Promise<boolean>} - Success status
     */
    async sendSMS({ to, message }) {
        console.log(`\n📱 [SMS SERVICE] Sending SMS...`);
        console.log(`   To: ${to}`);
        console.log(`   Message: ${message}`);

        // If API key is missing, just log and return (development mode)
        if (!this.apiKey || this.apiKey === 'your_api_key_here' || this.apiKey.startsWith('SK')) {
            // Note: SK... is an API Key, distinct from Account SID (AC...) usually used for Twilio. 
            // We'll assume the user has configured SID/AUTH correctly in .env based on the variable names TWILIO_SID and TWILIO_AUTH used elsewhere.
            // However, the constructor currently reads SMS_API_KEY. Let's fix the constructor to use the correct env vars first.
        }

        // Re-reading config here to ensure we get the latest env vars or use the ones from the file
        const accountSid = process.env.TWILIO_SID;
        const authToken = process.env.TWILIO_AUTH;
        const fromNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.SMS_FROM_NUMBER; // Fallback

        if (!accountSid || !authToken || accountSid === 'your_twilio_sid') {
            console.log(`   ⚠️ Twilio credentials not configured. SMS not sent but logged above.`);
            return true;
        }

        try {
            const client = require('twilio')(accountSid, authToken);

            // Check if 'to' or 'from' indicates WhatsApp
            let finalFrom = fromNumber;
            let finalTo = to;

            // If the user seems to want WhatsApp (based on variable names in .env)
            if (finalFrom && finalFrom.startsWith('whatsapp:')) {
                if (!finalTo.startsWith('whatsapp:')) {
                    finalTo = `whatsapp:${finalTo}`;
                }
            }

            const response = await client.messages.create({
                body: message,
                from: finalFrom,
                to: finalTo
            });

            console.log(`   ✅ SMS/WhatsApp sent successfully. SID: ${response.sid}`);
            return true;
        } catch (error) {
            console.error(`   ❌ Failed to send SMS via provider:`, error.message);
            return false;
        }
    }
}

module.exports = new SMSService();
