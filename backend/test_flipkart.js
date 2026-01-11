const browserManager = require('./utils/BrowserManager');
const FlipkartSearchScraper = require('./scrapers/searchScrapers/flipkartSearch');

const query = 'laptop';

async function testFlipkart() {
    console.log(`\n🔍 Testing FLIPKART - Detailed Analysis`);
    console.log(`${'='.repeat(60)}`);
    
    const scraper = new FlipkartSearchScraper(browserManager);
    const startTime = Date.now();
    
    try {
        console.log(`⏱️  Starting at: ${new Date().toISOString()}`);
        console.log(`🌐 URL: https://www.flipkart.com/search?q=${query}%20electronics`);
        
        // Manually replicate what search() does so we can debug step by step
        const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query + ' electronics')}`;
        console.log(`\n📍 Step 1: Creating page...`);
        const page = await browserManager.newPage();
        console.log(`✅ Page created`);
        
        console.log(`\n📍 Step 2: Setting extra headers...`);
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        });
        console.log(`✅ Headers set`);
        
        console.log(`\n📍 Step 3: Navigating to page (25s timeout, domcontentloaded)...`);
        const navStartTime = Date.now();
        try {
            const response = await page.goto(searchUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 25000
            });
            const navTime = Date.now() - navStartTime;
            console.log(`✅ Navigation completed in ${navTime}ms`);
            console.log(`   Status: ${response ? response.status() : 'unknown'}`);
        } catch (navErr) {
            const navTime = Date.now() - navStartTime;
            console.warn(`⚠️  Navigation timeout after ${navTime}ms: ${navErr.message}`);
            console.log(`   Continuing with partial page...`);
        }
        
        console.log(`\n📍 Step 4: Checking page content...`);
        const pageContent = await page.content();
        console.log(`✅ Page content retrieved: ${pageContent.length} bytes`);
        
        // Check for block indicators
        const indicators = {
            'Cloudflare': pageContent.includes('Cloudflare') || pageContent.includes('cf_clearance'),
            'Access Denied': pageContent.includes('Access Denied'),
            'Bot Check': pageContent.toLowerCase().includes('bot check'),
            'CAPTCHA': pageContent.toLowerCase().includes('captcha'),
            'Unusual Traffic': pageContent.toLowerCase().includes('unusual traffic'),
            '403': pageContent.includes('403'),
            '429': pageContent.includes('429'),
        };
        
        const blockedBy = Object.entries(indicators).filter(([_, found]) => found).map(([name, _]) => name);
        if (blockedBy.length > 0) {
            console.log(`🚫 BLOCK INDICATORS FOUND: ${blockedBy.join(', ')}`);
        } else {
            console.log(`✅ No obvious block indicators`);
        }
        
        console.log(`\n📍 Step 5: Waiting 2-3 seconds for dynamic content...`);
        await new Promise(resolve => setTimeout(resolve, 2500));
        console.log(`✅ Wait complete`);
        
        console.log(`\n📍 Step 6: Checking for product cards...`);
        const hasContent = await page.evaluate(() => {
            // Check if product cards are present
            const selectors = [
                '[data-id]',
                '._1AtVbE',
                '.cPHDOP',
                '._13oc-S',
                '[class*="yKfJKb"]'
            ];
            
            let totalCards = 0;
            const results = {};
            
            for (const selector of selectors) {
                const cards = document.querySelectorAll(selector);
                results[selector] = cards.length;
                totalCards += cards.length;
            }
            
            return { totalCards, results };
        });
        
        console.log(`✅ Product card check results:`);
        console.log(`   Total cards found: ${hasContent.totalCards}`);
        Object.entries(hasContent.results).forEach(([selector, count]) => {
            if (count > 0) console.log(`   - ${selector}: ${count}`);
        });
        
        if (hasContent.totalCards === 0) {
            console.log(`\n🚫 NO PRODUCTS FOUND - Page likely blocked or different structure`);
            
            // Try to extract page text
            const bodyText = await page.evaluate(() => {
                const text = document.body.innerText;
                return text.substring(0, 1000);
            });
            console.log(`\n📝 Page text preview:`);
            console.log(bodyText);
        }
        
        console.log(`\n📍 Step 7: Full evaluation...`);
        const results = await scraper.search(query, { category: 'electronics' });
        console.log(`✅ Search completed`);
        console.log(`📊 Results: ${results.length} products`);
        
        const elapsed = Date.now() - startTime;
        console.log(`\n✅ SUCCESS in ${elapsed}ms\n`);
        
    } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`\n❌ FAILED after ${elapsed}ms`);
        console.error(`Error: ${error.message}`);
        if (error.stack) console.error(`Stack:\n${error.stack}`);
    } finally {
        try {
            await browserManager.closeBrowser();
        } catch (e) {}
    }
    
    process.exit(0);
}

testFlipkart().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
