# Price Alert System Fixes

This document outlines all the fixes and improvements made to the price alert system.

## Overview

This update addresses several critical issues in the price alert functionality:
- Removed duplicate route handlers
- Added robust validation and error handling
- Fixed Alert model schema issues
- Created new scrapeService for price checking
- Improved cron job error logging
- Fixed frontend API configuration

---

## Backend Changes

### 1. Alert Routes (`comparex/backend/routes/alertRoutes.js`)

**Issues Fixed:**
- ✅ Removed duplicate `/create` route handler that was overwriting the main route
- ✅ Added comprehensive input validation
- ✅ Improved error handling with proper HTTP status codes
- ✅ Added email format validation
- ✅ Better error messages for debugging

**Changes Made:**
- Removed the duplicate route handler (lines 39-42)
- Added validation for:
  - Required fields (userEmail, productName, targetPrice)
  - Email format validation
  - Target price validation (must be positive number)
- Enhanced error handling:
  - Validation errors return 400 status
  - Mongoose validation errors are properly formatted
  - Duplicate key errors are handled
  - Development vs production error messages

**Example Request:**
```json
{
  "userEmail": "user@example.com",
  "userPhone": "+1234567890",  // Optional
  "productName": "iPhone 15",
  "store": "amazon",  // Optional
  "targetPrice": 50000
}
```

---

### 2. Alert Model (`comparex/backend/models/Alert.js`)

**Issues Fixed:**
- ✅ Made `userPhone` field optional (required: false) to unblock alert creation
- ✅ Added missing `store` field to schema
- ✅ Added `triggeredAt` and `lastCheckedPrice` fields for better tracking
- ✅ Added proper validation and trimming for string fields

**Schema Changes:**
```javascript
{
  userEmail: { required: true, trim: true },
  userPhone: { required: false, trim: true },  // Changed from required: true
  productName: { required: true, trim: true },
  store: { trim: true },  // New field
  targetPrice: { required: true, min: 0 },
  currentPrice: { min: 0 },
  isTriggered: { default: false },
  triggeredAt: Date,  // New field
  lastCheckedPrice: { min: 0 }  // New field
}
```

---

### 3. Scrape Service (`comparex/backend/services/scrapeService.js`) - NEW FILE

**Purpose:**
Created a dedicated service to get the latest price for a product from a specific store or all stores.

**Features:**
- ✅ Utilizes existing searchService logic and scrapers
- ✅ Supports filtering by store/platform (amazon, flipkart, croma, reliance)
- ✅ Falls back to database search if scraping fails
- ✅ Returns the lowest price found
- ✅ Comprehensive error handling and logging
- ✅ Browser initialization with retry logic

**Function:**
```javascript
async function getLatestPrice(productName, store)
```

**Parameters:**
- `productName` (string, required): Name of the product to search for
- `store` (string, optional): Store/platform name (amazon, flipkart, croma, reliance). If not provided, searches all stores.

**Returns:**
- `Promise<number>`: The lowest price found for the product

**Throws:**
- `Error`: If no price is found or scraping fails

**Usage Example:**
```javascript
const { getLatestPrice } = require("../services/scrapeService");

// Get price from specific store
const price = await getLatestPrice("iPhone 15", "amazon");

// Get lowest price from all stores
const lowestPrice = await getLatestPrice("iPhone 15", null);
```

**Implementation Details:**
- Initializes browser with retry logic (up to 3 attempts)
- Scrapes products from specified store(s) or all stores
- Validates and normalizes products using existing normalizer utility
- Filters products by store if specified
- Falls back to database search for additional products
- Sorts by price and returns the lowest price found

---

### 4. Price Alert Cron Job (`comparex/backend/cron/priceAlertcron.js`)

**Issues Fixed:**
- ✅ Correctly imports scrapeService.js
- ✅ Added comprehensive error logging
- ✅ Improved progress tracking and reporting
- ✅ Better error handling for individual alerts
- ✅ Enhanced email notification error handling

**Improvements:**
- **Better Logging:**
  - Logs start time and duration
  - Shows progress (X/Y alerts checked)
  - Detailed logging for each alert check
  - Summary statistics at the end

- **Error Handling:**
  - Individual alert errors don't stop the entire cron job
  - Detailed error logging with stack traces
  - Alert details logged for debugging
  - Email failures don't prevent alert updates

- **Tracking:**
  - Updates `lastCheckedPrice` even if alert isn't triggered
  - Tracks `triggeredAt` timestamp
  - Updates `currentPrice` when alert is triggered

