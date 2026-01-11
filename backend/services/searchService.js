const axios = require('axios');
const AmazonSearchScraper = require("../scrapers/searchScrapers/amazonSearch");
const FlipkartSearchScraper = require("../scrapers/searchScrapers/flipkartSearch");
const CromaSearchScraper = require("../scrapers/searchScrapers/cromaSearch");
const RelianceSearchScraper = require("../scrapers/searchScrapers/relianceSearch");
const Product = require("../models/product");
const Job = require("../models/Job"); // Import Job model
const browserManager = require("../utils/BrowserManager");

async function startScraping(query, category = 'electronics') {
  try {
    // 1. Check for existing completed/running job (cache hit)
    // Reduce cache to 1 minute for better testing experience
    const timeWindow = Date.now() - (1 * 60 * 1000);
    let existingJob = await Job.findOne({
      query: { $regex: new RegExp(`^${query}$`, 'i') },
      category: category,
      updatedAt: { $gt: new Date(timeWindow) },
      status: { $in: ['completed', 'running'] }
    }).sort({ createdAt: -1 });

    // If cached job has no results and is completed, treat as invalid/expired
    if (existingJob && existingJob.status === 'completed' && (!existingJob.results || existingJob.results.length === 0)) {
      existingJob = null;
    }

    if (existingJob) {
      console.log(`♻️ Reusing existing job ${existingJob._id} for query "${query}"`);
      return {
        jobId: existingJob._id,
        status: existingJob.status,
        cached: true
      };
    }

    // 2. Create new Job in DB
    const job = new Job({
      query,
      category,
      status: 'pending',
      progress: 'Initializing search...'
    });
    await job.save();
    const jobId = job._id;

    console.log(`🆕 Created new job ${jobId} for "${query}"`);

    // 3. Dispatch Job (Worker or Local)
    const workerUrl = process.env.WORKER_URL;

    if (workerUrl) {
      try {
        console.log(`📡 Dispatching job ${jobId} to Worker at ${workerUrl}`);
        // Fire and forget - don't await the completion of the scrape, just the acknowledgement
        axios.post(`${workerUrl}/scrape`, {
          jobId: jobId.toString(),
          query,
          category
        }, {
          timeout: 5000,
          headers: { 'Authorization': `Bearer ${process.env.WORKER_SECRET || 'default-secret'}` }
        }).catch(err => {
          console.error(`❌ Worker dispatch failed: ${err.message}. Falling back to local.`);
          runScrapersLocal(jobId, query, category);
        });
      } catch (err) {
        console.warn(`Worker unavailable, running locally: ${err.message}`);
        runScrapersLocal(jobId, query, category);
      }
    } else {
      console.log(`🏠 No WORKER_URL set, running locally.`);
      runScrapersLocal(jobId, query, category);
    }

    return { jobId, status: 'pending' };
  } catch (error) {
    console.error("Start scraping error:", error);
    throw error;
  }
}

async function getJobStatus(jobId) {
  try {
    // Check if valid ObjectId
    if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
      return null;
    }
    const job = await Job.findById(jobId);
    if (!job) return null;

    // Transform for API response
    return {
      id: job._id,
      status: job.status,
      progress: job.progress,
      results: job.results,
      errors: job.errors,
      platformStatus: job.platformStatus,
      query: job.query
    };
  } catch (err) {
    console.error(`Get job status error: ${err.message}`);
    return null;
  }
}

async function getAllJobs() {
  // For debug endpoint - limit to last 20
  const jobs = await Job.find().sort({ createdAt: -1 }).limit(20);
  // Convert array to object map to match previous API contract
  return jobs.reduce((acc, job) => {
    acc[job._id] = job;
    return acc;
  }, {});
}

