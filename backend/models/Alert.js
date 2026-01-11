const mongoose = require("mongoose");

const priceAlertSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    trim: true
  },
  userPhone: {
    type: String,
    required: true,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productUrl: {
    type: String,
    trim: true
  },
  stores: {
    type: [String],
    default: []
  },
  targetPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    min: 0
  },
  isTriggered: {
    type: Boolean,
    default: false
  },
  triggeredAt: {
    type: Date
  },
  lastCheckedPrice: {
    type: Number,
    min: 0
  },
  priceHistory: [{
    price: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Alert", priceAlertSchema);
