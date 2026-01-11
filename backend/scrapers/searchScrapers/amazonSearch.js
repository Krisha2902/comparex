const BaseSearchScraper = require('./baseSearchScraper');
const selectors = require('../../config/selectors').amazonSearch;
const scraperConfig = require('../../config/scraperConfig');

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
            console.log(`[amazon] Navigating to: ${searchUrl}`);

            page = await this.browserManager.newPage();

            // Set specific User Agent to avoid detection
            await page.setUserAgent(scraperConfig.userAgents.desktop);

            // Add extra headers
            await page.setExtraHTTPHeaders({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"'
            });

            try {
                await page.goto(searchUrl, {
                    waitUntil: 'networkidle2',
                    timeout: scraperConfig.timeouts.pageLoad
                });
            } catch (err) {
                console.warn(`[amazon] Navigation timeout, continuing...`, err.message);
            }

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
            await new Promise(resolve => setTimeout(resolve, scraperConfig.timeouts.searchWait));

            const results = await page.evaluate((selectors) => {
                const products = [];

                // Try to find product cards with multiple selector strategies
                let productCards = [];
                for (const sel of selectors.productCard) {
                    productCards = document.querySelectorAll(sel);
                    if (productCards.length > 0) break;
                }

                console.log(`Found ${productCards.length} product cards`);

                productCards.forEach((card, index) => {
                    try {
                        // Title and Link - try multiple selectors
                        let titleEl = null;
                        for (const sel of selectors.title) {
                            titleEl = card.querySelector(sel);
                            if (titleEl) break;
                        }

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
                        for (const sel of selectors.price) {
                            const priceEl = card.querySelector(sel);
                            if (priceEl) {
                                const priceText = (priceEl.innerText || priceEl.textContent).replace(/[^0-9.]/g, '');
                                if (priceText) {
                                    currentPrice = parseFloat(priceText);
                                    break;
                                }
                            }
                        }

                        // Rating - try to extract from stars
                        let ratingVal = null;
                        for (const sel of selectors.rating) {
                            const ratingEl = card.querySelector(sel);
                            if (ratingEl) {
                                const ratingText = ratingEl.innerText || ratingEl.textContent;
                                if (ratingText) {
                                    const match = ratingText.match(/(\d+\.?\d*)/);
                                    if (match) {
                                        ratingVal = parseFloat(match[1]);
                                        break;
                                    }
                                }
                            }
                        }

                        // Review count
                        let ratingCount = null;
                        for (const sel of selectors.reviewCount) {
                            const countEl = card.querySelector(sel);
                            if (countEl) {
                                const countText = countEl.innerText.replace(/[^0-9]/g, '');
                                if (countText) {
                                    ratingCount = parseInt(countText);
                                    break;
                                }
                            }
                        }

                        // Image - validate URL
                        let image = null;
                        for (const sel of selectors.image) {
                            const imgEl = card.querySelector(sel);
                            if (imgEl && imgEl.src && imgEl.src.startsWith('http')) {
                                image = imgEl.src;
                                break;
                            }
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
            }, selectors);

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
