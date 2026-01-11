const AmazonSearchScraper = require("../scrapers/searchScrapers/amazonSearch");
const FlipkartSearchScraper = require("../scrapers/searchScrapers/flipkartSearch");
const CromaSearchScraper = require("../scrapers/searchScrapers/cromaSearch");
const RelianceSearchScraper = require("../scrapers/searchScrapers/relianceSearch");
const AmazonScraper = require("../scrapers/amazon");
const FlipkartScraper = require("../scrapers/flipkart");
const CromaScraper = require("../scrapers/croma");
const RelianceScraper = require("../scrapers/reliance");
const Product = require("../models/product");
const browserManager = require("../utils/BrowserManager");
const rateLimiter = require("../utils/rateLimiter");
const proxyManager = require("../utils/proxyManager");
const normalizeSearchProduct = require("../utils/normalizer").normalizeSearchProduct;
const cacheManager = require("../utils/cacheManager");

/**
 * Detect platform from URL
 * @param {string} url - Product URL
 * @returns {string|null} - Platform name (amazon, flipkart, croma, reliance) or null
 */
function detectPlatformFromUrl(url) {
  if (!url || typeof url !== 'string') return null;

  const urlLower = url.toLowerCase();
  if (urlLower.includes('amazon.in') || urlLower.includes('amazon.com')) return 'amazon';
  if (urlLower.includes('flipkart.com')) return 'flipkart';
  if (urlLower.includes('croma.com')) return 'croma';
  if (urlLower.includes('reliancedigital.in') || urlLower.includes('reliance')) return 'reliance';

  return null;
}

/**
 * Scrape a specific product page URL using detail scrapers
 * @param {string} productUrl - Direct URL to the product page
 * @returns {Promise<number>} - The current price from the product page
 * @throws {Error} - If scraping fails or price not found
 */
