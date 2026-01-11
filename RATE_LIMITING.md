# Optimization: Rate Limiting

## Goal
Protect the application from being blocked by e-commerce platforms (Amazon, Flipkart, etc.) by controlling the frequency of outgoing requests.

## Implementation Details
1.  **Platform-Specific Limits**: `backend/utils/rateLimiter.js` defines unique limits for each platform based on their typical tolerance (e.g., 10 RPM for Amazon, 15 RPM for Croma).
2.  **Sliding Window Algorithm**: Tracks request counts within a 60-second window.
3.  **Human-Like Jitter**: Adds a random 1-3 second delay (jitter) when waiting for a rate limit reset to make the scraping patterns appear less automated.
4.  **Concurrency Control**: The cron job uses `processAlertsInBatches` with a `CONCURRENT_BATCH_SIZE` (default: 5) and `BATCH_DELAY_MS` (default: 2s) to further spread out the load.

## Benefits
- 🛡️ Prevents IP blacklisting and CAPTCHA triggers.
- ⚡ Ensures stable delivery of alerts without overwhelming the system.
- 🔄 Automatic recovery when rate limits are reset.

## Current State
- ✅ `rateLimiter.js` utility integrated into all scraping services.
- ✅ Random jitter added to wait times.
- ✅ Platform-specific RPM (Requests Per Minute) configured.

## Future Enhancements
- Distributed rate limiting using Redis (for multi-server setups).
- Dynamic rate limit adjustment based on success/failure rates.
