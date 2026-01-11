const path = require('path');
const fs = require('fs');

class BaseSearchScraper {
    constructor(browserManager) {
        this.browserManager = browserManager;
        this.platform = 'generic';
    }

    async search(query, options = {}) {
        throw new Error('Search method must be implemented by subclass');
    }

    async getPage(url) {
        console.log(`[${this.platform}] Navigating to: ${url}`);
        const page = await this.browserManager.newPage();

        try {
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 40000
            });
            console.log(`[${this.platform}] Page loaded successfully`);
        } catch (err) {
            console.warn(`[${this.platform}] Navigation warning: ${err.message}`);
            // Continue anyway - page might be partially loaded
        }

        // Replace deprecated waitForTimeout with Promise-based delay
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

        return page;
    }

    async takeScreenshot(page, filename) {
        try {
            const screenshotDir = path.join(__dirname, '../../../screenshots');
            // Ensure screenshots directory exists
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
            const screenshotPath = path.join(screenshotDir, filename);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Screenshot saved: ${screenshotPath}`);
        } catch (error) {
            console.error('Screenshot error:', error);
        }
    }

    async closePage(page) {
        if (page) {
            try {
                if (!page.isClosed()) {
                    await page.close();
                }
            } catch (error) {
                console.warn('Error closing page (ignored):', error.message);
            }
        }
    }

    buildSearchUrl(query, category) {
        throw new Error('buildSearchUrl must be implemented by subclass');
    }
}

module.exports = BaseSearchScraper;
