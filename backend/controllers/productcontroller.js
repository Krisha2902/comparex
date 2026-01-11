const Product = require("../models/product");

// GET products (search)
exports.getProducts = async (req, res) => {
  const search = req.query.search || "";

  try {
    const products = await Product.find({
      title: { $regex: search, $options: "i" },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ADD product
exports.addProduct = async (req, res) => {
  try {
    const { title, price, image, rating, source, category } = req.body;

    // Validate required fields
    if (!title || price === undefined || price === null) {
      return res.status(400).json({ 
        message: "Title and Price are required fields" 
      });
    }

    // Validate category if provided
    if (category && category.trim()) {
      // Category is optional but if provided, should be valid
    }

    // Ensure price is a number
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ 
        message: "Price must be a valid positive number" 
      });
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        return res.status(400).json({ 
          message: "Rating must be between 0 and 5" 
        });
      }
    }

    const productData = {
      title: title.trim(),
      price: priceNum,
      image: image ? image.trim() : "",
      rating: rating ? parseFloat(rating) : null,
      source: source ? source.trim() : "",
      category: category ? category.trim() : "Uncategorized",
    };

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ 
      message: error.message || "Error adding product",
      error: error.message 
    });
  }
};

// GET products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    
    // Map slug to category name (case-insensitive matching)
    const categoryMap = {
      "electronics": "Electronics",
      "fashion": "Fashion",
      "kitchen": "Kitchen",
      "home": "Home",
      "vehicle": "Vehicle",
      "sports": "Sports",
      "toys-games": "Toys & Games",
      "books": "Books",
      "automotive": "Automotive"
    };

    // Get category name from slug, or use slug itself if not found
    const categoryName = categoryMap[categorySlug.toLowerCase()] || categorySlug;
    
    // Search for products matching category (case-insensitive)
    const products = await Product.find({
      category: { $regex: new RegExp(`^${categoryName}$`, "i") }
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product" });
  }
};

