const Alert = require("../models/Alert");

exports.setPriceAlert = async (req, res) => {
  try {
    const {
      userEmail,
      userPhone,
      productName,
      productUrl,
      store,
      targetPrice
    } = req.body;

    // Validation
    if (!userEmail || !userEmail.trim()) {
      return res.status(400).json({
        success: false,
        message: "User email is required"
      });
    }

    if (!productName || !productName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required"
      });
    }

    if (!targetPrice || typeof targetPrice !== 'number' || targetPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid target price (positive number) is required"
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // If productUrl is provided, validate it's a valid URL
    if (productUrl && productUrl.trim()) {
      try {
        new URL(productUrl.trim());
      } catch (urlError) {
        return res.status(400).json({
          success: false,
          message: "Invalid product URL format"
        });
      }
    }

    // Auto-detect store from productUrl if not provided
    let detectedStore = store;
    if (productUrl && !store) {
      const urlLower = productUrl.toLowerCase();
      if (urlLower.includes('amazon')) detectedStore = 'amazon';
      else if (urlLower.includes('flipkart')) detectedStore = 'flipkart';
      else if (urlLower.includes('croma')) detectedStore = 'croma';
      else if (urlLower.includes('reliancedigital') || urlLower.includes('reliance')) detectedStore = 'reliance';
    }

    const alert = await Alert.create({
      userEmail: userEmail.trim(),
      userPhone: userPhone ? userPhone.trim() : undefined,
      productName: productName.trim(),
      productUrl: productUrl ? productUrl.trim() : undefined,
      store: detectedStore ? detectedStore.trim() : undefined,
      targetPrice,
      isTriggered: false
    });

    res.status(201).json({
      success: true,
      message: "Price alert set successfully",
      alert
    });

  } catch (error) {
    // Handle validation errors from mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Alert already exists"
      });
    }

    console.error("Error creating alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create price alert",
      error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
};
