# Feature: Price History Tracking

## Goal
Track and display price fluctuations for a product over time, allowing users to see trends and make better purchasing decisions.

## Implementation Details
1.  **Model Update**: `Alert.js` now includes a `priceHistory` field, which is an array of objects storing `price` and `timestamp`.
2.  **Automated Logging**: Each time the `priceAlertcron.js` checks for a price update, it pushes the new price to the `priceHistory` array.
3.  **Data Management**: To prevent the database documents from growing indefinitely, we only store the last 50 price points per alert.

## Data Structure
```json
"priceHistory": [
  { "price": 49999, "timestamp": "2024-01-15T10:00:00.000Z" },
  { "price": 48500, "timestamp": "2024-01-15T10:30:00.000Z" }
]
```

## Benefits
- 📈 Visualizes price trends.
- 🕒 Helps users understand the "normal" price range of a product.
- 🎯 Validates that the price drop isn't just a temporary glitch.

## Current State
- ✅ `Alert` model updated.
- ✅ `priceAlertcron.js` updated to log history.
- ✅ History cap (last 50 entries) implemented.
