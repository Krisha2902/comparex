const browserManager = require('./utils/BrowserManager');
const AmazonSearchScraper = require('./scrapers/searchScrapers/amazonSearch');
const FlipkartSearchScraper = require('./scrapers/searchScrapers/flipkartSearch');
const CromaSearchScraper = require('./scrapers/searchScrapers/cromaSearch');
const RelianceSearchScraper = require('./scrapers/searchScrapers/relianceSearch');

const query = 'laptop';

async function debugScraper(ScraperClass, platformName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Testing ${platformName.toUpperCase()} Scraper`);
    console.log(`${'='.repeat(60)}`);
    
    // Browser manager is a singleton instance
    const scraper = new ScraperClass(browserManager);
    
    try {
        console.log(`⏱️  Starting search at: ${new Date().toISOString()}`);
        const startTime = Date.now();
        
        const results = await scraper.search(query, { category: 'electronics' });
        
        const elapsed = Date.now() - startTime;
        console.log(`✅ ${platformName} Success in ${elapsed}ms`);
        console.log(`📊 Found ${results.length} products`);
        
        if (results.length > 0) {
            console.log(`\n📦 Sample result:`);
            console.log(JSON.stringify(results[0], null, 2));
        }
        
    } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`❌ ${platformName} Failed after ${elapsed}ms`);
        console.error(`Error: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
        
        // Try to get page content for analysis
        try {
            const page = await browserManager.newPage();
            const testUrl = platformName === 'Amazon' 
                ? `https://www.amazon.in/s?k=laptop`
                : platformName === 'Flipkart'
                ? `https://www.flipkart.com/search?q=laptop`
                : platformName === 'Croma'
                ? `https://www.croma.com/search/?query=laptop`
                : `https://www.reliancedigital.in/search?query=laptop`;
            
            console.log(`\n🔗 Testing raw page load to: ${testUrl}`);
            try {
                await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
                const content = await page.content();
                
                // Check for CloudFlare
                if (content.includes('Cloudflare') || content.includes('cf_clearance')) {
                    console.log(`⚠️  Cloudflare protection detected`);
                }
                
                // Check page size
                console.log(`📄 Page content size: ${content.length} bytes`);
                
                // Check for common block indicators
                const blockIndicators = [
                    { name: 'Access Denied', found: content.includes('Access Denied') },
                    { name: 'Bot Check', found: content.toLowerCase().includes('bot') },
                    { name: 'CAPTCHA', found: content.toLowerCase().includes('captcha') },
                    { name: 'Unusual Traffic', found: content.toLowerCase().includes('unusual traffic') },
                    { name: 'Too Many Requests', found: content.includes('429') || content.toLowerCase().includes('too many') },
                ];
                
                const found = blockIndicators.filter(b => b.found);
                if (found.length > 0) {
                    console.log(`🚫 Block indicators found:`);
                    found.forEach(b => console.log(`   - ${b.name}`));
                }
                
                // Check what's actually in the page
                const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
                console.log(`\n📝 Page text preview:\n${bodyText}\n`);
                
                await page.close();
            } catch (pageErr) {
                console.error(`Failed to load page: ${pageErr.message}`);
            }
        } catch (e) {
            console.error(`Couldn't analyze page: ${e.message}`);
        }
    } finally {
        // Don't close browser - it will auto cleanup
    }
}

async function runTests() {
    console.log(`Starting scraper debug at ${new Date().toISOString()}\n`);
    
    // Test each scraper sequentially
    await debugScraper(AmazonSearchScraper, 'Amazon');
    await new Promise(r => setTimeout(r, 3000)); // Wait 3s between tests
    
    await debugScraper(FlipkartSearchScraper, 'Flipkart');
    await new Promise(r => setTimeout(r, 3000));
    
    await debugScraper(CromaSearchScraper, 'Croma');
    await new Promise(r => setTimeout(r, 3000));
    
    await debugScraper(RelianceSearchScraper, 'Reliance');
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Tests completed at ${new Date().toISOString()}`);
    console.log(`${'='.repeat(60)}\n`);
    
    process.exit(0);
}

runTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
