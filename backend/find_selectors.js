const browserManager = require('./utils/BrowserManager');

async function findCorrectSelectors() {
    console.log(`\n🔍 Finding Correct Flipkart Selectors`);
    console.log(`${'='.repeat(60)}`);
    
    const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent('laptop electronics')}`;
    
    try {
        const page = await browserManager.newPage();
        
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        
        try {
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
        } catch (e) {
            console.log(`Navigation warning: ${e.message}`);
        }
        
        await new Promise(r => setTimeout(r, 3000));
        
        // Get detailed structure of a card
        console.log(`\n📍 Analyzing first product card structure:\n`);
        const cardStructure = await page.evaluate(() => {
            const card = document.querySelector('[data-id]');
            if (!card) return 'NO CARD FOUND';
            
            // Get all children and their classes
            const explore = (el, indent = 0) => {
                if (indent > 5) return '...'; // Limit depth
                const prefix = '  '.repeat(indent);
                const tag = el.tagName.toLowerCase();
                const className = typeof el.className === 'string' ? el.className : '';
                const classes = className ? `.${className.split(' ').join('.')}` : '';
                const text = el.innerText ? el.innerText.substring(0, 30).replace(/\n/g, ' ') : '';
                const attrs = Array.from(el.attributes)
                    .filter(a => a.name !== 'class' && a.name !== 'style')
                    .map(a => `${a.name}="${a.value.substring(0, 20)}"`)
                    .join(' ');
                
                let result = `${prefix}<${tag}${classes}${attrs ? ' ' + attrs : ''}>`;
                if (text && el.children.length === 0) result += ` "${text}"`;
                result += '\n';
                
                // Show important elements
                if (text && (text.includes('₹') || text.includes('off') || el.className.includes('price'))) {
                    result += `${prefix}  💰 PRICE/DISCOUNT: ${text}\n`;
                }
                
                if (el.tagName === 'IMG') {
                    result += `${prefix}  🖼️ IMAGE: ${el.src ? el.src.substring(0, 50) : 'no src'}\n`;
                }
                
                // Check children
                Array.from(el.children).slice(0, 3).forEach(child => {
                    result += explore(child, indent + 1);
                });
                
                return result;
            };
            
            return explore(card);
        });
        
        console.log(cardStructure);
        
        // Try to find all possible selectors for prices
        console.log(`\n\n📍 Searching for Price Selectors:\n`);
        const priceElements = await page.evaluate(() => {
            const results = [];
            
            // Look for elements containing ₹ or price-like patterns
            const allElements = document.querySelectorAll('*');
            for (let el of allElements) {
                const text = el.innerText || el.textContent;
                if (text && text.includes('₹') && text.length < 50) {
                    results.push({
                        tag: el.tagName,
                        className: el.className,
                        text: text.substring(0, 40),
                        selector: el.className ? `.${el.className.split(' ')[0]}` : el.tagName
                    });
                }
            }
            
            return results.slice(0, 10); // First 10
        });
        
        priceElements.forEach((el, i) => {
            console.log(`${i + 1}. <${el.tag} class="${el.className}"> "${el.text}"`);
        });
        
        // Try different selector combinations
        console.log(`\n\n📍 Testing Different Selector Combinations:\n`);
        const selectorTests = await page.evaluate(() => {
            const results = {};
            
            const selectors = [
                '[data-id]',
                '[class*="productContainer"]',
                '[class*="tUxRFH"]',
                'div[class*="_"]',
                '[class*="yKfJKb"]',
                '[class*="RfAFj"]',
                'div[data-id]',
                '[class="RfAFj H8D3vM"]',
                '[class*="s-list"]',
                'div.s-list',
                '[class*="productCardImg"]',
                '[class*="productPrice"]',
                '[class*="discountPercentage"]'
            ];
            
            for (const selector of selectors) {
                const count = document.querySelectorAll(selector).length;
                if (count > 0) {
                    results[selector] = count;
                }
            }
            
            return results;
        });
        
        Object.entries(selectorTests).forEach(([selector, count]) => {
            console.log(`${selector}: ${count} elements`);
        });
        
        // Extract actual product data using text content
        console.log(`\n\n📍 Extracting Products Using Text Mining:\n`);
        const products = await page.evaluate(() => {
            const cards = document.querySelectorAll('[data-id]');
            const prods = [];
            
            for (let card of cards) {
                const text = card.innerText;
                const lines = text.split('\n').filter(l => l.trim());
                
                // Find price pattern: ₹XXXX
                const priceMatch = text.match(/₹([\d,]+)/);
                const originalMatch = text.match(/₹([\d,]+)\s*₹([\d,]+)/);
                const ratingMatch = text.match(/(\d+\.?\d*)\s*\(/);
                
                if (lines.length > 0) {
                    prods.push({
                        id: card.getAttribute('data-id'),
                        title: lines[0],
                        currentPrice: priceMatch ? priceMatch[1] : null,
                        originalPrice: originalMatch ? originalMatch[2] : null,
                        rating: ratingMatch ? ratingMatch[1] : null,
                        fullText: text.substring(0, 150)
                    });
                }
            }
            
            return prods.slice(0, 5);
        });
        
        console.log(JSON.stringify(products, null, 2));
        
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

findCorrectSelectors().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
