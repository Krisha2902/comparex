const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Signup
router.post("/signup", async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Validation for missing fields
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Phone validation (Indian format support: +91XXXXXXXXXX or 10 digits)
        const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
        if (!phoneRegex.test(phone.trim())) {
            return res.status(400).json({ message: "Invalid phone number format. Please use a valid 10-digit number." });
        }

        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { phone: phone.trim() }]
        });

        if (existingUser) {
            const field = existingUser.email === email.toLowerCase() ? "Email" : "Phone number";
            return res.status(400).json({ message: `${field} already registered` });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            phone: phone.trim(),
            password: hashedPassword
        });
        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or phone

        if (!identifier || !password) {
            return res.status(400).json({ message: "Identification and password are required" });
        }

        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { phone: identifier.trim() }
            ]
        });

        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isAdmin: user.isAdmin
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
