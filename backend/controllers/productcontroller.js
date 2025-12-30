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
    const product = await Product.create(req.body);
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error adding product" });
  }
};

