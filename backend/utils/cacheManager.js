/**
 * Simple in-memory cache manager for price lookups
 */
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.ttl = 30 * 60 * 1000; // 30 minutes default TTL
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any|null} - Cached value or null if expired/not found
     */
    get(key) {
        if (!this.cache.has(key)) return null;

        const { value, expiry } = this.cache.get(key);
        if (Date.now() > expiry) {
            this.cache.delete(key);
            return null;
        }

        return value;
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in ms (optional)
     */
    set(key, value, ttl = this.ttl) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { value, expiry });
    }

    /**
     * Delete from cache
     * @param {string} key 
     */
    delete(key) {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
    }
}

module.exports = new CacheManager();
