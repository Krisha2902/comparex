const browserManager = require('../utils/browser');
const AmazonScraper = require('../scrapers/amazon');
const FlipkartScraper = require('../scrapers/flipkart');
const CromaScraper = require('../scrapers/croma');

const getScraper = (platform, browserManager) => {
    switch (platform) {
        case 'amazon': return new AmazonScraper(browserManager);
        case 'flipkart': return new FlipkartScraper(browserManager);
        case 'croma': return new CromaScraper(browserManager);
        default: throw new Error(`Platform ${platform} not supported`);
    }
};

const scrapeProduct = async (req, res) => {
    try {
        const { platform, productUrl } = req.body;

        if (!platform || !productUrl) {
            return res.status(400).json({ error: 'Missing platform or productUrl' });
        }

        const scraper = getScraper(platform, browserManager);
        const data = await scraper.scrape(productUrl);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Scrape error:', error);
        res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

module.exports = { scrapeProduct };
