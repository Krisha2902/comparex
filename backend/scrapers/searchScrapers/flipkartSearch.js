const BaseSearchScraper = require('./baseSearchScraper');

class FlipkartSearchScraper extends BaseSearchScraper {
    constructor(browserManager) {
        super(browserManager);
        this.platform = 'flipkart';
    }

    buildSearchUrl(query, category) {
        const combined = category ? `${query} ${category}` : query;
        const encodedQuery = encodeURIComponent(combined);
        return `https://www.flipkart.com/search?q=${encodedQuery}`;
    }

    async search(query, options = {}) {
        let page = null;
        try {
            const searchUrl = this.buildSearchUrl(query, options.category);
            console.log(`[flipkart] Navigating to: ${searchUrl}`);
            
            // Use direct page.goto for faster loading with domcontentloaded
            page = await this.browserManager.newPage();
            
            // Add extra headers to avoid bot detection
            await page.setExtraHTTPHeaders({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            });

            try {
                await page.goto(searchUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 25000
                });
            } catch (err) {
                console.warn(`[flipkart] Navigation timeout, continuing with partial page...`, err.message);
            }

            // Check for bot detection/CAPTCHA - comprehensive checks
            const pageContent = await page.content();
            const botDetectionPatterns = [
                'Access Denied',
                'security check',
                'Pardon the interruption',
                'bot check',
                'unusual traffic',
                'verify you are human',
                'robot',
                'captcha',
                'not automated'
            ];

            for (const pattern of botDetectionPatterns) {
                if (pageContent.toLowerCase().includes(pattern.toLowerCase())) {
                    console.error(`❌ Flipkart search bot detection triggered: ${pattern}`);
                    throw new Error('PLATFORM_BLOCKED: Flipkart has blocked this request. Please try again later.');
                }
            }

            await this.takeScreenshot(page, `flipkart_search_${Date.now()}.png`);

            // Shorter wait for page content to load
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

            const results = await page.evaluate(() => {
                const products = [];

                // Flipkart product cards - try multiple selectors
                let productCards = document.querySelectorAll('[data-id]');

                // Fallback: try common Flipkart containers
                if (productCards.length === 0) {
                    productCards = document.querySelectorAll('._1AtVbE, .cPHDOP, ._13oc-S');
                }

                // Another fallback: divs with certain classes containing product info
                if (productCards.length === 0) {
                    productCards = document.querySelectorAll('div[class*="yKfJKb"]');
                }

                console.log(`Flipkart found ${productCards.length} product cards`);

                productCards.forEach((card, index) => {
                    try {
                        // Title - try multiple selectors
                        let titleEl = card.querySelector('a[class*="IRpwTa"], a[class*="s1Q9rs"], a[class*="_2rpwqI"]');
                        if (!titleEl) titleEl = card.querySelector('a[title]');
                        if (!titleEl) titleEl = card.querySelector('a');

                        if (!titleEl) {
                            console.log(`Flipkart: No title found for card ${index}`);
                            return;
                        }

                        const title = titleEl.getAttribute('title') || titleEl.innerText.trim();
                        let productUrl = titleEl.href;
                        if (productUrl && !productUrl.startsWith('http')) {
                            productUrl = 'https://www.flipkart.com' + productUrl;
                        }

                        // Price
                        let currentPrice = null;
                        let originalPrice = null;
                        const priceEl = card.querySelector('div[class*="Nx9bqj"]');
                        if (priceEl) {
                            const priceText = priceEl.innerText.replace(/[^0-9.]/g, '');
                            if (priceText) currentPrice = parseFloat(priceText);
                        }

                        // Original Price (MRP)
                        const originalPriceEl = card.querySelector('div[class*="_3I9_wc"]');
                        if (originalPriceEl) {
                            const originalText = originalPriceEl.innerText.replace(/[^0-9.]/g, '');
                            if (originalText) originalPrice = parseFloat(originalText);
                        }

                        // Rating - use null by default
                        let ratingVal = null;
                        let ratingCount = 0;
                        const ratingEl = card.querySelector('[class*="rating"], [class*="XQR5OD"]');
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
                                source: 'Flipkart',
                                rating: ratingVal,
                                availability: true
                            });
                        }
                    } catch (err) {
                        console.error('Flipkart: Error parsing product card:', err.message);
                    }
                });

                return products;
            });

            console.log(`Flipkart search extracted ${results.length} products`);
            return results;

        } catch (error) {
            console.error('Flipkart search extraction error:', error);
            throw error;
        } finally {
            await this.closePage(page);
        }
    }
}

module.exports = FlipkartSearchScraper;
