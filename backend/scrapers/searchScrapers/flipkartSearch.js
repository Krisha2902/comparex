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

            page = await this.browserManager.newPage();

            // Set User Agent as per reference
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
            );

            // Debug logs
            page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));

            try {
                await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 60000 });
            } catch (err) {
                console.log("Navigation error:", err.message);
                throw err;
            }

            console.log("Loaded URL:", page.url());

            const results = await page.evaluate(() => {
                function extractImage(card) {
                    const img = card.querySelector("img");

                    if (img) {
                        let src =
                            img.getAttribute("src") ||
                            img.getAttribute("data-src") ||
                            img.getAttribute("data-image") ||
                            img.getAttribute("data-img") ||
                            img.getAttribute("srcset");

                        // srcset handling: take first URL
                        if (src && src.includes(" ")) {
                            src = src.split(" ")[0];
                        }

                        if (src && !src.startsWith("http")) {
                            src = "https:" + src;
                        }

                        if (src) return src;
                    }

                    // Try background-image fallback
                    const divs = card.querySelectorAll("div");
                    for (const d of Array.from(divs)) {
                        const bg = d.style?.backgroundImage;
                        if (bg && bg.includes("url(")) {
                            return bg
                                .replace(/^url\(["']?/, "")
                                .replace(/["']?\)$/, "");
                        }
                    }

                    return null;
                }

                function extractPrice(card) {
                    const text = card.textContent || "";
                    const match = text.match(/₹\s?[\d,]+/);
                    if (!match) return null;
                    return parseFloat(match[0].replace(/[₹,\s]/g, ""));
                }

                const items = [];

                // Flipkart uses a[href*='/p/'] for product cards
                const cards = document.querySelectorAll("a[href*='/p/']");

                cards.forEach((card) => {
                    const titleEl = card.querySelector("div._4rR01T, .s1Q9rs, .IRpwTa");

                    const title =
                        titleEl?.textContent?.trim() ||
                        card.textContent?.split("\n")[0]?.trim() ||
                        null;

                    const price = extractPrice(card);
                    const link = card.getAttribute("href")
                        ? "https://www.flipkart.com" + card.getAttribute("href")
                        : null;

                    const image = extractImage(card);

                    // Original price (optional)
                    let originalPrice = price;
                    try {
                        const allText = card.textContent || '';
                        const priceMatches = allText.match(/₹([\d,]+)/g);
                        if (priceMatches && priceMatches.length >= 2) {
                            originalPrice = parseFloat(priceMatches[1].replace(/₹|,/g, ''));
                        }
                    } catch (e) { }

                    if (title && price && link) {
                        items.push({
                            title,
                            price,
                            originalPrice, // Add extra field for compatibility
                            link,
                            productUrl: link, // Add extra field for compatibility
                            image,
                            source: "Flipkart",
                            availability: true
                        });
                    }
                });

                return items;
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
