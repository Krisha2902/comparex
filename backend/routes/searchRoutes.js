const express = require("express");
const router = express.Router();
const searchAll = require("../services/searchService");

// Search products across all scrapers
router.get("/", async (req, res) => {
  try {
    const { q: query, category = "electronics" } = req.query;

    console.log(`\n🔍 ===== SEARCH REQUEST =====`);
    console.log(`Query: "${query}"`);
    console.log(`Category: "${category}"`);

    if (!query || !query.trim()) {
      console.log(`❌ Empty query received`);
      return res.status(400).json({ 
        message: "Search query is required" 
      });
    }

    console.log(`🚀 Starting search for: "${query.trim()}"`);
    const startTime = Date.now();
    
    // Search across all scrapers (Amazon, Flipkart, Croma, Reliance)
    // Add timeout wrapper to prevent hanging
    let products;
    try {
      products = await Promise.race([
        searchAll(query.trim(), category),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Search timeout after 80 seconds')), 80000)
        )
      ]);
    } catch (timeoutError) {
      console.error(`⏱️ Search timed out:`, timeoutError.message);
      // Return database products as fallback
      const Product = require("../models/product");
      const dbProducts = await Product.find({
        title: { $regex: query.trim(), $options: "i" }
      }).limit(20);
      
      products = dbProducts.map(p => ({
        title: p.title,
        price: p.price,
        image: p.image || "",
        rating: p.rating || 0,
        source: p.source || "Database",
        category: p.category || category
      }));
      
      console.log(`🔄 Returning ${products.length} database products due to timeout`);
    }

    const duration = Date.now() - startTime;
    console.log(`⏱️ Search completed in ${duration}ms`);

    // Always return an array, even if empty
    if (!Array.isArray(products)) {
      console.error(`❌ searchAll returned non-array:`, typeof products, products);
      return res.json([]);
    }

    console.log(`📊 Returning ${products.length} products`);
    
    // Sort by price (lowest first) - already sorted in searchAll, but ensure it
    const sortedProducts = products.sort((a, b) => (a.price || 0) - (b.price || 0));

    // Log products by source
    const bySource = {};
    sortedProducts.forEach(p => {
      if (!bySource[p.source]) bySource[p.source] = 0;
      bySource[p.source]++;
    });
    console.log(`📦 Products by source:`, bySource);
    console.log(`✅ ===== SEARCH COMPLETE =====\n`);

    // Return products array
    res.json(sortedProducts);
  } catch (error) {
    console.error("\n❌ ===== SEARCH ERROR =====");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    console.error(`❌ ===== END ERROR =====\n`);
    
    // Try to return database products as fallback even on error
    try {
      const Product = require("../models/product");
      const dbProducts = await Product.find({
        title: { $regex: req.query.q || "", $options: "i" }
      }).limit(10);
      
      if (dbProducts.length > 0) {
        console.log(`🔄 Returning ${dbProducts.length} database products as fallback`);
        return res.json(dbProducts.map(p => ({
          title: p.title,
          price: p.price,
          image: p.image || "",
          rating: p.rating || 0,
          source: p.source || "Database",
          category: p.category || "electronics"
        })));
      }
    } catch (dbError) {
      console.error("Database fallback also failed:", dbError);
    }
    
    res.status(500).json({ 
      message: "Error searching products",
      error: error.message 
    });
  }
});

module.exports = router;

