# Phase 3: Optimizations - Make it Fast

This document outlines the performance optimizations implemented to scale the price alert system.

## Overview

The optimizations focus on three key areas:
1. **Batch Processing** - Process multiple alerts concurrently instead of sequentially
2. **Rate Limiting** - Control request rate per platform to avoid being blocked
3. **Proxy Rotation** - Distribute requests across multiple IPs to avoid IP bans

---

## 1. Batch Processing

### Implementation

The cron job now processes alerts in batches with controlled concurrency instead of processing them one by one.

**Key Features:**
- ✅ Concurrent processing of multiple alerts (configurable batch size)
- ✅ Configurable delay between batches
- ✅ Promise.allSettled() ensures one failure doesn't stop the batch
- ✅ Detailed progress tracking and statistics

**Configuration:**

Environment variables:
```env
ALERT_BATCH_SIZE=5          # Number of alerts to process concurrently (default: 5)
ALERT_BATCH_DELAY=2000      # Delay in milliseconds between batches (default: 2000ms)
```

**Performance Improvement:**

**Before:** Sequential processing
- 10 alerts × 30 seconds each = **5 minutes total**

**After:** Batch processing (5 concurrent)
- 10 alerts ÷ 5 batch size = 2 batches
- Batch 1: 5 alerts processed concurrently (~30 seconds)
- Batch 2: 5 alerts processed concurrently (~30 seconds)
- Total: **~1 minute** (5x faster!)

---

## 2. Rate Limiting

### Implementation

A rate limiter utility controls the number of requests per platform per time window to avoid being blocked by e-commerce sites.

**Key Features:**
- ✅ Per-platform rate limits (configurable)
- ✅ Sliding window algorithm
- ✅ Automatic wait when rate limit reached
- ✅ Request counting and statistics

**Configuration:**

Environment variables:
```env
# Rate limits per platform (requests per minute)
AMAZON_RATE_LIMIT=10        # Amazon: 10 requests/minute (default)
FLIPKART_RATE_LIMIT=12      # Flipkart: 12 requests/minute (default)
CROMA_RATE_LIMIT=15         # Croma: 15 requests/minute (default)
RELIANCE_RATE_LIMIT=15      # Reliance: 15 requests/minute (default)
DEFAULT_RATE_LIMIT=10       # Default for unknown platforms (default: 10)

# Rate limit window size (milliseconds)
RATE_LIMIT_WINDOW=60000     # 1 minute window (default: 60000ms)
```

**How It Works:**

1. Each platform has its own rate limit counter
2. When a request is made, the counter increments
3. If the limit is reached, the system waits until the window resets
4. The window slides forward automatically

**Example:**
```
Amazon rate limit: 10 requests/minute

Request 1-10: ✅ Allowed immediately
Request 11: ⏳ Wait until window resets (if within 1 minute)
```

**Usage:**

The rate limiter is automatically used in `scrapeService.js`:
- Before scraping a product page
- Before searching on each platform
- Logs current rate limit status

---

## 3. Proxy Rotation

### Implementation

A proxy manager utility handles proxy rotation to distribute requests across multiple IP addresses, reducing the risk of IP bans.

**Key Features:**
- ✅ Round-robin proxy rotation
- ✅ Failed proxy tracking and automatic exclusion
- ✅ Proxy recovery (re-adds proxies after they succeed again)
- ✅ Proxy statistics and monitoring
- ✅ Graceful fallback when no proxies configured

**Configuration:**

Environment variable:
```env
# Comma-separated list of proxy URLs
PROXY_LIST=http://user:pass@proxy1.com:8080,http://user:pass@proxy2.com:8080,http://proxy3.com:3128
```

**Proxy URL Format:**
- `http://host:port` - HTTP proxy without auth
- `http://user:pass@host:port` - HTTP proxy with authentication
- `https://host:port` - HTTPS proxy

**How It Works:**

1. **Proxy Selection:**
   - Proxies are loaded from environment variable
   - Round-robin selection for each request
   - Failed proxies are automatically excluded

2. **Failure Handling:**
   - Failed proxies are marked and excluded from rotation
   - System continues with remaining proxies
   - If all proxies fail, failed list is reset and retried

3. **Recovery:**
   - When a previously failed proxy succeeds, it's re-added to rotation
   - Statistics track success/failure rates per proxy

**BrowserManager Integration:**

- Browser instances are created with proxy configuration
- Proxy is set at browser launch (Puppeteer limitation)
- Browser is recreated when rotating proxies

**Note:** Puppeteer doesn't support per-page proxy configuration. Proxies are set at browser launch. For better proxy rotation, consider:
- Using separate browser instances per proxy
- Using a proxy extension/plugin
- Network-level proxy rotation

---

## Performance Metrics

### Before Optimizations

```
Processing 50 alerts:
- Sequential: 50 alerts × 30s = 25 minutes
- No rate limiting: Risk of IP bans
- No proxy rotation: Single IP, high ban risk
```

### After Optimizations

```
Processing 50 alerts:
- Batch processing (5 concurrent): ~5 minutes (5x faster)
- Rate limiting: Prevents IP bans
- Proxy rotation: Distributes load across IPs
```

**Expected Improvements:**
- ⚡ **5-10x faster** alert processing (depending on batch size)
- 🛡️ **Reduced IP bans** through rate limiting and proxy rotation
- 📊 **Better monitoring** with detailed statistics
- 🔄 **Automatic recovery** from proxy failures

---

## Configuration Examples

### Development (No Proxies, Low Rate Limits)

