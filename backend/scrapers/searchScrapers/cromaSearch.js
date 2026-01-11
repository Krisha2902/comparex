const BaseSearchScraper = require('./baseSearchScraper');

class CromaSearchScraper extends BaseSearchScraper {
    constructor(browserManager) {
        super(browserManager);
        this.platform = 'croma';
    }

    buildSearchUrl(query, category) {
        // If category is provided, append it to the query to narrow results
        const combined = category ? `${query} ${category}` : query;
        const encodedQuery = encodeURIComponent(combined);
        return `https://www.croma.com/search/?q=${encodedQuery}`;
    }

    async search(query, options = {}) {
        let page = null;
        try {
            const searchUrl = this.buildSearchUrl(query, options.category);
            console.log(`[croma] Navigating to: ${searchUrl}`);
            
            // Use direct page.goto for faster loading with domcontentloaded
            page = await this.browserManager.newPage();
            try {
                await page.goto(searchUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 25000
                });
            } catch (err) {
                console.warn(`[croma] Navigation timeout, continuing with partial page...`, err.message);
            }

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
                    console.error(`❌ Croma search bot detection triggered: ${pattern}`);
                    throw new Error('PLATFORM_BLOCKED: Croma has blocked this request. Please try again later.');
                }
            }

            await this.takeScreenshot(page, `croma_search_${Date.now()}.png`);

            // Shorter wait for page content to load
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

            const results = await page.evaluate(() => {
                const products = [];

                // Try multiple selectors for Croma
                let productCards = document.querySelectorAll('.product-item, li[class*="product"]');

                if (productCards.length === 0) {
                    productCards = document.querySelectorAll('[class*="product-card"], [class*="productCard"]');
                }

                if (productCards.length === 0) {
                    productCards = document.querySelectorAll('li.MuiGrid-item, div[class*="productLi"]');
                }

                console.log(`Croma found ${productCards.length} product cards`);

                productCards.forEach((card, index) => {
                    try {
                        // Title - try multiple selectors
                        let titleEl = card.querySelector('.product-title a, h3 a, a[class*="title"]');
                        if (!titleEl) titleEl = card.querySelector('a');

                        if (!titleEl) {
                            console.log(`Croma: No title found for card ${index}`);
                            return;
                        }

                        const title = titleEl.innerText.trim() || titleEl.getAttribute('title');
                        let productUrl = titleEl.href;

                        // Price
                        let currentPrice = null;
                        let originalPrice = null;
                        const priceEl = card.querySelector('.amount, span[class*="price"], .new-price');
                        if (priceEl) {
                            const priceText = priceEl.innerText.replace(/[^0-9.]/g, '');
                            if (priceText) currentPrice = parseFloat(priceText);
                        }

                        // Original Price
                        const originalPriceEl = card.querySelector('.old-price, .strikethrough-price, span[style*="text-decoration: line-through"]');
                        if (originalPriceEl) {
                            const originalText = originalPriceEl.innerText.replace(/[^0-9.]/g, '');
                            if (originalText) originalPrice = parseFloat(originalText);
                        }

                        // Rating - use null by default
                        let ratingVal = null;
                        let ratingCount = 0;
                        const ratingEl = card.querySelector('[class*="rating"], [class*="stars"], .rating-info');
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
                        if (imgEl && imgEl.src && imgEl.src.startsWith('http')) {
                            image = imgEl.src;
                        }

                        // Only add products with valid price and title
                        if (title && productUrl && currentPrice !== null && currentPrice !== undefined) {
                            products.push({
                                title: title.trim(),
                                price: currentPrice,
                                originalPrice: originalPrice > currentPrice ? originalPrice : null,
                                image: image,
                                productUrl,
                                source: 'Croma',
                                rating: ratingVal,
                                availability: true
                            });
                        }
                    } catch (err) {
                        console.error('Croma: Error parsing product card:', err.message);
                    }
                });

                return products;
            });

            console.log(`Croma search extracted ${results.length} products`);
            return results;

        } catch (error) {
            console.error('Croma search extraction error:', error);
            throw error;
        } finally {
            await this.closePage(page);
        }
    }
}

module.exports = CromaSearchScraper;
