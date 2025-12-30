const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: String,
  price: Number,
  image: String,
  rating: Number,
  source: String, // Amazon / Flipkart
});

module.exports = mongoose.model("Product", productSchema);
