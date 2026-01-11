# 🛠️ PROJECT FIX ACTION PLAN

**Total Issues Found:** 22  
**Critical Blockers:** 4  
**Estimated Fix Time:** 4-6 hours  

---

## PHASE 1: CRITICAL FIXES (P0) - Must Fix Before Testing
**Estimated Time: 2-3 hours**

### Issue #1: Search Scraper Output Format Mismatch
**Files Affected:**
- `backend/scrapers/searchScrapers/amazonSearch.js` (line 100)
- `backend/scrapers/searchScrapers/flipkartSearch.js` (line 80)
- `backend/scrapers/searchScrapers/cromaSearch.js` (line 80)
- `backend/utils/normalizer.js` (entire schema)

**Current Problem:**
```javascript
// Search scrapers return:
{title, price: 50000, image, rating: 4.5, source: 'Amazon', productUrl}

// Detail scrapers return:
{title, price: {current: 50000, mrp: 60000}, rating: {average: 4.5, count: 1000}}

// Normalizer expects (BROKEN):
{price: {current, mrp}, rating: {average, count}}
```

**Fix Steps:**
1. Check all search scrapers - see what format they actually return
2. Update normalizer schema to accept FLATTENED format:
```javascript
price: z.number().positive(),  // Direct price
rating: z.number().min(0).max(5),  // Direct rating
source: z.string(),
productUrl: z.string().url().optional(),
image: z.string().url().optional(),
```
3. Transform detail scraper output to match search format in `searchService.js`

---

### Issue #2: Price Validation Returns 0 Instead of Null
**Files Affected:**
- `backend/scrapers/searchScrapers/amazonSearch.js` (line 57)
- `backend/scrapers/searchScrapers/flipkartSearch.js` (line 55)
- `backend/scrapers/searchScrapers/cromaSearch.js` (line 48)

**Current Problem:**
```javascript
price: currentPrice || 0  // Returns 0 when extraction fails
```

**Fix:**
```javascript
// Change to:
price: currentPrice !== null ? currentPrice : null  // Return null, not 0

// Then in all search scrapers, filter null results:
products = products.filter(p => p.price !== null && p.price !== undefined)
```

---

### Issue #3: Normalizer Doesn't Enforce Required Fields
**Files Affected:**
- `backend/utils/normalizer.js` (entire file)

**Current Problem:**
```javascript
const normalizeProductData = (data) => {
    try {
        return productSchema.parse(data);
    } catch (error) {
        console.warn('...'); // Just logs warning!
        return { ...data, _validationErrors: error.errors };  // Returns invalid data
    }
};
```

**Fix:**
```javascript
const normalizeProductData = (data) => {
    try {
        // Validate AND THROW on error
        const validated = productSchema.parse(data);
        
        // Additional business logic validation
        if (!validated.price || validated.price <= 0) {
            throw new Error('Invalid price: must be positive number');
        }
        if (validated.price > 10000000) {  // > 1 crore, likely error
            throw new Error('Price seems unrealistic: ' + validated.price);
        }
        
        return validated;
    } catch (error) {
        console.error('VALIDATION FAILED:', error);
        throw error;  // Reject bad data
    }
};
```

---

### Issue #4: Search Service Doesn't Transform Data
**Files Affected:**
- `backend/services/searchService.js` (line 140-160)

**Current Problem:**
```javascript
const allProducts = [...scrappedProducts, ...dbProducts];  // Different schemas!
```

**Fix:**
```javascript
// Transform database products to match scraper format
const transformedDbProducts = dbProducts.map(p => ({
    title: p.title,
    price: p.price,
    image: p.image,
    rating: p.rating,
    source: p.source,
    productUrl: `/product?id=${p._id}`,  // Generate URL
    _id: p._id  // Keep ID for reference
}));

// Now combine safely
const allProducts = [...scrappedProducts, ...transformedDbProducts];
```

---

## PHASE 2: HIGH PRIORITY FIXES (P1) - Core Functionality
**Estimated Time: 1-2 hours**

### Issue #5: Rating Extraction Unreliable
**Files Affected:**
- `backend/scrapers/amazon.js`
- `backend/scrapers/flipkart.js`
- `backend/scrapers/croma.js`
- `backend/scrapers/reliance.js`

**Fix:**
```javascript
// In EVERY scraper, change rating handling:

// OLD:
let ratingVal = 0;
const ratingText = getText('#acrPopover');
if (ratingText) {
    const match = ratingText.match(/(\d+\.?\d*)/);
    if (match) ratingVal = parseFloat(match[1]);
}

// NEW:
let ratingVal = null;  // Start with null, not 0
const ratingText = getText('#acrPopover');
if (ratingText) {
    const match = ratingText.match(/(\d+\.?\d*)/);
    if (match) {
        const val = parseFloat(match[1]);
        // Validate rating is in reasonable range
        if (val >= 0 && val <= 5) {
            ratingVal = val;
        }
    }
}
```

---

