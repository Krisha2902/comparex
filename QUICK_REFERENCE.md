# 📌 QUICK ISSUE REFERENCE GUIDE

## 🔴 CRITICAL ISSUES - FIX IMMEDIATELY

### 1️⃣ Format Mismatch (Search vs Detail Scrapers)
```
Search scrapers: {price: 50000, rating: 4.5}
Detail scrapers: {price: {current, mrp}, rating: {average, count}}
↳ Mix causes TypeError when accessing product.price.toLocaleString()
↳ FIX: Standardize to flattened format everywhere
```

### 2️⃣ Price Returns 0 Instead of null
```
price: currentPrice || 0  ❌
price: currentPrice !== null ? currentPrice : null  ✅
↳ Products with extraction failures show price 0 instead of "N/A"
↳ Frontend filter doesn't catch these
```

### 3️⃣ Normalizer Accepts Invalid Data
```
Current: Logs warning, returns invalid data anyway
Fix: Throw error on invalid data, reject in pipeline
↳ Currently returns products like {price: null, rating: null}
```

### 4️⃣ Search Results Not Transformed Before Combining
```
Database products: {title, price, rating, source}
Scraped products: {title, price, image, rating, source, productUrl}
↳ productUrl missing in some products
↳ Different field structure causes validation issues
```

---

## ⚠️ HIGH PRIORITY - Block Frontend Issues

### 5️⃣ Rating = 0 in Search Results
- Most search results show 0 rating (extraction failure)
- Frontend shows these as valid products
- Should return null for missing ratings
- Filter: `if (rating === 0) rating = null`

### 6️⃣ Category Parameter Unused
- Category passed to search but never used
- All searches ignor category filter
- Can't search "Electronics" vs "Kitchen"
- Need: Pass category to buildSearchUrl() in all scrapers

### 7️⃣ Image Extraction Failing
- Many products get `image: null`
- Frontend shows placeholder but looks broken
- Need better fallback image handling
- Or mark as data validation failure

### 8️⃣ Browser Connection Still Crashes Sometimes
- Queue added but parallel operations still possible
- May need to test with actual concurrent requests
- Verify sequential execution is truly sequential

---

## 🟡 MEDIUM PRIORITY - Data Quality

### 9️⃣ Deduplication Doesn't Work Right
```
"Amazon - iPhone" vs "Amazon -iPhone"  ← Different keys!
Fix: Normalize title before creating key
`${source}::${title.trim().toLowerCase()}`
```

### 🔟 ProductUrl Missing in Database Results
- Search results have productUrl from scrapers
- Database results don't
- Frontend can't link to store for DB products
- Add productUrl to Product model

### 1️⃣1️⃣ Best Deal Marking Wrong
```
// Current (WRONG):
{index === 0 && "🔥 Best Deal"}  ← Just marks first item!

// Correct:
const lowestPrice = Math.min(...products.map(p => p.price));
{product.price === lowestPrice && "🔥 Best Deal"}
```

### 1️⃣2️⃣ Timeout Too Short
- 90 seconds for scraping 3 platforms
- Slow network = timeout = no results
- Increase to 120+ seconds

---

## 🎯 VERIFICATION CHECKLIST

### Before Claiming "Fixed":

**For Each Scraper (amazon, flipkart, croma, reliance):**
- [ ] Price: never 0, use null if missing
- [ ] Rating: never 0, use null if missing  
- [ ] Title: always non-empty
- [ ] All required fields present
- [ ] No extraction = returns null (not empty string/0)

**Search Results Pipeline:**
- [ ] All scrapers use same format
- [ ] DB and scraper results transformed to same format
- [ ] No products with price: 0
- [ ] No products with rating: 0
- [ ] All products have source field
- [ ] All products have image or null (not broken URLs)

**Frontend Rendering:**
- [ ] ProductCard shows nothing if price is null
- [ ] PriceTable only shows valid products
- [ ] SimilarProducts only shows valid products
- [ ] Comparison shows correct best deal
- [ ] No console errors about undefined properties

---

## 📊 DATA FLOW DIAGRAM (Current vs Expected)

### CURRENT (BROKEN):
```
Search Input
    ↓
Scraper A, B, C (PARALLEL)
    ↓ (Mixed format: {price: 0|null, rating: 0|null})
searchService (Doesn't transform)
    ↓
Normalizer (Accepts invalid data)
    ↓
Frontend (Tries to render null/0)
    ↓ (Filters remove them, but some slip through)
Broken Display
```

### EXPECTED (FIXED):
```
Search Input
    ↓
Scraper A, B, C (SEQUENTIAL)
    ↓ (Consistent format: {price, rating, source, image, productUrl})
searchService (Transforms ALL data to same schema)
    ↓
Normalizer (REJECTS invalid data)
    ↓
Frontend (Receives ONLY valid products)
    ↓ (Renders with confidence)
Clean Display ✅
```

---

## 🔧 QUICK FIX COMMANDS

### To check for 0 prices in database:
```javascript
db.products.find({price: 0})
db.products.find({price: {$type: "null"}})
```

### To check scraper output format:
```bash
# In terminal, add this to amazonSearch.js before return:
console.log("Sample product:", JSON.stringify(products[0], null, 2));
```

### To verify normalizer is working:
```javascript
// Add to normalizer.js before parse:
console.log("Validating:", data);
// After parse (if it succeeds):
console.log("Validated successfully");
```

### To test search with specific category:
```javascript
// Frontend:
const results = await searchProducts("iPhone", "electronics");
console.log(results);
```

---

## ⏱️ ESTIMATED EFFORT

| Fix | Difficulty | Time | Files |
|-----|-----------|------|-------|
| Format standardization | Hard | 45min | 8 |
| Price/Rating null handling | Medium | 30min | 7 |
| Normalizer rewrite | Hard | 45min | 1 |
| Data transformation | Medium | 30min | 1 |
| Category filtering | Easy | 20min | 4 |
| Deduplication fix | Easy | 10min | 1 |
| ProductUrl addition | Easy | 15min | 2 |
| **TOTAL** | - | **3.5 hrs** | **24** |

---

## ✅ WHAT'S ALREADY WORKING

- ✅ Sequential page creation in BrowserManager
- ✅ Frontend filters for null prices (mostly)
- ✅ Database fallback search
- ✅ CORS headers for image loading
- ✅ Browser connection checking
- ✅ Job tracking system
- ✅ Comprehensive error logging

---

## ❌ WHAT MUST BE FIXED

1. **Format consistency** - All data must use same schema
2. **Null vs 0** - Use null for missing data, not 0
3. **Normalizer** - Must reject invalid data
4. **Data transformation** - DB and scraped must match format
5. **Category filtering** - Must work for category-based search
6. **Best deal marking** - Must find actual lowest price

---
