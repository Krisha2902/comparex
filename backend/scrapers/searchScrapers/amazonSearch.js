const BaseSearchScraper = require('./baseSearchScraper');

class AmazonSearchScraper extends BaseSearchScraper {
    constructor(browserManager) {
        super(browserManager);
        this.platform = 'amazon';
    }

    buildSearchUrl(query, category) {
        // If category is provided, append it to the query to narrow results
        const combined = category ? `${query} ${category}` : query;
        const encodedQuery = encodeURIComponent(combined);
        return `https://www.amazon.in/s?k=${encodedQuery}`;
    }

    async search(query, options = {}) {
        let page = null;
        try {
            const searchUrl = this.buildSearchUrl(query, options.category);
            page = await this.getPage(searchUrl);

            // Check for bot detection/CAPTCHA
            const pageContent = await page.content();
            if (pageContent.includes('Type the characters you see') ||
                pageContent.includes('Access Denied') ||
                pageContent.includes('Robot Check') ||
                pageContent.includes('Enter the characters')) {
                console.error('❌ Amazon search bot detection triggered');
                throw new Error('PLATFORM_BLOCKED: Amazon has blocked this request. Please try again later.');
            }

            // Take screenshot for debugging
            await this.takeScreenshot(page, `amazon_search_${Date.now()}.png`);

            // Wait longer for search results to load (using Promise-based delay)
            await new Promise(resolve => setTimeout(resolve, 5000));

            const results = await page.evaluate(() => {
                const products = [];

                // Try to find product cards with multiple selector strategies
                let productCards = document.querySelectorAll('[data-component-type="s-search-result"]');

                // Fallback: try data-asin attribute
                if (productCards.length === 0) {
                    productCards = document.querySelectorAll('div[data-asin]:not([data-asin=""])');
                }

                console.log(`Found ${productCards.length} product cards`);

                if (productCards.length === 0) {
                    console.log('No product cards found. Trying alternative selectors...');
                    // Try another fallback
                    productCards = document.querySelectorAll('[data-index]');
                    console.log(`Alternative selector found ${productCards.length} items`);
                }

                productCards.forEach((card, index) => {
                    try {
                        // Title and Link - try multiple selectors
                        let titleEl = card.querySelector('h2 a.a-link-normal');
                        if (!titleEl) titleEl = card.querySelector('h2 a');
                        if (!titleEl) titleEl = card.querySelector('.a-link-normal.s-underline-text');
                        if (!titleEl) titleEl = card.querySelector('a.a-link-normal');

                        if (!titleEl) {
                            console.log(`No title found for card ${index}`);
                            return;
                        }

                        const title = titleEl.innerText.trim();
                        let productUrl = titleEl.href;
                        if (!productUrl.startsWith('http')) {
                            productUrl = 'https://www.amazon.in' + productUrl;
                        }

                        // Price - look for any price element
                        let currentPrice = null;
                        const priceEl = card.querySelector('.a-price span.a-offscreen, .a-price-whole');
                        if (priceEl) {
                            const priceText = (priceEl.innerText || priceEl.textContent).replace(/[^0-9.]/g, '');
                            if (priceText) currentPrice = parseFloat(priceText);
                        }

                        // Rating - try to extract from stars
                        let ratingVal = 0;
                        let ratingCount = 0;
                        const ratingEl = card.querySelector('.a-star-small span.a-icon-alt, i.a-icon-star span.a-icon-alt');
                        if (ratingEl) {
                            const ratingText = ratingEl.innerText || ratingEl.textContent;
                            if (ratingText) {
                                const match = ratingText.match(/(\d+\.?\d*)/);
                                if (match) ratingVal = parseFloat(match[1]);
                            }
                        }

                        // Review count
                        const countEl = card.querySelector('.a-size-base.s-color-base');
                        if (countEl) {
                            const countText = countEl.innerText.replace(/[^0-9]/g, '');
                            if (countText) ratingCount = parseInt(countText);
                        }

                        // Image - validate URL
                        const imgEl = card.querySelector('img');
                        let image = null;
                        if (imgEl && imgEl.src && imgEl.src.startsWith('http')) {
                            image = imgEl.src;
                        }

                        // Only add if we have basic info
                        // Only add products with valid price and title
                        if (title && productUrl && currentPrice !== null && currentPrice !== undefined) {
                            products.push({
                                title: title.trim(),
                                price: currentPrice,
                                image: image,
                                productUrl,
                                source: 'Amazon',
                                rating: ratingVal,
                                availability: true
                            });
                        }
                    } catch (err) {
                        console.error('Error parsing product card:', err.message);
                    }
                });

                return products;
            });

            console.log(`Amazon search extracted ${results.length} products`);
            if (results.length > 0) {
                console.log('Sample Amazon product:', results[0]);
            }
            return results;

        } catch (error) {
            console.error('Amazon search extraction error:', error);
            throw error;
        } finally {
            await this.closePage(page);
        }
    }
}

module.exports = AmazonSearchScraper;
