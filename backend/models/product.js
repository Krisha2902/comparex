const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true }, // Current selling price
  originalPrice: { type: Number, default: null }, // MRP / Price before discount
  image: { type: String, default: "" },
  rating: { type: Number, default: null, min: 0, max: 5 },
  source: { type: String, default: "" }, // Amazon / Flipkart / Croma / Reliance
  productUrl: { type: String, default: null }, // Direct link to product on store
  category: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);

