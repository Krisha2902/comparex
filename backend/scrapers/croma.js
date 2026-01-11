const BaseScraper = require('./baseScraper');
const { normalizeProductData } = require('../utils/normalizer');

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
            await page.waitForSelector('h1', { timeout: 15000 }).catch(() => console.log('Title not found immediately'));

            const data = await page.evaluate(() => {
                const getText = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.innerText.trim() : null;
                };

                const title = document.querySelector('h1')?.innerText.trim();

                // Prices
                // Croma structure varies, checking common classes
                const currentPriceText = getText('.pd-price') || getText('.amount');
                const current = currentPriceText ? parseFloat(currentPriceText.replace(/[^0-9.]/g, '')) : null;

                const mrpText = getText('.pd-mrp') || getText('.old-price');
                const mrp = mrpText ? parseFloat(mrpText.replace(/[^0-9.]/g, '')) : null;

                // Images
                const images = [];
                // Croma uses a slider usually
                const imgElements = document.querySelectorAll('.product-gallery-slider img') || document.querySelectorAll('.pd-img img');
                imgElements.forEach(img => {
                    if (img.src) images.push(img.src);
                });

                // Description
                const description = getText('.overview-desc') || getText('.cp-desc');

                // Specifications
                const specs = {};
                // Specs are often in lists or tables
                // Looking for key-value pairs in lists
                const specItems = document.querySelectorAll('.cp-specification li');
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
                const ratingEl = document.querySelector('[class*="rating"], [class*="stars"]');
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
                    document.body.innerText.toLowerCase().includes('out of stock')
                );

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
            });

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
