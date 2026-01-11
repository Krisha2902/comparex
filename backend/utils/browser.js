const path = require('path');

class BaseSearchScraper {
    constructor(browserManager) {
        this.browserManager = browserManager;
        this.platform = 'generic';
    }

    async search(query, options = {}) {
        throw new Error('Search method must be implemented by subclass');
    }

    async getPage(url) {
        const page = await this.browserManager.newPage();
        
        await page.goto(url, { 
            waitUntil: 'load', 
            timeout: 60000 
        });
        
        await page.waitForTimeout(2000 + Math.random() * 2000);
        
        return page;
    }

    async takeScreenshot(page, filename) {
        try {
            const screenshotPath = path.join(__dirname, '../../../screenshots', filename);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Screenshot saved: ${screenshotPath}`);
        } catch (error) {
            console.error('Screenshot error:', error);
        }
    }

    async closePage(page) {
        if (page) {
            try {
                const context = page.context();
                await page.close();
                await context.close();
            } catch (error) {
                console.error('Error closing page/context:', error.message);
            }
        }
    }

    buildSearchUrl(query) {
        throw new Error('buildSearchUrl must be implemented by subclass');
    }
}

module.exports = BaseSearchScraper;
