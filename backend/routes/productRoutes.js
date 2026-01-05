const express = require("express");
const router = express.Router();
const {
  getProducts,
  addProduct,
  deleteProduct,
  getProductsByCategory,
} = require("../controllers/productcontroller");

const { protect } = require("../middleware/auth"); // yahan add

// Public route - anyone can view products
router.get("/", getProducts);

// Public route - get products by category
router.get("/category/:categorySlug", getProductsByCategory);

// Protected routes - any logged-in user can add/delete products
router.post("/", protect, addProduct);

router.delete("/:id", protect, deleteProduct);




module.exports = router;