```env
ALERT_BATCH_SIZE=3
ALERT_BATCH_DELAY=1000
AMAZON_RATE_LIMIT=5
FLIPKART_RATE_LIMIT=5
CROMA_RATE_LIMIT=5
RELIANCE_RATE_LIMIT=5
# No PROXY_LIST - runs without proxies
```

### Production (With Proxies, Higher Rate Limits)

```env
ALERT_BATCH_SIZE=10
ALERT_BATCH_DELAY=3000
AMAZON_RATE_LIMIT=15
FLIPKART_RATE_LIMIT=20
CROMA_RATE_LIMIT=25
RELIANCE_RATE_LIMIT=25
PROXY_LIST=http://proxy1.com:8080,http://proxy2.com:8080,http://proxy3.com:8080
```

### High-Volume (Maximum Throughput)

```env
ALERT_BATCH_SIZE=20
ALERT_BATCH_DELAY=5000
AMAZON_RATE_LIMIT=20
FLIPKART_RATE_LIMIT=25
CROMA_RATE_LIMIT=30
RELIANCE_RATE_LIMIT=30
PROXY_LIST=http://proxy1.com:8080,http://proxy2.com:8080,http://proxy3.com:8080,http://proxy4.com:8080,http://proxy5.com:8080
```

---

## Monitoring

### Rate Limiter Statistics

The rate limiter provides:
- Current request count per platform
- Rate limit status
- Wait time until next request

**Logs:**
```
📊 Rate limit: 5/10 requests for amazon
⏳ Rate limit reached for flipkart. Waiting 15.3s...
```

### Proxy Manager Statistics

The proxy manager tracks:
- Total proxies configured
- Available proxies (excluding failed)
- Failed proxies
- Success/failure rates per proxy

**Access via:**
```javascript
const proxyManager = require('./utils/proxyManager');
const stats = proxyManager.getStats();
console.log(stats);
```

### Cron Job Statistics

The cron job logs:
- Total alerts checked
- Alerts triggered
- Errors encountered
- Processing duration
- Average time per alert

**Example Logs:**
```
✅ Price alert check completed in 45.23s
   Checked: 50 alerts
   Triggered: 3 alerts
   Errors: 2 alerts
   Average time per alert: 0.90s
```

---

## Best Practices

### 1. Batch Size Configuration

- **Small batches (3-5):** Lower resource usage, slower but safer
- **Medium batches (5-10):** Balanced performance and resource usage
- **Large batches (10-20):** Maximum throughput, higher resource usage

**Recommendation:** Start with 5, monitor performance, adjust based on server capacity.

### 2. Rate Limit Configuration

- **Conservative (5-10/min):** Safe, low risk of bans
- **Moderate (10-15/min):** Balanced performance and safety
- **Aggressive (15-25/min):** Higher throughput, monitor for bans

**Recommendation:** Start conservative, gradually increase while monitoring for blocks.

### 3. Proxy Configuration

- **Minimum:** 2-3 proxies for redundancy
- **Recommended:** 5-10 proxies for better distribution
- **High-volume:** 10+ proxies for maximum distribution

**Recommendation:** Use rotating proxies from a reliable provider. Test proxies before production use.

### 4. Monitoring

- Monitor rate limit logs for frequent waits
- Track proxy success rates
- Watch for increased error rates
- Adjust configuration based on metrics

---

## Troubleshooting

### Issue: Rate Limiting Too Aggressive

**Symptoms:** Frequent waits, slow processing

**Solution:**
- Increase rate limits in environment variables
- Reduce batch size to spread requests over time
- Add more proxies to distribute load

### Issue: Proxy Failures

**Symptoms:** Many proxy failures, requests failing

**Solution:**
- Verify proxy URLs are correct
- Test proxies individually
- Check proxy authentication
- Consider using a proxy service with health checks

### Issue: High Memory Usage

**Symptoms:** Server running out of memory

**Solution:**
- Reduce batch size
- Increase delay between batches
- Monitor browser instances (ensure they're closed properly)

### Issue: Still Getting Blocked

**Symptoms:** CAPTCHAs, access denied, IP bans

**Solution:**
- Reduce rate limits further
- Add more proxies
- Increase delays between batches
- Consider using residential proxies
- Implement CAPTCHA solving service

---

## Files Modified

### New Files
- `comparex/backend/utils/rateLimiter.js` - Rate limiting utility
- `comparex/backend/utils/proxyManager.js` - Proxy rotation utility

### Modified Files
- `comparex/backend/utils/BrowserManager.js` - Added proxy support
- `comparex/backend/cron/priceAlertcron.js` - Implemented batch processing
- `comparex/backend/services/scrapeService.js` - Added rate limiting and proxy support

---

## Future Enhancements

1. **Dynamic Rate Limiting:** Adjust rate limits based on success/failure rates
2. **Proxy Health Checks:** Periodic health checks for proxies
3. **CAPTCHA Solving:** Integration with CAPTCHA solving services
4. **Browser Pooling:** Reuse browser instances for better performance
5. **Caching:** Cache product prices to reduce scraping load
6. **Distributed Processing:** Scale across multiple servers
7. **Metrics Dashboard:** Real-time monitoring dashboard
8. **Auto-scaling:** Automatically adjust batch size based on load

---

## Summary

✅ **Batch Processing:** 5-10x faster alert processing
✅ **Rate Limiting:** Prevents IP bans and blocks
✅ **Proxy Rotation:** Distributes load across multiple IPs
✅ **Monitoring:** Comprehensive statistics and logging
✅ **Configuration:** Flexible environment-based configuration
✅ **Error Handling:** Robust error handling and recovery

The system is now optimized for scale and ready to handle high-volume price alert monitoring!

