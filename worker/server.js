/**
 * Scraping Worker Service
 * Deploy this separately to Railway/Render/Fly.io
 * 
 * This service handles the heavy scraping workload with no timeout limits
 */

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Worker connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Import models and services
const Job = require('./models/Job');
const browserManager = require('./utils/BrowserManager');

// Import scrapers
const AmazonSearchScraper = require('./scrapers/searchScrapers/amazonSearch');
const FlipkartSearchScraper = require('./scrapers/searchScrapers/flipkartSearch');
const CromaSearchScraper = require('./scrapers/searchScrapers/cromaSearch');
const RelianceSearchScraper = require('./scrapers/searchScrapers/relianceSearch');

// Security middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const secret = process.env.WORKER_SECRET || 'default-secret';

    if (authHeader === `Bearer ${secret}`) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

/**
 * POST /scrape
 * Process a scraping job (no timeout limit!)
 */
app.post('/scrape', authenticate, async (req, res) => {
    const { jobId, query, category } = req.body;

    if (!jobId || !query) {
        return res.status(400).json({ error: 'jobId and query are required' });
    }

    // Acknowledge immediately
    res.json({ status: 'accepted', jobId, message: 'Job processing started' });

    // Process in background (don't await on response)
    processScrapingJob(jobId, query, category).catch(err => {
        console.error(`❌ Job ${jobId} failed:`, err);
    });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

/**
 * Process scraping job with sequential execution
 * Optimized for 1GB RAM limit
 */
async function processScrapingJob(jobId, query, category) {
    console.log(`🚀 Processing job ${jobId} for query "${query}"`);

    try {
        // Update job status
        await Job.findByIdAndUpdate(jobId, {
            status: 'running',
            progress: 'Initializing browser...'
        });

        // Initialize browser once (reuse for all scrapers)
        await browserManager.init();
        console.log(`✅ Browser initialized for job ${jobId}`);

        // Define scrapers
        const scrapers = [
            { name: 'Amazon', scraper: new AmazonSearchScraper(browserManager) },
            { name: 'Flipkart', scraper: new FlipkartSearchScraper(browserManager) },
            { name: 'Croma', scraper: new CromaSearchScraper(browserManager) },
            { name: 'Reliance', scraper: new RelianceSearchScraper(browserManager) }
        ];

        const allResults = [];
        const errors = [];
        const platformStatus = {};

        // Initialize platform status
        scrapers.forEach(s => {
            platformStatus[s.name.toLowerCase()] = 'pending';
        });

        // SEQUENTIAL scraping to stay within 1GB RAM limit
        for (const { name, scraper } of scrapers) {
            try {
                console.log(`Job ${jobId}: Scraping ${name}...`);

                // Update status
                platformStatus[name.toLowerCase()] = 'scraping';
                await Job.findByIdAndUpdate(jobId, {
                    progress: `Scraping ${name}...`,
                    platformStatus
                });

                // Scrape with timeout
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Timeout: ${name} took too long`)), 45000)
                );

                const products = await Promise.race([
                    scraper.search(query, { category }),
                    timeoutPromise
                ]);

                console.log(`✅ Job ${jobId}: ${name} found ${products.length} products`);

                // Update status
                platformStatus[name.toLowerCase()] = 'completed';
                allResults.push(...products);

                // Update job with incremental results
                await Job.findByIdAndUpdate(jobId, {
                    progress: `${name} completed: ${products.length} products found`,
                    results: allResults,
                    platformStatus
                });

            } catch (err) {
                console.error(`❌ Job ${jobId}: ${name} failed:`, err.message);

                platformStatus[name.toLowerCase()] = 'failed';
                errors.push({
                    platform: name,
                    error: err.message,
                    type: err.message.includes('PLATFORM_BLOCKED') ? 'blocked' : 'error'
                });

                await Job.findByIdAndUpdate(jobId, {
                    errors,
                    platformStatus
                });
            }
        }

        // Process results (deduplicate, rank, filter)
        console.log(`Job ${jobId}: Processing ${allResults.length} total results...`);

        const { sortByRelevance } = require('./utils/relevanceScorer');
        const normalizeSearchProduct = require('./utils/normalizer').normalizeSearchProduct;

        // Validate and transform
        const validProducts = [];
        for (const product of allResults) {
            try {
                const validated = normalizeSearchProduct(product);
                validProducts.push(validated);
            } catch (err) {
                console.warn(`Validation failed for product: ${product.title}`);
            }
        }

        // Deduplicate
        const seen = new Set();
        const uniqueProducts = [];
        for (const p of validProducts) {
            const key = `${(p.source || '').toLowerCase()}::${(p.title || '').toLowerCase().trim().replace(/\s+/g, ' ')}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueProducts.push(p);
            }
        }

        // Apply relevance ranking
        const rankedProducts = sortByRelevance(uniqueProducts, query, category, {
            minScore: -20,
            includeScore: false,
            secondarySortByPrice: true
        });

        console.log(`✅ Job ${jobId}: Completed. ${rankedProducts.length} products after processing.`);

        // Update job as completed
        await Job.findByIdAndUpdate(jobId, {
            status: 'completed',
            progress: `Found ${rankedProducts.length} products`,
            results: rankedProducts,
            endTime: Date.now()
        });

    } catch (error) {
        console.error(`❌ Job ${jobId} processing error:`, error);

        await Job.findByIdAndUpdate(jobId, {
            status: 'failed',
            progress: 'Search failed',
            errors: [{ platform: 'system', error: error.message, type: 'error' }],
            endTime: Date.now()
        });
    }
}

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Worker service running on port ${PORT}`);
    console.log(`📊 Memory limit: 1GB (Vercel-compatible)`);
    console.log(`⚡ No timeout limits on this service`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing browser...');
    await browserManager.close();
    mongoose.connection.close();
    process.exit(0);
});
