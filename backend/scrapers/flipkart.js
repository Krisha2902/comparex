const BaseScraper = require('./baseScraper');
const { normalizeProductData } = require('../utils/normalizer');
const selectors = require('../config/selectors').flipkart;
const scraperConfig = require('../config/scraperConfig');

class FlipkartScraper extends BaseScraper {
    constructor(browserManager) {
        super(browserManager);
        this.platform = 'flipkart';
    }

    async scrape(url) {
        let page = null;
        try {
            page = await this.getPage(url);

            // Check for bot detection/CAPTCHA
            const pageContent = await page.content();
            if (pageContent.includes('Access Denied') ||
                pageContent.includes('Pardon the interruption') ||
                pageContent.includes('Please verify') ||
                pageContent.includes('security check') ||
                pageContent.includes('captcha')) {
                console.error('❌ Flipkart bot detection triggered - CAPTCHA or access denied');
                throw new Error('PLATFORM_BLOCKED: Flipkart has blocked this request. Please try again later.');
            }

            // Wait for title
            // Try first selector from config
            const titleSelector = selectors.title[0] || 'h1';
            await page.waitForSelector(titleSelector, { timeout: scraperConfig.timeouts.selectorWait }).catch(() => console.log('Title not found immediately'));

            const data = await page.evaluate((selectors) => {
                const getText = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.innerText.trim() : null;
                };

                // Title
                let title = null;
                for (const sel of selectors.title) {
                    const el = document.querySelector(sel);
                    if (el) {
                        title = el.innerText.trim();
                        break;
                    }
                }

                // Prices
                // Flipkart usually has "₹" in the text, we strip it
                let current = null;
                for (const sel of selectors.price.current) {
                    const currentPriceText = getText(sel);
                    if (currentPriceText) {
                        current = parseFloat(currentPriceText.replace(/[^0-9.]/g, ''));
                        break;
                    }
                }

                let mrp = null;
                for (const sel of selectors.price.mrp) {
                    const mrpText = getText(sel);
                    if (mrpText) {
                        mrp = parseFloat(mrpText.replace(/[^0-9.]/g, ''));
                        break;
                    }
                }

                // Images
                const images = [];
                for (const sel of selectors.images) {
                    const imgElements = document.querySelectorAll(sel);
                    imgElements.forEach(img => {
                        if (img.src) images.push(img.src);
                    });
                    if (images.length > 0) break;
                }

                // Description
                let description = null;
                for (const sel of selectors.description) {
                    description = getText(sel);
                    if (description) break;
                }

                // Specifications
                const specs = {};
                if (selectors.specs.row) {
                    document.querySelectorAll(selectors.specs.row).forEach(row => {
                        const key = row.querySelector(selectors.specs.key)?.innerText.trim();
                        const val = row.querySelector(selectors.specs.val)?.innerText.trim();
                        if (key && val) specs[key] = val;
                    });
                }

                // Rating
                let rating = null;
                for (const sel of selectors.rating.value) {
                    const ratingValText = getText(sel);
                    if (ratingValText) {
                        const rv = parseFloat(ratingValText);
                        if (Number.isFinite(rv) && rv >= 0 && rv <= 5) {
                            rating = rv;
                            break;
                        }
                    }
                }

                let count = null;
                for (const sel of selectors.rating.count) {
                    const countText = getText(sel); // "1,234 Ratings & 100 Reviews"
                    if (countText) {
                        const matches = countText.match(/([0-9,]+)\s+Ratings/);
                        if (matches && matches[1]) {
                            const c = parseInt(matches[1].replace(/,/g, ''));
                            if (Number.isFinite(c) && c > 0) {
                                count = c;
                                break;
                            }
                        }
                    }
                }

                return {
                    platform: 'flipkart',
                    url: window.location.href,
                    title,
                    description,
                    images: [...new Set(images)], // Unique images
                    price: {
                        mrp,
                        current: current,
                        currency: 'INR'
                    },
                    rating: {
                        average: rating,
                        count: count
                    },
                    specifications: specs,
                    availability: !document.querySelector(selectors.availability.notifyButton), // Notify me usually means OOS
                    reviews: []
                };
            }, selectors);

            // Fix URL in case it wasn't available in evaluate
            data.url = url;

            return normalizeProductData(data);

        } catch (error) {
            console.error('Flipkart extraction error:', error);
            throw error;
        } finally {
            await this.closePage(page);
        }
    }
}

module.exports = FlipkartScraper;
