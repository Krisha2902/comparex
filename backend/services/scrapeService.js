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

  const query = productName.trim();
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

    // If stores are specified, only scrape those stores
    let scrapers = [];
    if (storesToSearch.length > 0) {
      for (const s of storesToSearch) {
        switch (s) {
          case 'amazon':
            scrapers.push(new AmazonSearchScraper(browserManager));
            break;
          case 'flipkart':
            scrapers.push(new FlipkartSearchScraper(browserManager));
            break;
          case 'croma':
            scrapers.push(new CromaSearchScraper(browserManager));
            break;
          case 'reliance':
            scrapers.push(new RelianceSearchScraper(browserManager));
            break;
          default:
            console.warn(`Unknown store "${s}", skipping`);
        }
      }

      // If no valid scrapers found after filtering, fallback to all (unless strict matching is desired)
      if (scrapers.length === 0) {
        console.warn(`No valid stores found in specified list, searching all stores`);
        scrapers = [
          new AmazonSearchScraper(browserManager),
          new FlipkartSearchScraper(browserManager),
          new CromaSearchScraper(browserManager),
          new RelianceSearchScraper(browserManager)
        ];
      }
    } else {
      // If no stores specified, search all stores
      scrapers = [
        new AmazonSearchScraper(browserManager),
        new FlipkartSearchScraper(browserManager),
        new CromaSearchScraper(browserManager),
        new RelianceSearchScraper(browserManager)
      ];
    }

    // Scrape products from specified store(s) with rate limiting
    const allProducts = [];

    for (const scraper of scrapers) {
      try {
        // Apply rate limiting per platform
        await rateLimiter.waitForAvailability(scraper.platform);
        rateLimiter.recordRequest(scraper.platform);
        console.log(`📊 Rate limit: ${rateLimiter.getRequestCount(scraper.platform)}/${rateLimiter.getRateLimit(scraper.platform)} requests for ${scraper.platform}`);

        console.log(`Scraping ${scraper.platform} for "${query}"...`);

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${scraper.platform} took too long`)), 40000)
        );

        let products;
        try {
          products = await Promise.race([
            scraper.search(query, { category: 'electronics' }),
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

        console.log(`✅ ${scraper.platform} found ${products.length} products`);
        allProducts.push(...products);
      } catch (err) {
        console.error(`❌ Error scraping ${scraper.platform}:`, err.message);
        // Continue with other scrapers even if one fails
      }
    }

    // Also check database for fallback
    try {
      const searchRegex = new RegExp(query, 'i');
      const dbProducts = await Product.find({
        $or: [
          { title: searchRegex }
        ]
      }).limit(10);

      for (const p of dbProducts) {
        if (p.price && p.price > 0) {
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
            allProducts.push(validated);
          } catch (err) {
            console.warn(`Skipping DB product validation error: ${p.title}`);
          }
        }
      }
    } catch (dbErr) {
      console.error("Database search failed:", dbErr.message);
    }

    // Validate and normalize products
    const validProducts = [];
    for (const product of allProducts) {
      try {
        const validated = normalizeSearchProduct(product);

        // Filter by store if specified
        if (storesToSearch.length > 0 && validated.source && !storesToSearch.includes(validated.source.toLowerCase())) {
          continue;
        }

        if (validated.price && validated.price > 0) {
          validProducts.push(validated);
        }
      } catch (err) {
        console.warn(`Skipping invalid product: ${product?.title}`);
      }
    }

    if (validProducts.length === 0) {
      throw new Error(`No valid products found for "${query}"${storeLower ? ` from ${storeLower}` : ''}`);
    }

    // Sort by price and return the lowest
    validProducts.sort((a, b) => a.price - b.price);
    const lowestPrice = validProducts[0].price;

    console.log(`✅ Found lowest price: ₹${lowestPrice} for "${query}"${storesToSearch.length > 0 ? ` from ${storesToSearch.join(', ')}` : ''} (from ${validProducts.length} products)`);

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

