const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AmazonSearchScraper = require('./scrapers/searchScrapers/amazonSearch');
const FlipkartSearchScraper = require('./scrapers/searchScrapers/flipkartSearch');
const CromaSearchScraper = require('./scrapers/searchScrapers/cromaSearch');
const RelianceSearchScraper = require('./scrapers/searchScrapers/relianceSearch');
const browserManager = require('./utils/BrowserManager');

dotenv.config();

async function testScrapers() {
    console.log('Starting Scraper Test...');
    try {
        await browserManager.init();

        const query = 'iPhone 15';
        console.log(`Searching for: ${query}`);

        // Test Amazon
        console.log('\n--- Testing Amazon ---');
        try {
            const amazonScraper = new AmazonSearchScraper(browserManager);
            const amazonResults = await amazonScraper.search(query);
            console.log(`Amazon Results: ${amazonResults.length}`);
            if (amazonResults.length > 0) console.log('Sample:', amazonResults[0]);
        } catch (e) { console.error('Amazon Failed:', e.message); }

        // Test Flipkart
        console.log('\n--- Testing Flipkart ---');
        try {
            const flipkartScraper = new FlipkartSearchScraper(browserManager);
            const flipkartResults = await flipkartScraper.search(query);
            console.log(`Flipkart Results: ${flipkartResults.length}`);
            if (flipkartResults.length > 0) console.log('Sample:', flipkartResults[0]);
        } catch (e) { console.error('Flipkart Failed:', e.message); }

        // Test Croma
        console.log('\n--- Testing Croma ---');
        try {
            const cromaScraper = new CromaSearchScraper(browserManager);
            const cromaResults = await cromaScraper.search(query);
            console.log(`Croma Results: ${cromaResults.length}`);
            if (cromaResults.length > 0) console.log('Sample:', cromaResults[0]);
        } catch (e) { console.error('Croma Failed:', e.message); }

        // Test Reliance
        console.log('\n--- Testing Reliance ---');
        try {
            const relianceScraper = new RelianceSearchScraper(browserManager);
            const relianceResults = await relianceScraper.search(query);
            console.log(`Reliance Results: ${relianceResults.length}`);
            if (relianceResults.length > 0) console.log('Sample:', relianceResults[0]);
        } catch (e) { console.error('Reliance Failed:', e.message); }

    } catch (error) {
        console.error('Test Process Failed:', error);
    } finally {
        await browserManager.close();
        process.exit();
    }
}

testScrapers();
