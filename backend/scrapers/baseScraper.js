const scraperConfig = require('../config/scraperConfig');
const path = require('path');
const fs = require('fs');

class BaseScraper {
    constructor(browserManager) {
        this.browserManager = browserManager;
        this.platform = 'generic';
    }

    async scrape(url, options = {}) {
        throw new Error('Scrape method must be implemented by subclass');
    }

    async getPage(url) {
        const page = await this.browserManager.newPage();

        // Navigate and wait for page load (not networkidle, as e-commerce sites have persistent tracking)
        try {
            await page.goto(url, {
                waitUntil: 'load',
                timeout: scraperConfig.timeouts.pageLoad
            });
        } catch (err) {
            console.warn(`Warning: Navigation to ${url} timed out or failed, continuing anyway...`, err.message);
            // Continue anyway - page might be partially loaded
        }

        // Replace deprecated waitForTimeout with Promise-based delay
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

        return page;
    }

    async takeScreenshot(page, filename) {
        try {
            const screenshotDir = path.join(__dirname, '../../screenshots');
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
                await page.close();
            } catch (error) {
                console.error('Error closing page:', error.message);
            }
        }
    }
}

module.exports = BaseScraper;
