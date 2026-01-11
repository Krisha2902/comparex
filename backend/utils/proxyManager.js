/**
 * Proxy Manager Utility
 * Manages proxy rotation for scraping to avoid IP bans
 */
class ProxyManager {
  constructor() {
    // Load proxies from environment variable
    // Format: PROXY_LIST=http://user:pass@host:port,http://user:pass@host:port
    this.proxies = [];
    this.currentIndex = 0;
    this.failedProxies = new Set(); // Track failed proxies
    this.proxyStats = {}; // Track stats per proxy

    this.loadProxies();
  }

  /**
   * Load proxies from environment variable
   */
  loadProxies() {
    const proxyList = process.env.PROXY_LIST;
    
    if (proxyList) {
      this.proxies = proxyList
        .split(',')
        .map(proxy => proxy.trim())
        .filter(proxy => proxy.length > 0);
      
      console.log(`✅ Loaded ${this.proxies.length} proxy(ies) from environment`);
    } else {
      console.log('⚠️ No proxies configured. Running without proxy rotation.');
    }
  }

  /**
   * Get next proxy in rotation
   * @returns {string|null} - Proxy URL or null if no proxies available
   */
  getNextProxy() {
    if (this.proxies.length === 0) {
      return null;
    }

    // Filter out failed proxies
    const availableProxies = this.proxies.filter((_, index) => !this.failedProxies.has(index));
    
    if (availableProxies.length === 0) {
      // All proxies failed, reset failed list and try again
      console.warn('⚠️ All proxies failed. Resetting failed list and retrying...');
      this.failedProxies.clear();
      return this.proxies[this.currentIndex % this.proxies.length];
    }

    // Get next available proxy
    const proxyIndex = this.proxies.findIndex((proxy, index) => 
      availableProxies.includes(proxy) && !this.failedProxies.has(index)
    );
    
    if (proxyIndex === -1) {
      // Fallback to round-robin
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
      return this.proxies[this.currentIndex];
    }

    this.currentIndex = proxyIndex;
    return this.proxies[this.currentIndex];
  }

  /**
   * Mark a proxy as failed
   * @param {string} proxy - Proxy URL that failed
   */
  markProxyFailed(proxy) {
    const index = this.proxies.indexOf(proxy);
    if (index !== -1) {
      this.failedProxies.add(index);
      console.warn(`❌ Marked proxy ${index + 1} as failed: ${proxy.substring(0, 30)}...`);
      
      // Track failure stats
      if (!this.proxyStats[proxy]) {
        this.proxyStats[proxy] = { failures: 0, successes: 0 };
      }
      this.proxyStats[proxy].failures++;
    }
  }

  /**
   * Mark a proxy as successful
   * @param {string} proxy - Proxy URL that succeeded
   */
  markProxySuccess(proxy) {
    const index = this.proxies.indexOf(proxy);
    if (index !== -1 && this.failedProxies.has(index)) {
      // Remove from failed list if it succeeds again
      this.failedProxies.delete(index);
      console.log(`✅ Proxy ${index + 1} recovered: ${proxy.substring(0, 30)}...`);
    }

    // Track success stats
    if (!this.proxyStats[proxy]) {
      this.proxyStats[proxy] = { failures: 0, successes: 0 };
    }
    this.proxyStats[proxy].successes++;
  }

  /**
   * Get proxy statistics
   * @returns {Object} - Proxy statistics
   */
  getStats() {
    return {
      totalProxies: this.proxies.length,
      availableProxies: this.proxies.length - this.failedProxies.size,
      failedProxies: this.failedProxies.size,
      currentIndex: this.currentIndex,
      stats: this.proxyStats
    };
  }

  /**
   * Reset failed proxies list
   */
  resetFailedProxies() {
    this.failedProxies.clear();
    console.log('✅ Reset failed proxies list');
  }

  /**
   * Check if proxies are available
   * @returns {boolean} - True if proxies are configured
   */
  hasProxies() {
    return this.proxies.length > 0;
  }

  /**
   * Get proxy server configuration for Puppeteer
   * @param {string} proxyUrl - Proxy URL
   * @returns {Object|null} - Puppeteer proxy args or null
   */
  getProxyArgs(proxyUrl) {
    if (!proxyUrl) return null;

    try {
      const url = new URL(proxyUrl);
      const args = [`--proxy-server=${url.protocol}//${url.host}`];
      
      // Add authentication if provided
      if (url.username && url.password) {
        // Note: Puppeteer doesn't support proxy auth directly in args
        // This would need to be handled via page.authenticate() or a proxy extension
        // For now, we'll just set the proxy server
      }

      return args;
    } catch (error) {
      console.error('Error parsing proxy URL:', error.message);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new ProxyManager();

