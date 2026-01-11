const router = require("express").Router();
const Alert = require("../models/Alert");

router.post("/create", async (req, res) => {
  try {
    const {
      userEmail,
      userPhone,
      productName,
      productUrl,
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

    // ProductUrl validation if provided
    if (productUrl && productUrl.trim()) {
      try {
        new URL(productUrl.trim()); // Validate URL format
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid product URL format"
        });
      }
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
      userPhone: userPhone ? userPhone.trim() : undefined,
      productName: productName.trim(),
      productUrl: productUrl ? productUrl.trim() : undefined,
      stores: storesArray,
      targetPrice,
      currentPrice: req.body.currentPrice || undefined,
      lastCheckedPrice: req.body.currentPrice || undefined,
      priceHistory: req.body.currentPrice ? [{ price: req.body.currentPrice, timestamp: new Date() }] : [],
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


// GET /list/:userEmail - Get all alerts for a user
router.get("/list/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    if (!userEmail) return res.status(400).json({ success: false, message: "User email required" });

    const alerts = await Alert.find({ userEmail }).sort({ createdAt: -1 });
    res.json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ success: false, message: "Failed to fetch alerts" });
  }
});

// GET /notifications/:userEmail - Get triggered alerts
router.get("/notifications/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    // Find alerts that are triggered
    const alerts = await Alert.find({
      userEmail,
      isTriggered: true
    }).sort({ triggeredAt: -1 }).limit(10);

    res.json({ success: true, count: alerts.length, notifications: alerts });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

// DELETE /:id - Delete an alert
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Alert.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    res.json({ success: true, message: "Alert deleted successfully" });
  } catch (error) {
    console.error("Error deleting alert:", error);
    res.status(500).json({ success: false, message: "Failed to delete alert" });
  }
});

module.exports = router;
