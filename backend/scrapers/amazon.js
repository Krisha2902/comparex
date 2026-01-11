const BaseScraper = require('./baseScraper');
const { normalizeProductData } = require('../utils/normalizer');
const selectors = require('../config/selectors').amazon;

class AmazonScraper extends BaseScraper {
    constructor(browserManager) {
        super(browserManager);
        this.platform = 'amazon';
    }

    async scrape(url) {
        let page = null;
        try {
            page = await this.getPage(url);

            // Take screenshot for debugging
            await this.takeScreenshot(page, `amazon_${Date.now()}.png`);

            // Check if we hit a CAPTCHA or access denied page
            const pageContent = await page.content();
            if (pageContent.includes('Type the characters you see') ||
                pageContent.includes('Access Denied') ||
                pageContent.includes('Robot Check') ||
                pageContent.includes('Enter the characters') ||
                pageContent.includes('Sorry, we just need to make sure')) {
                console.error('❌ Amazon bot detection triggered - CAPTCHA or access denied');
                throw new Error('PLATFORM_BLOCKED: Amazon has blocked this request. Please try again later or use a different IP.');
            }

            // Wait for critical elements with multiple fallbacks
            // Use config selectors
            const titlePromise = selectors.title.map(sel => page.waitForSelector(sel, { timeout: 5000 }).catch(() => null));
            await Promise.race([
                ...titlePromise,
                new Promise(resolve => setTimeout(resolve, 5000))
            ]);

            const data = await page.evaluate((selectors) => {
                const getText = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.innerText.trim() : null;
                };

                const getAttribute = (selector, attr) => {
                    const el = document.querySelector(selector);
                    return el ? el.getAttribute(attr) : null;
                };

                // Title - try multiple selectors
                let title = null;
                for (const sel of selectors.title) {
                    title = getText(sel);
                    if (title) break;
                }

                // Prices with multiple fallback selectors
                let mrp = null;
                let currentPrice = null;

                // Current price selectors
                for (const selector of selectors.price.current) {
                    const priceEl = document.querySelector(selector);
                    if (priceEl && !currentPrice) {
                        const priceText = priceEl.innerText || priceEl.textContent;
                        if (priceText) {
                            currentPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                            if (currentPrice) break;
                        }
                    }
                }

                // MRP selectors
                for (const selector of selectors.price.mrp) {
                    const mrpEl = document.querySelector(selector);
                    if (mrpEl && !mrp) {
                        const mrpText = mrpEl.innerText || mrpEl.textContent;
                        if (mrpText) {
                            mrp = parseFloat(mrpText.replace(/[^0-9.]/g, ''));
                            if (mrp && mrp !== currentPrice) break;
                        }
                    }
                }

                // Images
                let images = [];
                try {
                    const landingImage = document.querySelector('#landingImage');
                    if (landingImage) {
                        const dynamicImages = landingImage.getAttribute('data-a-dynamic-image');
                        if (dynamicImages) {
                            const colorImages = JSON.parse(dynamicImages);
                            images = Object.keys(colorImages);
                        } else if (landingImage.src) {
                            images.push(landingImage.src);
                        }
                    }
                } catch (e) {
                    // Fallback to any product images
                    document.querySelectorAll('#altImages img, .imageThumbnail img').forEach(img => {
                        if (img.src && !img.src.includes('data:image')) {
                            images.push(img.src);
                        }
                    });
                }

                // Description
                let description = null;
                for (const sel of selectors.description) {
                    description = getText(sel);
                    if (description) break;
                }

                // Brand
                let brand = null;
                for (const sel of selectors.brand) {
                    brand = getText(sel) || getAttribute(sel, 'innerText');
                    if (brand) break;
                }


                // Specifications
                const specs = {};

                // Try product details table
                document.querySelectorAll('#productDetails_techSpec_section_1 tr, .prodDetTable tr').forEach(row => {
                    const key = row.querySelector('th')?.innerText.trim();
                    const val = row.querySelector('td')?.innerText.trim();
                    if (key && val) specs[key] = val;
                });

                // Try detail bullets
                document.querySelectorAll('#detailBullets_feature_div li').forEach(li => {
                    const text = li.innerText;
                    if (text.includes(':')) {
                        const parts = text.split(':');
                        const key = parts[0].trim();
                        const val = parts.slice(1).join(':').trim();
                        if (key && val) specs[key] = val;
                    }
                });

                // Rating - use null when not present and validate range
                let ratingVal = null;
                let ratingCount = null;

                let ratingText = null;
                for (const sel of selectors.rating.value) {
                    ratingText = getText(sel);
                    if (ratingText) break;
                }

                if (ratingText) {
                    const match = ratingText.match(/(\d+\.?\d*)\s*out of/);
                    if (match) {
                        const rv = parseFloat(match[1]);
                        if (Number.isFinite(rv) && rv >= 0 && rv <= 5) ratingVal = rv;
                    }
                }

                let countText = null;
                for (const sel of selectors.rating.count) {
                    countText = getText(sel);
                    if (countText) break;
                }

                if (countText) {
                    const cnt = parseInt(countText.replace(/[^0-9]/g, ''));
                    if (Number.isFinite(cnt) && cnt > 0) ratingCount = cnt;
                }

                // Availability
                let availability = false;
                for (const sel of selectors.availability) {
                    if (document.querySelector(sel)) {
                        availability = true;
                        break;
                    }
                }
                if (!availability) {
                    // Check text content also simply
                    const availText = getText('#availability');
                    if (availText && availText.toLowerCase().includes('in stock')) {
                        availability = true;
                    }
                }


                return {
                    platform: 'amazon',
                    url: window.location.href,
                    title,
                    brand,
                    description,
                    images: [...new Set(images)],
                    price: {
                        mrp,
                        current: currentPrice,
                        currency: 'INR'
                    },
                    rating: {
                        average: ratingVal,
                        count: ratingCount
                    },
                    specifications: specs,
                    availability,
                    reviews: []
                };
            }, selectors);

            data.url = url;

            return normalizeProductData(data);

        } catch (error) {
            console.error('Amazon extraction error:', error);
            throw error;
        } finally {
            await this.closePage(page);
        }
    }
}

module.exports = AmazonScraper;
