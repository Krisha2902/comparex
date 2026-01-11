const BaseScraper = require('./baseScraper');
const { normalizeProductData } = require('../utils/normalizer');

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
            await page.waitForSelector('h1', { timeout: 10000 }).catch(() => console.log('Title not found immediately'));

            const data = await page.evaluate(() => {
                const getText = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.innerText.trim() : null;
                };

                const title = document.querySelector('h1')?.innerText.trim() || getText('.B_NuCI');

                // Prices
                // Flipkart usually has "₹" in the text, we strip it
                const currentPriceText = getText('div[class*="_30jeq3"]');
                const current = currentPriceText ? parseFloat(currentPriceText.replace(/[^0-9.]/g, '')) : null;

                const mrpText = getText('div[class*="_3I9_wc"]');
                const mrp = mrpText ? parseFloat(mrpText.replace(/[^0-9.]/g, '')) : null;

                // Images
                // Often in a list, or we can get the main one
                const images = [];
                const imgElements = document.querySelectorAll('img[class*="_396cs4"]');
                imgElements.forEach(img => {
                    if (img.src) images.push(img.src);
                });

                // Description
                const description = getText('.X3BRps') || getText('div[class*="_1mXcCf"]');

                // Specifications
                const specs = {};
                document.querySelectorAll('.row').forEach(row => {
                    const key = row.querySelector('.col-3-12')?.innerText.trim();
                    const val = row.querySelector('.col-9-12')?.innerText.trim();
                    if (key && val) specs[key] = val;
                });

                // Rating - use null for missing and validate range
                const ratingValText = getText('div[class*="_3LWZlK"]');
                let rating = null;
                if (ratingValText) {
                    const rv = parseFloat(ratingValText);
                    if (Number.isFinite(rv) && rv >= 0 && rv <= 5) rating = rv;
                }

                const countText = getText('span[class*="_2_R_DZ"]'); // "1,234 Ratings & 100 Reviews"
                let count = null;
                if (countText) {
                    const matches = countText.match(/([0-9,]+)\s+Ratings/);
                    if (matches && matches[1]) {
                        const c = parseInt(matches[1].replace(/,/g, ''));
                        if (Number.isFinite(c) && c > 0) count = c;
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
                    availability: !document.querySelector('button[class*="_32l7f0"]'), // Notify me usually means OOS
                    reviews: []
                };
            });

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
