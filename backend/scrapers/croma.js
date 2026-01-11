const BaseScraper = require('./baseScraper');
const { normalizeProductData } = require('../utils/normalizer');
const selectors = require('../config/selectors').croma;
const scraperConfig = require('../config/scraperConfig');

class CromaScraper extends BaseScraper {
    constructor(browserManager) {
        super(browserManager);
        this.platform = 'croma';
    }

    async scrape(url) {
        let page = null;
        try {
            page = await this.getPage(url);

            // Check for bot detection/CAPTCHA
            const pageContent = await page.content();
            if (pageContent.includes('Access Denied') ||
                pageContent.includes('security check') ||
                pageContent.includes('verify you are human') ||
                pageContent.includes('captcha')) {
                console.error('❌ Croma bot detection triggered - CAPTCHA or access denied');
                throw new Error('PLATFORM_BLOCKED: Croma has blocked this request. Please try again later.');
            }

            // Wait for title
            const titleSelector = selectors.title[0] || 'h1';
            await page.waitForSelector(titleSelector, { timeout: scraperConfig.timeouts.selectorWait }).catch(() => console.log('Title not found immediately'));

            const data = await page.evaluate((selectors) => {
                const getText = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.innerText.trim() : null;
                };

                let title = null;
                for (const sel of selectors.title) {
                    const el = document.querySelector(sel);
                    if (el) {
                        title = el.innerText.trim();
                        break;
                    }
                }

                // Prices
                // Croma structure varies, checking common classes
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
                // Croma uses a slider usually
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
                // Specs are often in lists or tables
                // Looking for key-value pairs in lists
                const specItems = document.querySelectorAll(selectors.specs.items);
                specItems.forEach(item => {
                    // "Key : Value" format often
                    const text = item.innerText;
                    const parts = text.split(':');
                    if (parts.length >= 2) {
                        const key = parts[0].trim();
                        const val = parts.slice(1).join(':').trim();
                        specs[key] = val;
                    }
                });

                // Rating - use null when not present and validate
                let ratingVal = null;
                let ratingCount = null;
                for (const sel of selectors.rating.element) {
                    const ratingEl = document.querySelector(sel);
                    if (ratingEl) {
                        const ratingText = ratingEl.innerText || ratingEl.textContent;
                        if (ratingText) {
                            const match = ratingText.match(/(\d+\.?\d*)/);
                            if (match) {
                                const rv = parseFloat(match[1]);
                                if (Number.isFinite(rv) && rv >= 0 && rv <= 5) {
                                    ratingVal = rv;
                                    break;
                                }
                            }
                        }
                    }
                }

                // Availability - check for out of stock indicators
                let isOutOfStock = false;
                for (const sel of selectors.availability.outOfStock) {
                    if (document.querySelector(sel)) {
                        isOutOfStock = true;
                        break;
                    }
                }
                if (!isOutOfStock) {
                    if (document.body.innerText.toLowerCase().includes('out of stock')) {
                        isOutOfStock = true;
                    }
                }

                return {
                    platform: 'croma',
                    url: window.location.href,
                    title,
                    description,
                    images: [...new Set(images)],
                    price: {
                        mrp,
                        current: current,
                        currency: 'INR'
                    },
                    rating: {
                        average: ratingVal,
                        count: ratingCount
                    },
                    specifications: specs,
                    availability: !isOutOfStock,
                    reviews: []
                };
            }, selectors);

            data.url = url;

            return normalizeProductData(data);

        } catch (error) {
            console.error('Croma extraction error:', error);
            throw error;
        } finally {
            await this.closePage(page);
        }
    }
}

module.exports = CromaScraper;
