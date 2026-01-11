# Optimization: Browser Pooling

## Goal
Reduce overhead and increase reliability by reusing browser instances instead of launching a new one for every scraping task.

## Implementation Details
1.  **Singleton Pattern**: `BrowserManager.js` implements a singleton pattern that maintains a single, persistent browser instance.
2.  **Connection Monitoring**: Checks if the browser is still connected before every page creation. If disconnected, it reinitializes automatically.
3.  **Concurrency Control**: A `pageCreationQueue` ensures that multiple requests don't try to connect to the browser at the exact same millisecond, preventing "target closed" errors.
4.  **Resource Optimization**: Disables unnecessary features (images, fonts, stylesheets) to save bandwidth and CPU.

## Current State
- ✅ `BrowserManager.js` is implemented as a singleton.
- ✅ `scrapeService.js` and `searchService.js` use `BrowserManager` to get pages.
- ✅ Cron job processes multiple alerts using the same browser instance.

## Future Enhancements
- Multiple browser instances in a pool (for ultra-high concurrency).
- Automatic browser restart after X pages to prevent memory leaks.
