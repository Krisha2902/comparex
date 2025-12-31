const express = require("express");
const router = express.Router();
const {
  getProducts,
  addProduct,
  deleteProduct,
} = require("../controllers/productcontroller");

const { protect } = require("../middleware/auth"); // yahan add

// Public route - anyone can view products
router.get("/", getProducts);

// Protected routes - any logged-in user can add/delete products
router.post("/", protect, addProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;
