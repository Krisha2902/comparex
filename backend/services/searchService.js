const amazon = require("../scrapers/amazon");
const flipkart = require("../scrapers/flipkart");
const croma = require("../scrapers/croma");
const reliance = require("../scrapers/reliance");
const Product = require("../models/product");

async function searchAll(query, category) {
  // Normalize source names - handle variations like "Reliance" vs "Reliance Digital"
  const normalizeSource = (source) => {
    if (source && source.toLowerCase().includes("reliance")) {
      return "Reliance Digital";
    }
    return source;
  };

  // First, quickly get database products as fallback
  let dbProducts = [];
  try {
    const cleanedQuery = query.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
    const searchTerms = cleanedQuery.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    const searchQueries = [
      { title: { $regex: cleanedQuery, $options: "i" } },
      { title: { $regex: query, $options: "i" } }
    ];
    
    if (searchTerms.length > 0) {
      searchQueries.push({
        $and: searchTerms.map(term => ({ title: { $regex: term, $options: "i" } }))
      });
    }
    
    const dbResults = await Product.find({ $or: searchQueries }).limit(50);
    dbProducts = dbResults.map(p => ({
      title: p.title,
      price: p.price,
      image: p.image || "",
      rating: p.rating || 0,
      source: normalizeSource(p.source || "Database"),
      category: p.category || category
    }));
    console.log(`📦 Pre-loaded ${dbProducts.length} products from database`);
  } catch (dbError) {
    console.error("❌ Database pre-load error:", dbError);
  }

  try {
    // Try web scraping - get results from all websites
    const scraperNames = ["Amazon", "Flipkart", "Croma", "Reliance Digital"];
    const scraperFunctions = [amazon, flipkart, croma, reliance];
    
    console.log(`🔍 Starting web scraping for: "${query}"`);
    
    // Add timeout to each scraper (20 seconds max per scraper - faster timeout)
    const scraperWithTimeout = (scraper, name) => {
      return Promise.race([
        scraper(query, category),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout: ${name} took too long`)), 20000)
        )
      ]).catch(err => {
        console.error(`⚠️ ${name} scraper error:`, err.message);
        return []; // Return empty array on error
      });
    };
    
    const results = await Promise.allSettled(
      scraperFunctions.map((scraper, index) => scraperWithTimeout(scraper, scraperNames[index]))
    );

    let scrapedProducts = [];
    const scraperStatus = {};
    
    results.forEach((r, index) => {
      const scraperName = scraperNames[index];
      if (r.status === "fulfilled" && Array.isArray(r.value) && r.value.length > 0) {
        scrapedProducts = scrapedProducts.concat(r.value);
        scraperStatus[scraperName] = { success: true, count: r.value.length };
        console.log(`✅ ${scraperName}: Found ${r.value.length} products`);
      } else if (r.status === "fulfilled" && Array.isArray(r.value) && r.value.length === 0) {
        scraperStatus[scraperName] = { success: true, count: 0 };
        console.log(`⚠️ ${scraperName}: No products found`);
      } else if (r.status === "rejected") {
        scraperStatus[scraperName] = { success: false, error: r.reason?.message || "Unknown error" };
        console.error(`❌ ${scraperName} failed:`, r.reason?.message || r.reason);
      }
    });

    // Filter out invalid products (missing price or title)
    scrapedProducts = scrapedProducts.filter(p => p && p.title && p.price && !isNaN(p.price));

    console.log(`📊 Total scraped products: ${scrapedProducts.length}`);

    // Use pre-loaded database products (already loaded at start)
    // Group by source to see what we have
    const dbBySource = {};
    dbProducts.forEach(p => {
      const normalized = normalizeSource(p.source);
      if (!dbBySource[normalized]) {
        dbBySource[normalized] = [];
      }
      dbBySource[normalized].push({ ...p, source: normalized });
    });
    
    console.log(`📦 Database products by source:`);
    Object.keys(dbBySource).forEach(source => {
      console.log(`   - ${source}: ${dbBySource[source].length} products`);
    });

    // Combine scraped and database products
    // ALWAYS show products from all 4 sources (Amazon, Flipkart, Croma, Reliance Digital)
    const requiredSources = ["Amazon", "Flipkart", "Croma", "Reliance Digital"];
    
    // Normalize scraped product sources (normalizeSource already defined above)
    scrapedProducts = scrapedProducts.map(p => ({
      ...p,
      source: normalizeSource(p.source)
    }));
    
    // Normalize database product sources
    dbProducts = dbProducts.map(p => ({
      ...p,
      source: normalizeSource(p.source)
    }));
    
    const scrapedSources = new Set(scrapedProducts.map(p => p.source));
    const missingSources = requiredSources.filter(source => !scrapedSources.has(source));
    
    console.log(`📋 Scraped sources: ${Array.from(scrapedSources).join(", ")}`);
    console.log(`📋 Missing sources: ${missingSources.join(", ")}`);
    
    // Start with scraped products (these are real-time and prioritized)
    let allProducts = [...scrapedProducts];
    
    // For each missing source, add database products
    missingSources.forEach(source => {
      const dbProductsForSource = dbProducts.filter(p => 
        normalizeSource(p.source) === source &&
        !allProducts.some(sp => 
          normalizeSource(sp.source) === source && 
          sp.title.toLowerCase().includes(p.title.toLowerCase().substring(0, 30))
        )
      );
      
      if (dbProductsForSource.length > 0) {
        // Take the first matching product for this source
        allProducts.push(dbProductsForSource[0]);
        console.log(`➕ Added database product for ${source}: ${dbProductsForSource[0].title.substring(0, 50)}`);
      }
    });
    
    // If no scraped products at all, ensure we show database products from all sources
    if (scrapedProducts.length === 0 && dbProducts.length > 0) {
      console.log(`🔄 No scraped results, showing database products from all sources`);
      // Group by normalized source and take one from each required source
      const productsBySource = {};
      dbProducts.forEach(p => {
        const normalized = normalizeSource(p.source);
        if (requiredSources.includes(normalized) && !productsBySource[normalized]) {
          productsBySource[normalized] = { ...p, source: normalized };
        }
      });
      
      // Ensure we have at least one product from each required source
      requiredSources.forEach(source => {
        if (!productsBySource[source]) {
          // Find any product that matches this source (even if name is slightly different)
          const matchingProduct = dbProducts.find(p => 
            normalizeSource(p.source) === source
          );
          if (matchingProduct) {
            productsBySource[source] = { ...matchingProduct, source };
          }
        }
      });
      
      allProducts = Object.values(productsBySource);
      console.log(`📦 Showing ${allProducts.length} products from database (${Object.keys(productsBySource).join(", ")})`);
    }
    
    console.log(`📊 Combined products: ${allProducts.length} total`);

    // Remove duplicates (same source + similar title)
    const uniqueProducts = [];
    const seen = new Set();
    
    allProducts.forEach(product => {
      const key = `${product.source}-${product.title.toLowerCase().substring(0, 50)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueProducts.push(product);
      }
    });

    // Sort by price (lowest first)
    const sortedProducts = uniqueProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    
    // Log final result by source
    const finalBySource = {};
    sortedProducts.forEach(p => {
      if (!finalBySource[p.source]) {
        finalBySource[p.source] = [];
      }
      finalBySource[p.source].push(p);
    });
    
    console.log(`✨ Final result: ${sortedProducts.length} unique products from ${Object.keys(finalBySource).length} sources:`);
    Object.keys(finalBySource).forEach(source => {
      console.log(`   📍 ${source}: ${finalBySource[source].length} product(s)`);
      finalBySource[source].forEach(p => {
        console.log(`      - ${p.title.substring(0, 60)} - ₹${p.price}`);
      });
    });
    
    return sortedProducts;
  } catch (error) {
    console.error("Search service error:", error);
    
    // Even if there's an error, try database fallback
    try {
      const cleanedQuery = query
        .replace(/[()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      
      const searchTerms = cleanedQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(term => term.length > 2 && !/^(gb|tb|ram|rom)$/i.test(term));
      
      const searchQueries = [
        { title: { $regex: cleanedQuery, $options: "i" } },
        { title: { $regex: query, $options: "i" } }
      ];
      
      if (searchTerms.length > 0) {
        searchQueries.push({
          $and: searchTerms.map(term => ({
            title: { $regex: term, $options: "i" }
          }))
        });
      }
      
      const dbProducts = await Product.find({
        $or: searchQueries
      }).limit(20);
      
      const formattedProducts = dbProducts.map(p => ({
        title: p.title,
        price: p.price,
        image: p.image || "",
        rating: p.rating || 0,
        source: p.source || "Database",
        category: p.category || category
      }));
      
      console.log(`🔄 Error fallback: Returning ${formattedProducts.length} products from database`);
      return formattedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    } catch (dbError) {
      console.error("Database fallback error:", dbError);
      return []; // Return empty array if everything fails
    }
  }
}

module.exports = searchAll;
