const browserManager = require('../utils/browser');
const AmazonSearchScraper = require('../scrapers/searchScrapers/amazonSearch');
const FlipkartSearchScraper = require('../scrapers/searchScrapers/flipkartSearch');
const CromaSearchScraper = require('../scrapers/searchScrapers/cromaSearch');

const searchProducts = async (req, res) => {
    try {
        const { query, resultsPerPlatform = 2 } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Missing query parameter' });
        }

        console.log(`Searching for "${query}" across all platforms...`);

        // Create scrapers for all platforms
        const scrapers = [
            { platform: 'amazon', scraper: new AmazonSearchScraper(browserManager) },
            { platform: 'flipkart', scraper: new FlipkartSearchScraper(browserManager) },
            { platform: 'croma', scraper: new CromaSearchScraper(browserManager) }
        ];

        // Search all platforms in parallel
        const searchPromises = scrapers.map(async ({ platform, scraper }) => {
            try {
                console.log(`Searching ${platform}...`);
                const results = await scraper.search(query);
                return { platform, results, success: true };
            } catch (error) {
                console.error(`${platform} search failed:`, error.message);
                return { platform, results: [], success: false, error: error.message };
            }
        });

        const platformResults = await Promise.all(searchPromises);

        // Combine results from each platform (just take top N as-is)
        let combinedResults = [];

        platformResults.forEach(({ platform, results, success, error }) => {
            if (!success) {
                console.warn(`${platform} failed: ${error}`);
                return;
            }

            // Take top N results from this platform (no filtering, no sorting)
            const topResults = results.slice(0, resultsPerPlatform);

            // Add platform identifier to each result
            topResults.forEach(result => {
                result.platform = platform;
            });

            combinedResults = combinedResults.concat(topResults);
        });

        res.json({
            success: true,
            data: {
                query,
                totalResults: combinedResults.length,
                resultsPerPlatform,
                results: combinedResults
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

module.exports = { searchProducts };
