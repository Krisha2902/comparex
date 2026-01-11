# Optimization: Caching

## Goal
Reduce the number of expensive scraping requests by caching price data for a short period.

## Implementation Details
1.  **Cache Manager**: `backend/utils/cacheManager.js` provides a simple in-memory storage with Time-To-Live (TTL) support.
2.  **Scrape Service Integration**:
    *   `getLatestPrice` now checks the cache before starting a search/scrape.
    *   Successful scraper results are cached for 15 minutes by default.
3.  **Keys**: Cache keys are generated based on the product name and the store (e.g., `price::iphone 15::amazon`).

## Benefits
- 🚀 Faster response times for repeated searches/checks.
- 📉 Reduced CPU and bandwidth usage.
- 🛡️ Lower risk of getting blocked by e-commerce platforms.

## Current State
- ✅ `cacheManager.js` utility created.
- ✅ Integrated into `scrapeService.js`.
- ✅ Default TTL set to 15 minutes for prices.
