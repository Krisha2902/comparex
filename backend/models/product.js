const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  source: { type: String, default: "" }, // Amazon / Flipkart
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
