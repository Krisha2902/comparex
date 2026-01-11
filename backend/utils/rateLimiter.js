/**
 * Rate Limiter Utility
 * Controls the rate of requests per platform to avoid being blocked
 */
class RateLimiter {
  constructor() {
    // Track requests per platform
    // Format: { platform: { count: number, resetAt: timestamp } }
    this.requestCounts = {};

    // Default rate limits per platform (requests per minute)
    this.rateLimits = {
      amazon: parseInt(process.env.AMAZON_RATE_LIMIT) || 10, // 10 requests per minute
      flipkart: parseInt(process.env.FLIPKART_RATE_LIMIT) || 12, // 12 requests per minute
      croma: parseInt(process.env.CROMA_RATE_LIMIT) || 15, // 15 requests per minute
      reliance: parseInt(process.env.RELIANCE_RATE_LIMIT) || 15, // 15 requests per minute
      default: parseInt(process.env.DEFAULT_RATE_LIMIT) || 10 // 10 requests per minute
    };

    // Window size in milliseconds (default: 1 minute)
    this.windowSize = parseInt(process.env.RATE_LIMIT_WINDOW) || 60000;
  }

  /**
   * Get rate limit for a platform
   * @param {string} platform - Platform name
   * @returns {number} - Rate limit (requests per window)
   */
  getRateLimit(platform) {
    return this.rateLimits[platform] || this.rateLimits.default;
  }

  /**
   * Check if a request can be made for a platform
   * @param {string} platform - Platform name
   * @returns {boolean} - True if request can be made, false if rate limited
   */
  canMakeRequest(platform) {
    const now = Date.now();
    const limit = this.getRateLimit(platform);

    if (!this.requestCounts[platform]) {
      this.requestCounts[platform] = { count: 0, resetAt: now + this.windowSize };
      return true;
    }

    const platformData = this.requestCounts[platform];

    // Reset if window expired
    if (now >= platformData.resetAt) {
      platformData.count = 0;
      platformData.resetAt = now + this.windowSize;
      return true;
    }

    // Check if under limit
    return platformData.count < limit;
  }

  /**
   * Record a request for a platform
   * @param {string} platform - Platform name
   */
  recordRequest(platform) {
    if (!this.requestCounts[platform]) {
      this.requestCounts[platform] = { count: 0, resetAt: Date.now() + this.windowSize };
    }

    this.requestCounts[platform].count++;
  }

  /**
   * Get time until next request can be made (in milliseconds)
   * @param {string} platform - Platform name
   * @returns {number} - Milliseconds until next request can be made (0 if can make now)
   */
  getWaitTime(platform) {
    if (this.canMakeRequest(platform)) {
      return 0;
    }

    const platformData = this.requestCounts[platform];
    const waitTime = platformData.resetAt - Date.now();
    return Math.max(0, waitTime);
  }

  /**
   * Wait until a request can be made for a platform
   * @param {string} platform - Platform name
   * @returns {Promise<void>}
   */
  async waitForAvailability(platform) {
    const waitTime = this.getWaitTime(platform);
    if (waitTime > 0) {
      const jitter = Math.floor(Math.random() * 2000) + 1000; // 1-3s random jitter
      const totalWait = waitTime + jitter;
      console.log(`⏳ Rate limit reached for ${platform}. Waiting ${(totalWait / 1000).toFixed(1)}s (including jitter)...`);
      await new Promise(resolve => setTimeout(resolve, totalWait));
      // Reset after waiting
      if (this.requestCounts[platform]) {
        this.requestCounts[platform].count = 0;
        this.requestCounts[platform].resetAt = Date.now() + this.windowSize;
      }
    }
  }

  /**
   * Execute a function with rate limiting
   * @param {string} platform - Platform name
   * @param {Function} fn - Function to execute
   * @returns {Promise<any>} - Result of the function
   */
  async execute(platform, fn) {
    await this.waitForAvailability(platform);
    this.recordRequest(platform);
    return await fn();
  }

  /**
   * Get current request count for a platform
   * @param {string} platform - Platform name
   * @returns {number} - Current request count
   */
  getRequestCount(platform) {
    if (!this.requestCounts[platform]) return 0;
    const platformData = this.requestCounts[platform];
    const now = Date.now();
    if (now >= platformData.resetAt) return 0;
    return platformData.count;
  }

  /**
   * Reset rate limit for a platform
   * @param {string} platform - Platform name
   */
  reset(platform) {
    if (this.requestCounts[platform]) {
      delete this.requestCounts[platform];
    }
  }

  /**
   * Reset all rate limits
   */
  resetAll() {
    this.requestCounts = {};
  }
}

// Export singleton instance
module.exports = new RateLimiter();

