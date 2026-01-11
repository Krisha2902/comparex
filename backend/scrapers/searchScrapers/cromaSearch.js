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

            // Check if page has actual content (not a block page)
            const hasContent = await page.evaluate(() => {
                // Check if product cards are present
                const productCards = document.querySelectorAll('.product-item, li[class*="product"], [class*="product-card"]');
                return productCards.length > 0;
            });

            if (!hasContent) {
                console.log(`[croma] No product content detected, page might be blocked. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                // Try again with fresh page
                throw new Error('BLOCKED: No product content detected on page');
            }

            const results = await page.evaluate(() => {
                const products = [];

                // Get all product cards from Croma
                let productCards = document.querySelectorAll('.productCardImg, [class*="productImg"], li.MuiGrid-item, [class*="productCard"], .product-item');

                console.log(`Croma found ${productCards.length} product cards`);

                if (productCards.length === 0) {
                    return products;
                }

                productCards.forEach((card, index) => {
                    try {
                        // Extract data from card's text content (text mining approach)
                        const cardText = card.innerText || card.textContent;

                        // Get title from link attribute or first line
                        let title = '';
                        const titleLink = card.querySelector('a[title]') || card.querySelector('a.productCardImg');
                        if (titleLink) {
                            title = titleLink.getAttribute('title') || titleLink.innerText;
                        }
                        if (!title) {
                            const lines = cardText.split('\n').filter(l => l.trim());
                            title = lines.length > 0 ? lines[0] : '';
                        }

                        if (!title) {
                            return;
                        }

                        // Extract prices - Croma uses ₹ or Rs. followed by amount
                        let currentPrice = null;
                        let originalPrice = null;
                        const priceMatch = cardText.match(/₹\s*([\d,]+)/);
                        if (priceMatch) {
                            currentPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
                        }

                        // Look for original price (second price if exists)
                        const priceMatches = cardText.match(/₹\s*([\d,]+)/g);
                        if (priceMatches && priceMatches.length >= 2) {
                            originalPrice = parseFloat(priceMatches[1].replace(/₹|,/g, ''));
                        }

                        // Extract rating
                        let rating = null;
                        const ratingMatch = cardText.match(/(\d+\.?\d*)\s*(?:★|stars|out of)/);
                        if (ratingMatch) {
                            rating = parseFloat(ratingMatch[1]);
                        }

                        // Extract product URL
                        let productUrl = '';
                        const linkEl = card.querySelector('a[href]');
                        if (linkEl) {
                            productUrl = linkEl.href || '';
                            if (!productUrl.startsWith('http')) {
                                productUrl = 'https://www.croma.com' + productUrl;
                            }
                        }

                        // Get image
                        let imageUrl = '';
                        const imgEl = card.querySelector('img');
                        if (imgEl) {
                            imageUrl = imgEl.src || imgEl.getAttribute('data-src') || '';
                        }

                        // Only add if we have at least title and price
                        if (title && currentPrice) {
                            products.push({
                                title: title.trim(),
                                price: currentPrice,
                                originalPrice: originalPrice || currentPrice,
                                rating: rating || null,
                                image: imageUrl,
                                productUrl: productUrl || '',
                                availability: true
                            });
                        }

                    } catch (e) {
                        console.log(`Error parsing card ${index}: ${e.message}`);
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
