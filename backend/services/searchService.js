
const AmazonSearchScraper = require("../scrapers/searchScrapers/amazonSearch");
const FlipkartSearchScraper = require("../scrapers/searchScrapers/flipkartSearch");
const CromaSearchScraper = require("../scrapers/searchScrapers/cromaSearch");
const RelianceSearchScraper = require("../scrapers/searchScrapers/relianceSearch");
const Product = require("../models/product");
const browserManager = require("../utils/BrowserManager");

// In-memory job store
const jobs = {};

const generateJobId = () => Math.random().toString(36).substring(7);

async function startScraping(query, category) {
  // P2-4: Check for existing recent jobs with same query (within 5 minutes)
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  const existingJob = Object.values(jobs).find(job =>
    job.query.toLowerCase() === query.toLowerCase() &&
    job.category === category &&
    job.startTime > fiveMinutesAgo &&
    (job.status === 'completed' || job.status === 'running')
  );

  if (existingJob) {
    console.log(`♻️ Reusing existing job ${existingJob.id} for query "${query}"`);
    if (existingJob.status === 'completed') {
      // Return completed job immediately
      return { jobId: existingJob.id, status: 'completed', cached: true };
    } else {
      // Return running job ID for polling
      return { jobId: existingJob.id, status: 'running', cached: true };
    }
  }

  const jobId = generateJobId();
  jobs[jobId] = {
    id: jobId,
    status: "pending", // pending, running, completed, failed
    progress: "Initializing search...", // Human-readable progress message
    query,
    category,
    results: [],
    errors: [],
    platformStatus: {}, // { amazon: 'pending'|'scraping'|'completed'|'failed', ... }
    startTime: Date.now()
  };

  // Start scraping asynchronously (fire and forget)
  runScrapers(jobId, query, category);

  // Schedule cleanup if not already running
  if (!global.jobCleanupInterval) {
    global.jobCleanupInterval = setInterval(cleanupOldJobs, 60 * 60 * 1000); // Run every hour
  }

  return { jobId, status: "pending" };
}