**Log Output Example:**
```
⏱ Running price alert check at 2024-01-15T10:00:00.000Z...
📋 Found 3 active alert(s) to check

[1/3] Checking alert ID: 507f1f77bcf86cd799439011
   Product: iPhone 15
   Store: amazon
   Target Price: ₹50000
   Current Price: ₹52000
   Price Difference: ₹2000
   ⏳ Price still above target. Continuing to monitor...

[2/3] Checking alert ID: 507f1f77bcf86cd799439012
   Product: Samsung Galaxy S24
   Store: flipkart
   Target Price: ₹60000
   Current Price: ₹58000
   Price Difference: ₹-2000
   ✅ PRICE ALERT TRIGGERED! Price dropped below target.
   📧 Notification email sent to user@example.com

✅ Price alert check completed in 45.23s
   Checked: 3 alerts
   Triggered: 1 alerts
   Errors: 0 alerts
```

---

## Frontend Changes

### 5. Alert API (`comparex/src/api/alertApi.js`)

**Issues Fixed:**
- ✅ Removed hardcoded `localhost:5000` URL
- ✅ Uses environment variable `VITE_API_URL` with fallback
- ✅ Consistent with other API files in the project

**Changes Made:**
```javascript
// Before:
return axios.post("http://localhost:5000/api/alerts/create", data);

// After:
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
return axios.post(`${API_BASE_URL}/api/alerts/create`, data);
```

**Environment Variable Setup:**
Create a `.env` file in the frontend root directory:
```env
VITE_API_URL=http://localhost:5000
```

For production:
```env
VITE_API_URL=https://api.yourdomain.com
```

---

## Testing Checklist

### Backend Testing

- [ ] Create alert with valid data (should succeed)
- [ ] Create alert without userPhone (should succeed)
- [ ] Create alert with invalid email (should fail with 400)
- [ ] Create alert without productName (should fail with 400)
- [ ] Create alert with invalid targetPrice (should fail with 400)
- [ ] Test getLatestPrice with specific store
- [ ] Test getLatestPrice without store (searches all)
- [ ] Test cron job execution
- [ ] Test alert triggering when price drops
- [ ] Test email notification sending

### Frontend Testing

- [ ] Alert creation form works with new API URL
- [ ] Environment variable is properly loaded
- [ ] Fallback to localhost works in development
- [ ] API calls work in production with environment variable

---

## Migration Notes

### Database Migration

If you have existing alerts in the database, you may need to:

1. **Add store field to existing alerts** (if needed):
```javascript
// Run in MongoDB shell or migration script
db.alerts.updateMany(
  { store: { $exists: false } },
  { $set: { store: null } }
);
```

2. **Make userPhone optional** (already handled by schema change):
   - Existing alerts with userPhone will continue to work
   - New alerts can be created without userPhone

### Environment Variables

**Backend:** No new environment variables required.

**Frontend:** Add to `.env` file:
```env
VITE_API_URL=http://localhost:5000
```

---

## Known Limitations

1. **Browser Initialization:** The scrapeService initializes a browser instance, which may be resource-intensive. Consider implementing browser pooling or reuse strategies for production.

2. **Rate Limiting:** No rate limiting is implemented for the scrapeService. Consider adding rate limiting if making many concurrent requests.

3. **Store Matching:** Store matching is case-insensitive but exact match. Variations like "Amazon" vs "amazon" are handled, but "amazon.in" vs "amazon" may not match.

4. **Temporary Fix:** The `userPhone` field being optional is marked as a temporary fix. Consider implementing proper phone number validation and making it required again in the future.

---

## Future Improvements

1. **Phone Number Validation:** Add proper phone number validation when making userPhone required again
2. **Rate Limiting:** Implement rate limiting for price checks
3. **Browser Pooling:** Implement browser instance pooling for better resource management
4. **Caching:** Add caching for frequently checked products to reduce scraping load
5. **Webhook Support:** Add webhook support for price alerts in addition to email
6. **SMS Notifications:** Add SMS notification support using userPhone
7. **Alert History:** Track price history for each alert
8. **Multiple Store Support:** Allow alerts to trigger when price drops on any of multiple specified stores

---

## Files Modified

### Backend
- `comparex/backend/routes/alertRoutes.js` - Fixed duplicate route, added validation
- `comparex/backend/models/Alert.js` - Updated schema (userPhone optional, added store field)
- `comparex/backend/services/scrapeService.js` - **NEW FILE** - Price checking service
- `comparex/backend/cron/priceAlertcron.js` - Improved error logging and handling

### Frontend
- `comparex/src/api/alertApi.js` - Fixed API URL configuration

---

## Summary

All requested fixes have been implemented:

✅ **Backend:**
- Removed duplicate route handler in alertRoutes.js
- Added robust validation and error handling
- Updated Alert model (userPhone optional, added store field)
- Created scrapeService.js with getLatestPrice function
- Improved cron job error logging

✅ **Frontend:**
- Fixed alertApi.js to use environment variable instead of hardcoded localhost

✅ **Documentation:**
- Created comprehensive markdown documentation

The price alert system is now more robust, maintainable, and production-ready.

