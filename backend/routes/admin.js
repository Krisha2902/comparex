const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Admin Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(400).json({ message: "Admin not found" });

        const isMatch = await admin.matchPassword(password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: admin._id, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.json({ 
            token, 
            user: { 
                id: admin._id, 
                email: admin.email, 
                isAdmin: true 
            } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Middleware to check admin
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isAdmin) return res.status(403).json({ message: "Not an admin" });
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ message: "Invalid token" });
    }
};

// Example: get all users (admin panel)
router.get("/users", verifyAdmin, async (req, res) => {
    try {
        const User = require("../models/user");
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