function cleanupOldJobs() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  let cleanedCount = 0;

  Object.keys(jobs).forEach(jobId => {
    if (jobs[jobId].startTime < oneHourAgo) {
      delete jobs[jobId];
      cleanedCount++;
    }
  });

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} old search jobs`);
  }
}

async function runScrapers(jobId, query, category) {
  const job = jobs[jobId];
  job.status = "running";
  job.progress = "Initializing browser...";

  console.log(`🚀 Job ${jobId}: Starting scraping for "${query}"`);

  // Initialize browser - may need multiple attempts
  let browserInitAttempts = 0;
  const maxBrowserAttempts = 3;

  while (browserInitAttempts < maxBrowserAttempts) {
    try {
      await browserManager.init();
      console.log(`✅ Job ${jobId}: Browser initialized (attempt ${browserInitAttempts + 1})`);
      break;
    } catch (e) {
      browserInitAttempts++;
      console.error(`⚠️ Job ${jobId}: Browser init failed (attempt ${browserInitAttempts}):`, e.message);

      if (browserInitAttempts >= maxBrowserAttempts) {
        console.error(`❌ Job ${jobId}: Failed to init browser after ${maxBrowserAttempts} attempts`);
        job.status = "failed";
        job.error = `Browser initialization failed after ${maxBrowserAttempts} attempts`;
        return;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * browserInitAttempts));
    }
  }

  // Define scrapers - Instantiate with singleton browserManager (all 4 platforms)
  const scrapers = [
    new AmazonSearchScraper(browserManager),
    new FlipkartSearchScraper(browserManager),
    new CromaSearchScraper(browserManager),
    new RelianceSearchScraper(browserManager),
  ];

  // Initialize platform status
  scrapers.forEach(s => {
    job.platformStatus[s.platform] = 'pending';
  });

  // Helper to run a single scraper with retry logic
  const scrapePlatform = async (scraper) => {
    const maxRetries = 2;
    let attempt = 0;

    // Update platform status
    job.platformStatus[scraper.platform] = 'scraping';
    job.progress = `Scraping ${scraper.platform}...`;

    while (attempt < maxRetries) {
      try {
        console.log(`Job ${jobId}: Scraping ${scraper.platform}... (attempt ${attempt + 1})`);

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${scraper.platform} took too long`)), 40000)
        );

        // Race between scraper and timeout — pass category through
        const products = await Promise.race([
          scraper.search(query, { category }),
          timeoutPromise
        ]);

        console.log(`✅ Job ${jobId}: ${scraper.platform} found ${products.length} products`);
        job.platformStatus[scraper.platform] = 'completed';
        job.progress = `${scraper.platform} completed: ${products.length} products found`;
        return products;
      } catch (err) {
        attempt++;
        console.error(`❌ Job ${jobId}: ${scraper.platform} failed (attempt ${attempt}): ${err.message}`);

        if (attempt >= maxRetries) {
          job.platformStatus[scraper.platform] = 'failed';
          const errorMsg = err.message.includes('PLATFORM_BLOCKED')
            ? `${scraper.platform} - Access blocked (CAPTCHA)`
            : `${scraper.platform} - ${err.message}`;
          job.errors.push({ platform: scraper.platform, error: errorMsg, type: err.message.includes('PLATFORM_BLOCKED') ? 'blocked' : 'error' });
          return [];
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  try {
    // Scrape sequentially instead of in parallel to avoid browser overload
    console.log(`Job ${jobId}: Starting sequential scraping...`);
    job.progress = "Scraping all platforms...";
    const scrappedResults = [];

    for (const scraper of scrapers) {
      try {
        const products = await scrapePlatform(scraper);
        scrappedResults.push(...products);
      } catch (err) {
        console.error(`Job ${jobId}: Error scraping ${scraper.platform}:`, err.message);
        job.platformStatus[scraper.platform] = 'failed';
      }
    }

    job.progress = "Processing results...";

    // Transform and validate scraped products
    const transformedScraped = [];
    for (const product of scrappedResults) {
      try {
        const normalizeSearchProduct = require('../utils/normalizer').normalizeSearchProduct;
        const validated = normalizeSearchProduct(product);
        transformedScraped.push(validated);
      } catch (err) {
        console.warn(`Job ${jobId}: Skipping invalid scraped product: ${product?.title}`);
      }
    }

    console.log(`Job ${jobId}: Valid scraped products: ${transformedScraped.length}/${scrappedResults.length}`);
    if (transformedScraped.length > 0) {
      console.log(`Job ${jobId}: Sample scraped product:`, JSON.stringify(transformedScraped[0], null, 2));
    }

    // Also fetch from DB for fallback/augmentation
    const dbProducts = await searchDatabase(query, category);
    console.log(`Job ${jobId}: Database products: ${dbProducts.length}`);

    // Combine transformed data
    const allProducts = [...transformedScraped, ...dbProducts];
    console.log(`Job ${jobId}: Total combined products: ${allProducts.length}`);

    // Deduplicate with proper normalization
    const seen = new Set();
    const uniqueProducts = [];
    for (const p of allProducts) {
      // Normalize key: trim, lowercase, remove extra spaces
      const key = `${(p.source || '').toLowerCase()}::${(p.title || '').toLowerCase().trim().replace(/\s+/g, ' ')}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueProducts.push(p);
      }
    }

    console.log(`Job ${jobId}: Unique products after dedup: ${uniqueProducts.length}`);

    // Apply relevance ranking with accessory filtering
    const { sortByRelevance } = require('../utils/relevanceScorer');

    console.log(`Job ${jobId}: Applying relevance ranking for query: "${query}", category: "${category || 'auto'}"`);

    const rankedProducts = sortByRelevance(uniqueProducts, query, category, {
      minScore: -20,  // Filter out products with very low relevance
      includeScore: false,  // Don't include score in output
      secondarySortByPrice: true  // Use price as tiebreaker
    });

    console.log(`Job ${jobId}: After relevance filtering: ${rankedProducts.length} products (filtered ${uniqueProducts.length - rankedProducts.length} irrelevant/accessories)`);

    job.results = rankedProducts;
    job.status = "completed";
    job.progress = job.results.length > 0
      ? `Found ${job.results.length} products`
      : job.errors.length > 0
        ? `Search completed with errors (${job.errors.length} platforms failed)`
        : "No products found";
    job.endTime = Date.now();
    console.log(`✅ Job ${jobId}: Completed. Found ${job.results.length} relevant products (from ${uniqueProducts.length} unique).`);

    // Log error summary if any
    if (job.errors.length > 0) {
      console.log(`⚠️ Job ${jobId}: Errors from ${job.errors.length} platform(s):`);
      job.errors.forEach(e => console.log(`  - ${e.platform}: ${e.error}`));
    }

    if (job.results.length > 0) {
      console.log(`Job ${jobId}: Best deal: ${job.results[0].title} @ ₹${job.results[0].price} from ${job.results[0].source}`);
      console.log(`Job ${jobId}: Sample final result:`, JSON.stringify(job.results[0], null, 2));
    }

  } catch (error) {
    console.error(`❌ Job ${jobId}: Fatal error`, error);
    job.status = "failed";
    job.error = error.message;
  }
}

function getJobStatus(jobId) {
  return jobs[jobId];
}

function getAllJobs() {
  return jobs;
}

// Helper to generate search URLs
function getSearchUrl(platform, query) {
  const q = encodeURIComponent(query);
  switch (platform) {
    case 'amazon': return `https://www.amazon.in/s?k=${q}`;
    case 'flipkart': return `https://www.flipkart.com/search?q=${q}`;
    case 'croma': return `https://www.croma.com/search/?q=${q}`;
    case 'reliance': return `https://www.reliancedigital.in/search?q=${q}`;
    default: return '';
  }
}

async function searchDatabase(query, category) {
  try {
    const searchRegex = new RegExp(query, 'i');
    const products = await Product.find({
      $or: [
        { title: searchRegex },
        { category: new RegExp(category, 'i') }
      ]
    }).limit(20);

    console.log(`Database search found ${products.length} products for "${query}"`);

    // Transform and validate database products
    const validProducts = [];
    const normalizeSearchProduct = require('../utils/normalizer').normalizeSearchProduct;

    for (const p of products) {
      // Only include products with valid prices
      if (!p.price || p.price <= 0) {
        console.warn(`Skipping DB product with invalid price: ${p.title} (price: ${p.price})`);
        continue;
      }

      try {
        const validated = normalizeSearchProduct({
          title: p.title,
          price: p.price,
          image: p.image || null,
          productUrl: p.productUrl || `/product/${p._id}`,
          source: p.source || 'Database',
          rating: p.rating && p.rating > 0 ? p.rating : null,
          availability: true
        });
        validProducts.push(validated);
      } catch (err) {
        console.warn(`Skipping DB product validation error: ${p.title}`);
      }
    }

    console.log(`Database returned ${validProducts.length} valid products (filtered from ${products.length})`);
    return validProducts;
  } catch (e) {
    console.error("DB Search failed", e);
    return [];
  }
}

module.exports = {
  startScraping,
  getJobStatus,
  getAllJobs
};
