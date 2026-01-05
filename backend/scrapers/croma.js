const puppeteer = require("puppeteer");

async function scrapeCroma(query, category) {
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    await page.goto(
      `https://www.croma.com/searchB?q=${encodeURIComponent(query)}`,
      { waitUntil: "networkidle2", timeout: 30000 }
    );

    await page.waitForTimeout(4000);

    const products = await page.evaluate(() => {
      const items = [];

      document.querySelectorAll(".product-item").forEach(el => {
        const title = el.querySelector(".product-title")?.innerText;
        const price = el.querySelector(".amount")?.innerText;
        const image = el.querySelector("img")?.src;

        if (title && price) {
          items.push({ title, price, image });
        }
      });

      return items.slice(0, 5);
    });

    await browser.close();

    return products.map(p => ({
      title: p.title,
      price: Number(p.price.replace(/[₹,]/g, "")),
      image: p.image || "",
      rating: 0,
      source: "Croma",
      category
    }));
  } catch (error) {
    console.error("Croma scraper error:", error.message);
    if (browser) {
      await browser.close().catch(() => {});
    }
    return []; // Return empty array on error
  }
}

module.exports = scrapeCroma;
