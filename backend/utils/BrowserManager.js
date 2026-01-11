const puppeteer = require('puppeteer');
const proxyManager = require('./proxyManager');

class BrowserManager {
    constructor() {
        this.browser = null;
        this.pageCreationQueue = [];
        this.isCreatingPage = false;
        this.currentProxy = null;
    }

    async init(proxyUrl = null, retryAttempt = 0) {
        // Use provided proxy or get next proxy from proxy manager
        const proxy = proxyUrl || (proxyManager.hasProxies() ? proxyManager.getNextProxy() : null);
        
        // If proxy changed or browser disconnected, recreate browser
        const shouldRecreate = !this.browser || 
                              !this.browser.isConnected() || 
                              (proxy && this.currentProxy !== proxy);

        if (shouldRecreate) {
            // Close existing browser if it exists
            if (this.browser) {
                try {
                    await this.browser.close();
                } catch (err) {
                    // Ignore errors when closing
                }
            }

            console.log(`Initializing browser${proxy ? ` with proxy: ${proxy.substring(0, 30)}...` : ' without proxy'}... (attempt ${retryAttempt + 1}/3)`);
            
            try {
                const launchArgs = [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-blink-features=AutomationControlled'
                ];

                // Add proxy if available
                if (proxy) {
                    try {
                        const url = new URL(proxy);
                        launchArgs.push(`--proxy-server=${url.protocol}//${url.host}`);
                        this.currentProxy = proxy;
                        console.log(`✅ Using proxy: ${url.host}`);
                    } catch (err) {
                        console.warn(`⚠️ Invalid proxy URL, continuing without proxy: ${err.message}`);
                        this.currentProxy = null;
                    }
                } else {
                    this.currentProxy = null;
                }

                this.browser = await puppeteer.launch({
                    headless: "new",
                    args: launchArgs
                });

                // Set proxy authentication if needed
                if (proxy) {
                    try {
                        const url = new URL(proxy);
                        if (url.username && url.password) {
                            // Note: Puppeteer doesn't support proxy auth in launch args
                            // Would need to use page.authenticate() or a proxy extension
                            // For now, we'll log a warning
                            console.warn('⚠️ Proxy authentication detected but not yet implemented. Proxy may not work.');
                        }
                    } catch (err) {
                        // Ignore URL parsing errors
                    }
                }

                console.log('✅ Browser initialized successfully');
            } catch (err) {
                console.error(`❌ Failed to initialize browser (attempt ${retryAttempt + 1}/3): ${err.message}`);
                if (proxy) {
                    proxyManager.markProxyFailed(proxy);
                }
                
                // Exponential backoff retry logic
                const maxRetries = 3;
                if (retryAttempt < maxRetries - 1) {
                    const delayMs = Math.pow(2, retryAttempt) * 1000; // 1s, 2s, 4s
                    console.log(`⏳ Retrying browser initialization in ${delayMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    
                    // Try with next proxy on retry
                    const nextProxy = proxyManager.hasProxies() ? proxyManager.getNextProxy() : null;
                    return this.init(nextProxy, retryAttempt + 1);
                } else {
                    console.error('❌ Browser initialization failed after 3 attempts');
                    throw new Error(`Browser initialization failed after ${maxRetries} attempts: ${err.message}`);
                }
            }
        }
        return this.browser;
    }

    /**
     * Rotate to next proxy and reinitialize browser
     */
    async rotateProxy() {
        if (proxyManager.hasProxies()) {
            const newProxy = proxyManager.getNextProxy();
            if (newProxy !== this.currentProxy) {
                console.log('🔄 Rotating proxy...');
                await this.init(newProxy);
            }
        }
    }

    async newPage(url = null, retryAttempt = 0) {
        // Queue page creation to avoid concurrent connection issues
        return new Promise(async (resolve, reject) => {
            const task = async () => {
                try {
                    // Ensure browser is initialized - with retry logic
                    if (!this.browser || !this.browser.isConnected()) {
                        console.log('Browser disconnected, reinitializing...');
                        try {
                            await this.init();
                        } catch (err) {
                            console.error('Failed to reinitialize browser:', err.message);
                            throw err;
                        }
                    }

                    const page = await this.browser.newPage();
                    console.log('✅ Page created');

                    // Stealth mode - hide automation indicators
                    await page.evaluateOnNewDocument(() => {
                        Object.defineProperty(navigator, 'webdriver', {
                            get: () => false,
                        });
                        Object.defineProperty(navigator, 'plugins', {
                            get: () => [1, 2, 3, 4, 5],
                        });
                        Object.defineProperty(navigator, 'languages', {
                            get: () => ['en-US', 'en'],
                        });
                        window.chrome = {
                            runtime: {}
                        };
                        Object.defineProperty(navigator, 'permissions', {
                            get: () => ({
                                query: () => Promise.resolve({ state: Notification.permission })
                            }),
                        });
                    });

                    // Optimize page loading
                    await page.setRequestInterception(true);
                    page.on('request', (req) => {
                        const resourceType = req.resourceType();
                        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                            req.abort().catch(() => {});
                        } else {
                            req.continue().catch(() => {});
                        }
                    });

                    page.on('error', (err) => {
                        console.error('Page error:', err.message);
                    });

                    // Set user agent to avoid detection
                    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

                    // Set viewport
                    await page.setViewport({ width: 1920, height: 1080 });

                    if (url) {
                        try {
                            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                        } catch (err) {
                            console.warn(`Warning navigating to ${url}: ${err.message}`);
                        }
                    }

                    resolve(page);
                } catch (err) {
                    console.error(`Error creating page (attempt ${retryAttempt + 1}/2): ${err.message}`);
                    
                    // Retry page creation once with exponential backoff
                    const maxRetries = 2;
                    if (retryAttempt < maxRetries - 1) {
                        const delayMs = Math.pow(2, retryAttempt) * 500; // 500ms, 1s
                        console.log(`⏳ Retrying page creation in ${delayMs}ms...`);
                        
                        this.isCreatingPage = false;
                        // Process next task in queue
                        if (this.pageCreationQueue.length > 0) {
                            const nextTask = this.pageCreationQueue.shift();
                            nextTask();
                        }
                        
                        // Retry after delay
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                        this.newPage(url, retryAttempt + 1).then(resolve).catch(reject);
                    } else {
                        this.isCreatingPage = false;
                        // Process next task in queue
                        if (this.pageCreationQueue.length > 0) {
                            const nextTask = this.pageCreationQueue.shift();
                            nextTask();
                        }
                        reject(err);
                    }
                }
            };

            // If already creating a page, queue this task
            if (this.isCreatingPage) {
                this.pageCreationQueue.push(task);
            } else {
                this.isCreatingPage = true;
                task();
            }
        });
    }

    async close() {
        if (this.browser) {
            try {
                await this.browser.close();
                this.browser = null;
                console.log('Browser closed');
            } catch (err) {
                console.error('Error closing browser:', err.message);
            }
        }
    }
}

module.exports = new BrowserManager();
