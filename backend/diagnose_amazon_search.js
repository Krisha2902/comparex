const { chromium } = require('playwright');

async function diagnoseAmazonSearch() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 }
    });
    
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
    });
    
    const page = await context.newPage();
    
    console.log('Loading Amazon search page...');
    await page.goto('https://www.amazon.in/s?k=iphone+15', {
        waitUntil: 'load',
        timeout: 60000
    });
    
    await page.waitForTimeout(4000);
    
    console.log('\n=== TAKING SCREENSHOT ===');
    await page.screenshot({ path: './screenshots/amazon_search_diagnostic.png', fullPage: true });
    
    console.log('\n=== ANALYZING SEARCH RESULTS ===');
    
    const analysis = await page.evaluate(() => {
        // Find elements with common search result attributes
        const resultsWithDataId = document.querySelectorAll('[data-component-type="s-search-result"]');
        const resultsWithClass = document.querySelectorAll('.s-result-item[data-asin]');
        const anyDivWithAsin = document.querySelectorAll('div[data-asin]');
        
        const firstProduct = resultsWithDataId[0] || resultsWithClass[0] || anyDivWithAsin[0];
        
        let productDetails = null;
        if (firstProduct) {
            const h2 = firstProduct.querySelector('h2');
            const allLinks = firstProduct.querySelectorAll('a');
            const allSpans = firstProduct.querySelectorAll('span');
            
            productDetails = {
                hasH2: !!h2,
                h2Text: h2 ? h2.innerText.substring(0, 100) : null,
                linkCount: allLinks.length,
                firstLinkHref: allLinks[0] ? allLinks[0].href.substring(0, 100) : null,
                spanCount: allSpans.length
            };
        }
        
        return {
            resultsWithDataId: resultsWithDataId.length,
            resultsWithClass: resultsWithClass.length,
            anyDivWithAsin: anyDivWithAsin.length,
            firstProductDetails: productDetails
        };
    });
    
    console.log(JSON.stringify(analysis, null, 2));
    
    console.log('\n\nKeep browser open for 30 seconds to inspect...');
    await page.waitForTimeout(30000);
    
    await context.close();
    await browser.close();
}

diagnoseAmazonSearch().catch(console.error);