### Issue #6: Add Category Filtering
**Files Affected:**
- `backend/scrapers/searchScrapers/*.js` (buildSearchUrl method)
- `backend/services/searchService.js` (scrapePlatform function)

**Fix:**
```javascript
// Update buildSearchUrl to accept category:
buildSearchUrl(query, category) {
    // Most platforms don't have category param in search
    // But can build more specific queries:
    if (category === 'electronics') {
        return `https://www.amazon.in/s?k=${query}+phone`; // Add context
    }
    return `https://www.amazon.in/s?k=${query}`;
}

// Update search() call:
const products = await scraper.search(query, category);

// Update search method signature:
async search(query, category = null) {
    const searchUrl = this.buildSearchUrl(query, category);
    ...
}
```

---

### Issue #7: Browser Queue Not Actually Working
**Files Affected:**
- `backend/services/searchService.js` (already fixed in recent update)
- **No additional fix needed if using sequential loop**

**Verify:**
- Confirm `searchService.js` uses `for...of` loop, not `Promise.all()`
- Test concurrent searches - should queue properly

---

## PHASE 3: MEDIUM PRIORITY FIXES (P2) - Data Quality
**Estimated Time: 1-2 hours**

### Issue #8: Fix Deduplication
**Files Affected:**
- `backend/services/searchService.js` (line 165)

**Fix:**
```javascript
// OLD:
const key = `${p.source} -${p.title} `;  // Wrong - space inconsistency

// NEW:
const key = `${p.source}::${(p.title || '').toLowerCase().trim()}`;
// Use :: separator, lowercase for consistent matching
```

---

### Issue #9: Add ProductUrl to Database
**Files Affected:**
- `backend/models/product.js` (schema)
- `backend/services/searchService.js` (database search)

**Fix:**
```javascript
// In product.js schema, add:
productUrl: {
    type: String,
    default: null
}

// In searchService.js transformedDbProducts:
productUrl: `/product/${p._id}`,  // Or actual URL if stored
```

---

### Issue #10: Fix Price Sorting
**Files Affected:**
- `src/components/PriceTable.jsx` (already fixed in recent update)

**Verify:** Current code correctly handles both number and object prices

---

## PHASE 4: NICE-TO-HAVE FIXES (P3) - UX Improvements
**Estimated Time: 1-2 hours**

### Issue #11-22: Various UX Improvements
These are lower priority but improve user experience:

1. **Best Deal Calculation** - Find actual minimum price, not first product
2. **Show Availability Status** - Add column showing in-stock/out-of-stock
3. **Show Discount Percentage** - Display original vs current price
4. **Handle Duplicate Searches** - Debounce or check for active jobs
5. **Show Error Details** - Display which scrapers failed and why
6. **Add CAPTCHA Detection** - Throw error instead of continuing
7. **Increase Timeout** - Change 90s to 120s
8. **Show Rating Scale** - Display as "4.0/5" not just "4.0"
9. **Hide 0 Ratings** - These are likely extraction failures

---

## TESTING CHECKLIST

### After Implementing Phase 1 & 2, Test:
- [ ] Search for "iPhone" - should return products from 3 platforms with prices
- [ ] Check browser console - no console errors about undefined prices/ratings
- [ ] Search for product by category - category param used
- [ ] Verify all products have valid price (> 0) and source
- [ ] Check comparison page - products sorted by actual lowest price
- [ ] Verify no products with rating: 0 are shown
- [ ] Test with slow network - should still work
- [ ] Test concurrent searches - should queue properly

### Database Checks:
```javascript
// Check product data:
db.products.findOne({price: 0})  // Should return nothing
db.products.findOne({price: null})  // Should return nothing
db.products.aggregate([
    {$group: {_id: "$source", count: {$sum: 1}}}
])  // Should show all 4 sources equally represented
```

---

## FILE CHANGE SUMMARY

**Critical Changes Required:**
- [ ] `backend/utils/normalizer.js` - Rewrite schema validation
- [ ] `backend/services/searchService.js` - Add data transformation
- [ ] `backend/scrapers/searchScrapers/*.js` (3 files) - Change 0 to null for prices
- [ ] All detail scrapers (4 files) - Change rating extraction logic
- [ ] `backend/models/product.js` - Add productUrl field
- [ ] `src/components/PriceTable.jsx` - Verify sorting logic

**Files to Monitor (Already Fixed):**
- ✅ `src/components/ProductCard.jsx` - Validation filters in place
- ✅ `src/pages/comparepage.jsx` - Null checking implemented
- ✅ `backend/utils/BrowserManager.js` - Queue system in place
- ✅ `backend/services/searchService.js` - Sequential processing in place

---

## ROLLBACK PLAN

If issues occur after fixes:
1. Revert most recent changes to normalizer first (most likely culprit)
2. Check database for corrupted products (price: 0 or null)
3. Run seedProducts.js to restore test data
4. Clear in-memory job cache in searchService
5. Restart backend server

---
