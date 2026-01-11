const BaseScraper = require('./baseScraper');
const { normalizeProductData } = require('../utils/normalizer');

class RelianceScraper extends BaseScraper {
    constructor(browserManager) {
        super(browserManager);
        this.platform = 'reliance';
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
                console.error('❌ Reliance Digital bot detection triggered - CAPTCHA or access denied');
                throw new Error('PLATFORM_BLOCKED: Reliance Digital has blocked this request. Please try again later.');
            }

            // Wait for generic container or title
            await Promise.race([
                page.waitForSelector('h1', { timeout: 10000 }),
                page.waitForSelector('.pdp__title', { timeout: 10000 })
            ]).catch(() => console.log('Reliance: Title element not found immediately'));

            const data = await page.evaluate(() => {
                const getText = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.innerText.trim() : null;
                };

                // Reliance Digital selectors (Best effort based on common patterns)
                const title = getText('h1') || getText('.pdp__titleName');

                // Prices
                const currentPriceText = getText('.pdp__offerPrice') || getText('.deal-price');
                const current = currentPriceText ? parseFloat(currentPriceText.replace(/[^0-9.]/g, '')) : null;

                const mrpText = getText('.pdp__mrpPrice') || getText('.mrp-price');
                const mrp = mrpText ? parseFloat(mrpText.replace(/[^0-9.]/g, '')) : null;

                // Images
                const images = [];
                document.querySelectorAll('.pdp__imgZoom img, .lz-img').forEach(img => {
                    if (img.src) images.push(img.src);
                });

                // Description
                const description = getText('.pdp__desc') || getText('.spec-container');

                // Specs
                const specs = {};
                document.querySelectorAll('.pdp__tab-info li').forEach(li => {
                    const parts = li.innerText.split(':');
                    if (parts.length > 1) {
                        specs[parts[0].trim()] = parts.slice(1).join(':').trim();
                    }
                });

                // Rating - use null when not present and validate
                let ratingVal = null;
                let ratingCount = null;
                const ratingEl = document.querySelector('[class*="rating"], [class*="stars"], .pdp__rating');
                if (ratingEl) {
                    const ratingText = ratingEl.innerText || ratingEl.textContent;
                    if (ratingText) {
                        const match = ratingText.match(/(\d+\.?\d*)/);
                        if (match) {
                            const rv = parseFloat(match[1]);
                            if (Number.isFinite(rv) && rv >= 0 && rv <= 5) ratingVal = rv;
                        }
                    }
                }

                // Availability - check for out of stock indicators
                const isOutOfStock = !!(
                    document.querySelector('[class*="outOfStock"], [class*="unavailable"]') ||
                    document.querySelector('.pdp__notAvailable') ||
                    document.body.innerText.toLowerCase().includes('out of stock')
                );

                return {
                    platform: 'reliance',
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
            });

            data.url = url;

            return normalizeProductData(data);

        } catch (error) {
            console.error('Reliance extraction error:', error);
            throw error;
        } finally {
            await this.closePage(page);
        }
    }
}

module.exports = RelianceScraper;
