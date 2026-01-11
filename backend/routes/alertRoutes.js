const router = require("express").Router();
const Alert = require("../models/Alert");

router.post("/create", async (req, res) => {
  try {
    const {
      userEmail,
      userPhone,
      productName,
      store,
      stores,
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

    // Phone validation (Indian format support: +91XXXXXXXXXX or 10 digits)
    if (!userPhone || !userPhone.trim()) {
      return res.status(400).json({
        success: false,
        message: "User phone number is required"
      });
    }
    const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
    if (!phoneRegex.test(userPhone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format. Please use a valid 10-digit number."
      });
    }

    // Handle stores (ensure it's an array)
    let storesArray = [];
    if (Array.isArray(stores)) {
      storesArray = stores.map(s => s.trim());
    } else if (store) {
      storesArray = [store.trim()];
    }

    // Create alert
    const alert = await Alert.create({
      userEmail: userEmail.trim(),
      userPhone: userPhone.trim(),
      productName: productName.trim(),
      stores: storesArray,
      targetPrice,
      isTriggered: false
    });

    res.status(201).json({
      success: true,
      message: "Price alert created successfully",
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
});

module.exports = router;
