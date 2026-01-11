# Feature: Multi-Store Alerts

## Goal
Allow users to monitor a product's price across multiple specified stores simultaneously with a single alert.

## Implementation Details
1.  **Model Update**: The `store` field in `Alert.js` has been replaced with a `stores` array.
2.  **Flexible Input**: The alert creation route now accepts either a single `store` (backwards compatibility) or an array of `stores`.
3.  **Parallel Monitoring**: `scrapeService.js` now iterates through the list of requested stores and finds the absolute lowest price among them.
4.  **Optimized Searching**: If no stores are specified, the system continues to search all available platforms.

## Example Request
```json
{
  "productName": "iPhone 15",
  "stores": ["amazon", "flipkart"],
  "targetPrice": 50000
}
```

## Benefits
- 🛒 One-stop monitoring for the best deals.
- 📉 Reduced alert fragmentation (no need to create separate alerts for different stores).
- 🔄 Seamless fallback to "All Stores" if specified stores are invalid.

## Current State
- ✅ `Alert` model updated to use `stores` array.
- ✅ `alertRoutes.js` handles multi-store input.
- ✅ `scrapeService.js` and `priceAlertcron.js` fully support multi-store lookups.