async function scrapeProductPage(productUrl) {
  if (!productUrl || !productUrl.trim()) {
    throw new Error("Product URL is required");
  }

  const url = productUrl.trim();
  console.log(`🔍 Scraping product page: ${url}`);

  try {
    // Detect platform from URL
    const platform = detectPlatformFromUrl(url);
    if (!platform) {
      throw new Error(`Unable to detect platform from URL: ${url}`);
    }

    console.log(`📦 Detected platform: ${platform}`);

    // Apply rate limiting
    await rateLimiter.waitForAvailability(platform);
    rateLimiter.recordRequest(platform);
    console.log(`📊 Rate limit: ${rateLimiter.getRequestCount(platform)}/${rateLimiter.getRateLimit(platform)} requests for ${platform}`);

    // Initialize browser if needed (with proxy rotation if available)
    let browserInitAttempts = 0;
    const maxBrowserAttempts = 3;
    let proxyUsed = null;

    while (browserInitAttempts < maxBrowserAttempts) {
      try {
        // Get proxy if available
        const proxy = proxyManager.hasProxies() ? proxyManager.getNextProxy() : null;
        proxyUsed = proxy;

        await browserManager.init(proxy);
        break;
      } catch (e) {
        browserInitAttempts++;
        console.error(`⚠️ Browser init failed (attempt ${browserInitAttempts}):`, e.message);

        // Mark proxy as failed if used
        if (proxyUsed) {
          proxyManager.markProxyFailed(proxyUsed);
        }

        if (browserInitAttempts >= maxBrowserAttempts) {
          throw new Error(`Browser initialization failed after ${maxBrowserAttempts} attempts`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * browserInitAttempts));
      }
    }

    // Get the appropriate detail scraper
    let scraper;
    switch (platform) {
      case 'amazon':
        scraper = new AmazonScraper(browserManager);
        break;
      case 'flipkart':
        scraper = new FlipkartScraper(browserManager);
        break;
      case 'croma':
        scraper = new CromaScraper(browserManager);
        break;
      case 'reliance':
        scraper = new RelianceScraper(browserManager);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Scrape the product page
    console.log(`🚀 Scraping ${platform} product page...`);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${platform} product page scraping took too long`)), 60000)
    );

    let productData;
    try {
      productData = await Promise.race([
        scraper.scrape(url),
        timeoutPromise
      ]);

      // Mark proxy as successful if used
      if (proxyUsed) {
        proxyManager.markProxySuccess(proxyUsed);
      }
    } catch (scrapeError) {
      // Mark proxy as failed if scraping failed
      if (proxyUsed) {
        proxyManager.markProxyFailed(proxyUsed);
      }
      throw scrapeError;
    }

    // Extract price from normalized product data
    if (!productData || !productData.price || !productData.price.current) {
      throw new Error(`No price found on product page: ${url}`);
    }

    const price = productData.price.current;

    if (!price || price <= 0) {
      throw new Error(`Invalid price found: ${price}`);
    }

    console.log(`✅ Scraped price from ${platform}: ₹${price} for "${productData.title || 'product'}"`);

    return price;

  } catch (error) {
    console.error(`❌ Error scraping product page "${url}":`, error.message);
    throw error;
  }
}

/**
 * Get the latest price for a product from a specific store
 * @param {string} productName - Name of the product to search for
 * @param {string|string[]} stores - Store(s) to search (single string or array of strings)
 * @param {string} productUrl - Optional: Direct URL to product page
 * @returns {Promise<number>} - The lowest price found
 * @throws {Error} - If no price is found or scraping fails
 */
async function getLatestPrice(productName, stores, productUrl = null) {
  // If productUrl is provided, use direct page scraping instead of search
  if (productUrl && productUrl.trim()) {
    console.log(`📎 Product URL provided, using direct page scraping instead of search`);
    try {
      return await scrapeProductPage(productUrl);
    } catch (error) {
      console.warn(`⚠️ Direct page scraping failed: ${error.message}. Falling back to search method.`);
      // Fall through to search method if direct scraping fails
    }
  }

  if (!productName || !productName.trim()) {
    throw new Error("Product name is required when productUrl is not available");
  }

  const query = productName.trim().toLowerCase();
  const storesToSearch = Array.isArray(stores) ? stores.map(s => s.toLowerCase().trim()) : (stores ? [stores.toLowerCase().trim()] : []);

  console.log(`🔍 Getting latest price for "${query}"${storesToSearch.length > 0 ? ` from stores: ${storesToSearch.join(', ')}` : ''}`);

  // Check cache first
  const cacheKey = `price::${query}::${storesToSearch.sort().join(',') || 'all'}`;
  const cachedPrice = cacheManager.get(cacheKey);
  if (cachedPrice) {
    console.log(`🎯 Cache HIT for "${query}": ₹${cachedPrice}`);
    return cachedPrice;
  }

  try {
    // Use searchService to delegate to Worker
    const searchService = require('./searchService');
    const { jobId, status } = await searchService.startScraping(query, 'electronics');

    console.log(`⏳ Job ${jobId} started for alert check. Waiting for results...`);

    // Poll for completion
    let job = await searchService.getJobStatus(jobId);
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds (2s interval)

    while (job.status !== 'completed' && job.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      job = await searchService.getJobStatus(jobId);
      attempts++;
      if (attempts % 5 === 0) console.log(`   Waiting for Job ${jobId}... (${attempts}/${maxAttempts})`);
    }

    if (job.status !== 'completed') {
      throw new Error(`Scraping job ${jobId} failed or timed out. Status: ${job.status}`);
    }

    const allProducts = job.results || [];

    // Filter by stores if specified
    const filteredProducts = allProducts.filter(p => {
      if (!p.price || p.price <= 0) return false;
      if (storesToSearch.length > 0 && p.source) {
        return storesToSearch.includes(p.source.toLowerCase());
      }
      return true;
    });

    if (filteredProducts.length === 0) {
      // Try DB fallback if worker found nothing? 
      // searchService result ALREADY includes DB results.
      throw new Error(`No valid products found for "${query}"`);
    }

    // Find lowest price
    filteredProducts.sort((a, b) => a.price - b.price);
    const lowestPrice = filteredProducts[0].price;

    console.log(`✅ Found lowest price: ₹${lowestPrice} for "${query}" (from ${filteredProducts.length} results)`);

    // Cache the result for 15 minutes
    cacheManager.set(cacheKey, lowestPrice, 15 * 60 * 1000);

    return lowestPrice;

  } catch (error) {
    console.error(`❌ Error getting latest price for "${query}":`, error.message);
    throw error;
  }
}

module.exports = {
  getLatestPrice,
  scrapeProductPage,
  detectPlatformFromUrl
};

