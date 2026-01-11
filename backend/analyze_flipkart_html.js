const browserManager = require('./utils/BrowserManager');

async function checkFlipkartCardData() {
    console.log(`\n🔍 Analyzing Flipkart Card Data`);
    console.log(`${'='.repeat(60)}`);
    
    const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent('laptop electronics')}`;
    
    try {
        const page = await browserManager.newPage();
        
        // Set headers
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        
        // Navigate
        try {
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
        } catch (e) {
            console.log(`Navigation warning: ${e.message}`);
        }
        
        // Wait for dynamic content
        await new Promise(r => setTimeout(r, 3000));
        
        // Check HTML content
        console.log(`\n📍 Checking page HTML for error indicators:`);
        const pageHTML = await page.content();
        
        const errors = [
            { text: '403', found: pageHTML.includes('403') },
            { text: '429', found: pageHTML.includes('429') },
            { text: 'Access Denied', found: pageHTML.includes('Access Denied') },
            { text: 'CAPTCHA', found: pageHTML.toLowerCase().includes('captcha') },
            { text: 'CloudFlare', found: pageHTML.includes('Cloudflare') },
            { text: 'bot', found: pageHTML.toLowerCase().includes('bot') && !pageHTML.toLowerCase().includes('robot') },
        ];
        
        errors.forEach(e => {
            if (e.found) console.log(`   ❌ ${e.text}: FOUND`);
        });
        
        // Check actual card content
        console.log(`\n📍 Checking actual product card data:`);
        const cardData = await page.evaluate(() => {
            const cards = document.querySelectorAll('[data-id]');
            console.log(`Found ${cards.length} cards with [data-id]`);
            
            const samples = [];
            for (let i = 0; i < Math.min(3, cards.length); i++) {
                const card = cards[i];
                samples.push({
                    dataId: card.getAttribute('data-id'),
                    className: card.className,
                    innerHTML: card.innerHTML.substring(0, 200),
                    textContent: card.innerText.substring(0, 150),
                    hasPrice: !!card.querySelector('[class*="price"], .a-price, [class*="_30jeq3"]'),
                    hasTitle: !!card.querySelector('h2, .title, [class*="s-line-clamp"]'),
                    hasImage: !!card.querySelector('img'),
                });
            }
            return samples;
        });
        
        console.log(`\n📦 Sample card data (first 3):`);
        cardData.forEach((card, i) => {
            console.log(`\n   Card ${i + 1}:`);
            console.log(`   - data-id: ${card.dataId}`);
            console.log(`   - Has Price: ${card.hasPrice}`);
            console.log(`   - Has Title: ${card.hasTitle}`);
            console.log(`   - Has Image: ${card.hasImage}`);
            console.log(`   - Text preview: ${card.textContent.replace(/\n/g, ' ').substring(0, 100)}`);
        });
        
        // Check for error page patterns
        console.log(`\n📍 Checking for error page structure:`);
        const errorPatterns = await page.evaluate(() => {
            const text = document.body.innerText.toLowerCase();
            return {
                hasErrorText: text.includes('error') || text.includes('denied') || text.includes('captcha'),
                hasProductText: text.includes('product') && (text.includes('₹') || text.includes('price')),
                bodyLength: document.body.innerText.length,
                scriptTags: document.querySelectorAll('script').length,
            };
        });
        
        console.log(`   Error text found: ${errorPatterns.hasErrorText}`);
        console.log(`   Product text found: ${errorPatterns.hasProductText}`);
        console.log(`   Body text length: ${errorPatterns.bodyLength} chars`);
        console.log(`   Scripts: ${errorPatterns.scriptTags}`);
        
        // Get HTML snippet
        console.log(`\n📍 HTML Content Preview (first 2000 chars):`);
        console.log(pageHTML.substring(0, 2000));
        
        console.log(`\n📍 HTML Content Around Error (searching for 403/429):`);
        const error403Index = pageHTML.indexOf('403');
        const error429Index = pageHTML.indexOf('429');
        const errorIndex = error403Index > -1 ? error403Index : error429Index;
        
        if (errorIndex > -1) {
            console.log(pageHTML.substring(Math.max(0, errorIndex - 500), errorIndex + 500));
        }
        
        await page.close();
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    } finally {
        try {
            await browserManager.closeBrowser();
        } catch (e) {}
    }
    
    process.exit(0);
}

checkFlipkartCardData().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