// Local Runner (Fallback)
async function runScrapersLocal(jobId, query, category) {
  console.log(`🚀 Job ${jobId}: Starting LOCAL scraping for "${query}"`);

  try {
    await Job.findByIdAndUpdate(jobId, {
      status: 'running',
      progress: 'Initializing browser...'
    });

    // Initialize browser
    try {
      await browserManager.init();
    } catch (e) {
      console.error(`❌ Job ${jobId}: Browser init failed:`, e.message);
      await Job.findByIdAndUpdate(jobId, { status: 'failed', errors: [{ platform: 'system', error: 'Browser init failed' }] });
      return;
    }

    const scrapers = [
      new AmazonSearchScraper(browserManager),
      new FlipkartSearchScraper(browserManager),
      new CromaSearchScraper(browserManager),
      new RelianceSearchScraper(browserManager),
    ];

    const platformStatus = {};
    scrapers.forEach(s => platformStatus[s.platform] = 'pending');
    await Job.findByIdAndUpdate(jobId, { platformStatus });

    const allResults = [];
    const errors = [];

    // Run sequentially locally to save resources
    for (const scraper of scrapers) {
      try {
        platformStatus[scraper.platform] = 'scraping';
        await Job.findByIdAndUpdate(jobId, {
          progress: `Scraping ${scraper.platform}...`,
          platformStatus
        });

        console.log(`Job ${jobId}: Scraping ${scraper.platform}...`);

        // Timeout per platform (pageLoad + overhead)
        const timeoutMs = (require('../config/scraperConfig').timeouts.pageLoad) + 20000;
        const products = await Promise.race([
          scraper.search(query, { category }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
        ]);

        allResults.push(...products);
        platformStatus[scraper.platform] = 'completed';

        // Incremental update
        await Job.findByIdAndUpdate(jobId, {
          progress: `${scraper.platform} found ${products.length} items`,
          platformStatus,
          $push: { results: { $each: products } }
        });

      } catch (err) {
        console.error(`Job ${jobId}: ${scraper.platform} error:`, err.message);
        platformStatus[scraper.platform] = 'failed';
        errors.push({ platform: scraper.platform, error: err.message });

        await Job.findByIdAndUpdate(jobId, { platformStatus, errors });
      }
    }

    // Process and finalize
    processResultsAndComplete(jobId, allResults, query, category);

  } catch (error) {
    console.error(`❌ Job ${jobId}: Fatal error`, error);
    await Job.findByIdAndUpdate(jobId, { status: 'failed', error: error.message });
  }
}

async function processResultsAndComplete(jobId, scrapedResults, query, category) {
  // Also fetch from DB
  const dbProducts = await searchDatabase(query, category);
  const allProducts = [...scrapedResults, ...dbProducts];

  // Deduplicate logic
  const seen = new Set();
  const uniqueProducts = [];
  const normalizeSearchProduct = require('../utils/normalizer').normalizeSearchProduct;

  for (const p of allProducts) {
    try {
      // Normalize before dedup
      const validated = normalizeSearchProduct(p);
      const key = `${(validated.source || '').toLowerCase()}::${(validated.title || '').toLowerCase().trim().replace(/\s+/g, ' ')}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueProducts.push(validated);
      }
    } catch (e) { /* ignore invalid */ }
  }

  // Sort/Rank
  const { sortByRelevance } = require('../utils/relevanceScorer');
  const rankedProducts = sortByRelevance(uniqueProducts, query, category, {
    minScore: -20,
    secondarySortByPrice: true
  });

  // Discount calc
  const finalResults = rankedProducts.map(product => {
    if (product.originalPrice && product.price && product.originalPrice > product.price) {
      product.discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return product;
  });

  console.log(`✅ Job ${jobId}: Completed with ${finalResults.length} results.`);

  await Job.findByIdAndUpdate(jobId, {
    status: 'completed',
    progress: `Found ${finalResults.length} products`,
    results: finalResults,
    endTime: Date.now()
  });
}

async function searchDatabase(query, category) {
  try {
    const searchRegex = new RegExp(query, 'i');
    const products = await Product.find({
      title: searchRegex,
      category: new RegExp(category, 'i')
    }).limit(20);

    return products.map(p => ({
      title: p.title,
      price: p.price,
      image: p.image || null,
      productUrl: p.productUrl || `/product/${p._id}`,
      source: p.source || 'Database',
      rating: p.rating,
      availability: true
    }));
  } catch (e) {
    return [];
  }
}

module.exports = {
  startScraping,
  getJobStatus,
  getAllJobs
};
