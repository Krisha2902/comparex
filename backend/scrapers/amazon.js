const puppeteer = require("puppeteer");

async function scrapeAmazon(searchQuery, category) {
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

    const url = `https://www.amazon.in/s?k=${encodeURIComponent(searchQuery)}`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    await page.waitForTimeout(3000);

    const products = await page.evaluate(() => {
      const items = [];

      document.querySelectorAll(".s-result-item").forEach((el) => {
        const title = el.querySelector("h2 span")?.innerText;
        const price = el.querySelector(".a-price-whole")?.innerText;
        const image = el.querySelector("img")?.src;
        const rating = el.querySelector(".a-icon-alt")?.innerText;

        if (title && price) {
          items.push({
            title,
            price,
            image,
            rating
          });
        }
      });

      return items.slice(0, 5);
    });

    await browser.close();

    // 🔥 PHASE-2: DB FORMAT CONVERSION
    return products.map(p => ({
      title: p.title,
      price: Number(p.price.replace(/,/g, "")),
      image: p.image || "",
      rating: p.rating ? Number(p.rating.split(" ")[0]) : 0,
      source: "Amazon",
      category: category
    }));
  } catch (error) {
    console.error("Amazon scraper error:", error.message);
    if (browser) {
      await browser.close().catch(() => {});
    }
    return []; // Return empty array on error
  }
}

module.exports = scrapeAmazon;
