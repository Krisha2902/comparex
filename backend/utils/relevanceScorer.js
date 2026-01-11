const config = require('../config/accessoryFilters');

/**
 * Calculate relevance score for a product based on search query
 * Higher score = more relevant
 * 
 * @param {Object} product - Product object with title, price, source
 * @param {String} query - User's search query
 * @param {String} category - Search category
 * @returns {Number} Relevance score (-100 to 100+)
 */
function calculateRelevance(product, query, category = 'electronics') {
    let score = 0;

    const title = (product.title || '').toLowerCase();
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    const mainSearchTerm = searchTerms[0]; // First word is usually most important

    // ===== FACTOR 1: Title Position Score (40% weight) =====
    const titleWords = title.split(/\s+/);

    // Check position of main search term
    const mainTermIndex = titleWords.findIndex(word => word.includes(mainSearchTerm));

    if (mainTermIndex === 0) {
        score += 40; // First word - highest relevance
    } else if (mainTermIndex > 0 && mainTermIndex <= 2) {
        score += 30; // Within first 3 words
    } else if (mainTermIndex > 2 && mainTermIndex <= 4) {
        score += 20; // Within first 5 words
    } else if (mainTermIndex > 4) {
        score += 10; // Somewhere in title
    }

    // Bonus: Multiple search terms match
    const matchingTerms = searchTerms.filter(term =>
        title.includes(term) && term.length > 2
    ).length;

    if (matchingTerms > 1) {
        score += matchingTerms * 8; // Bonus for each matching term
    }

    // ===== FACTOR 2: Accessory Detection (-50 penalty) =====
    // Check if query itself contains accessory keyword (user wants accessory)
    const queryWantsAccessory = config.accessoryKeywords.some(keyword =>
        query.toLowerCase().includes(keyword)
    );

    if (!queryWantsAccessory) {
        // Only penalize accessories if user isn't searching for them
        const hasAccessoryKeyword = config.accessoryKeywords.some(keyword =>
            title.includes(keyword.toLowerCase())
        );

        if (hasAccessoryKeyword) {
            score -= 50; // Heavy penalty for accessories
        }
    }

    // ===== FACTOR 3: Price Relevance (20% weight) =====
    if (product.price && !queryWantsAccessory) {
        // Determine minimum price threshold for this query
        let minPrice = config.minPriceByCategory.default;

        // Check if query matches a category with specific threshold
        for (const [cat, threshold] of Object.entries(config.minPriceByCategory)) {
            if (query.toLowerCase().includes(cat.toLowerCase())) {
                minPrice = threshold;
                break;
            }
        }

        // Penalize prices that are too low (likely accessories)
        if (product.price < minPrice) {
            const priceDifference = minPrice - product.price;
            const penalty = Math.min(30, (priceDifference / minPrice) * 30);
            score -= penalty;
        }
    }

    // ===== FACTOR 4: Exact Match Bonus (30% weight) =====
    const fullQuery = query.toLowerCase().trim();

    if (title === fullQuery) {
        score += 40; // Perfect match
    } else if (title.startsWith(fullQuery)) {
        score += 30; // Starts with exact query
    } else if (title.includes(fullQuery)) {
        score += 20; // Contains exact query
    }

    // ===== FACTOR 5: Brand Match (10% weight) =====
    const hasBrand = config.knownBrands.some(brand =>
        title.includes(brand.toLowerCase())
    );

    if (hasBrand) {
        score += 10;
    }

    // ===== BONUS: Source reliability =====
    // Official sources might be more reliable
    const officialSources = ['Amazon', 'Flipkart'];
    if (officialSources.includes(product.source)) {
        score += 5;
    }

    return Math.round(score);
}

/**
 * Sort products by relevance score
 * @param {Array} products - Array of products
 * @param {String} query - Search query
 * @param {String} category - Category
 * @param {Object} options - Sorting options
 * @returns {Array} Sorted products with scores
 */
function sortByRelevance(products, query, category = 'electronics', options = {}) {
    const {
        minScore = -20,        // Filter products below this score
        includeScore = false,  // Include score in returned object
        secondarySortByPrice = true  // Sort by price as secondary factor
    } = options;

    // Calculate scores
    const scoredProducts = products.map(product => ({
        ...product,
        _relevanceScore: calculateRelevance(product, query, category)
    }));

    // Filter by minimum score
    let filteredProducts = scoredProducts.filter(p => p._relevanceScore >= minScore);

    // Sort by relevance, then by price if similar relevance
    filteredProducts.sort((a, b) => {
        const scoreDiff = b._relevanceScore - a._relevanceScore;

        // If scores are significantly different, sort by score
        if (Math.abs(scoreDiff) > 5) {
            return scoreDiff;
        }

        // If scores are similar and secondary sort enabled, sort by price
        if (secondarySortByPrice && a.price && b.price) {
            return a.price - b.price;
        }

        return scoreDiff;
    });

    // Remove score from results unless requested
    if (!includeScore) {
        filteredProducts = filteredProducts.map(({ _relevanceScore, ...product }) => product);
    }

    return filteredProducts;
}

/**
 * Get relevance explanation for debugging
 * @param {Object} product - Product object
 * @param {String} query - Search query
 * @param {String} category - Category
 * @returns {Object} Score breakdown
 */
function explainRelevance(product, query, category = 'electronics') {
    const breakdown = {
        product: product.title,
        query,
        totalScore: 0,
        factors: {}
    };

    // This is a simplified version - you can expand for full breakdown
    const score = calculateRelevance(product, query, category);
    breakdown.totalScore = score;

    return breakdown;
}

module.exports = {
    calculateRelevance,
    sortByRelevance,
    explainRelevance
};
