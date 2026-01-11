const BaseSearchScraper = require('./baseSearchScraper');

class RelianceSearchScraper extends BaseSearchScraper {
    constructor(browserManager) {
        super(browserManager);
        this.platform = 'reliance';
    }

    buildSearchUrl(query, category) {
        // If category is provided, append it to the query to narrow results
        const combined = category ? `${query} ${category}` : query;
        const encodedQuery = encodeURIComponent(combined);
        return `https://www.reliancedigital.in/search?q=${encodedQuery}`;
    }

    async search(query, options = {}) {
        let page = null;
        try {
            const searchUrl = this.buildSearchUrl(query, options.category);
            page = await this.getPage(searchUrl);

            // Check for bot detection/CAPTCHA - comprehensive checks
            const pageContent = await page.content();
            const botDetectionPatterns = [
                'Access Denied',
                'security check',
                'captcha',
                'bot check',
                'unusual traffic',
                'verify you are human',
                'robot',
                'not automated'
            ];

            for (const pattern of botDetectionPatterns) {
                if (pageContent.toLowerCase().includes(pattern.toLowerCase())) {
                    console.error(`❌ Reliance search bot detection triggered: ${pattern}`);
                    throw new Error('PLATFORM_BLOCKED: Reliance Digital has blocked this request. Please try again later.');
                }
            }

            await this.takeScreenshot(page, `reliance_search_${Date.now()}.png`);

            // Wait for page to fully load - Reliance can be slow (with jitter)
            await new Promise(resolve => setTimeout(resolve, 6000 + Math.random() * 3000));

            const results = await page.evaluate(() => {
                const products = [];

                // Reliance Digital product cards - try multiple selectors
                let productCards = document.querySelectorAll('.sp__product, [class*="product-item"]');

                // Fallback: try common Reliance containers
                if (productCards.length === 0) {
                    productCards = document.querySelectorAll('[class*="product-card"], [class*="productCard"]');
                }

                // Another fallback: grid items
                if (productCards.length === 0) {
                    productCards = document.querySelectorAll('.pl__container li, [class*="ProductCard"]');
                }

                console.log(`Reliance found ${productCards.length} product cards`);

                productCards.forEach((card, index) => {
                    try {
                        // Title - try multiple selectors
                        let titleEl = card.querySelector('.sp__name a, a[class*="product-title"], h3 a');
                        if (!titleEl) titleEl = card.querySelector('a[title]');
                        if (!titleEl) titleEl = card.querySelector('a');

                        if (!titleEl) {
                            console.log(`Reliance: No title found for card ${index}`);
                            return;
                        }

                        const title = titleEl.innerText.trim() || titleEl.getAttribute('title');
                        let productUrl = titleEl.href;
                        if (productUrl && !productUrl.startsWith('http')) {
                            productUrl = 'https://www.reliancedigital.in' + productUrl;
                        }

                        // Price - look for price elements
                        let currentPrice = null;
                        let originalPrice = null;
                        const priceEl = card.querySelector('.TextWeb__Text-sc-1cyx778-0, [class*="price"], .sp__price');
                        if (priceEl) {
                            const priceText = priceEl.innerText.replace(/[^0-9.]/g, '');
                            if (priceText) currentPrice = parseFloat(priceText);
                        }

                        // Original Price
                        const originalPriceEl = card.querySelector('.mrp, .old-price, [class*="mrp"]');
                        if (originalPriceEl) {
                            const originalText = originalPriceEl.innerText.replace(/[^0-9.]/g, '');
                            if (originalText) originalPrice = parseFloat(originalText);
                        }

                        // Rating - use null by default
                        let ratingVal = null;
                        const ratingEl = card.querySelector('[class*="rating"], [class*="stars"], .sp__rating');
                        if (ratingEl) {
                            const ratingText = ratingEl.innerText || ratingEl.textContent;
                            if (ratingText) {
                                const match = ratingText.match(/(\d+\.?\d*)/);
                                if (match) {
                                    const rating = parseFloat(match[1]);
                                    if (Number.isFinite(rating) && rating > 0 && rating <= 5) {
                                        ratingVal = rating;
                                    }
                                }
                            }
                        }

                        // Image - validate URL
                        const imgEl = card.querySelector('img');
                        let image = null;
                        if (imgEl) {
                            const src = imgEl.src || imgEl.getAttribute('data-src');
                            if (src && src.startsWith('http')) {
                                image = src;
                            }
                        }

                        // Only add products with valid price and title
                        if (title && productUrl && currentPrice !== null && currentPrice !== undefined) {
                            products.push({
                                title: title.trim(),
                                price: currentPrice,
                                originalPrice: originalPrice > currentPrice ? originalPrice : null,
                                image: image,
                                productUrl,
                                source: 'Reliance',
                                rating: ratingVal,
                                availability: true
                            });
                        }
                    } catch (err) {
                        console.error('Reliance: Error parsing product card:', err.message);
                    }
                });

                return products;
            });

            console.log(`Reliance search extracted ${results.length} products`);
            if (results.length > 0) {
                console.log('Sample Reliance product:', results[0]);
            }
            return results;

        } catch (error) {
            console.error('Reliance search extraction error:', error);
            throw error;
        } finally {
            await this.closePage(page);
        }
    }
}

module.exports = RelianceSearchScraper;
