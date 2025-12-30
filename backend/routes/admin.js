const express = require("express");
const router = express.Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");

// Middleware to check admin
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if(!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded.isAdmin) return res.status(403).json({ message: "Not an admin" });
        req.user = decoded;
        next();
    } catch(err) {
        res.status(403).json({ message: "Invalid token" });
    }
};

// Example: get all users (admin panel)
router.get("/users", verifyAdmin, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
