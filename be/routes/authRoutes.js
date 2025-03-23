const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();

// ✅ Admin & Employee Signup (Unified Route)
router.post("/signup", async (req, res) => {
  const { name, email, password, role, dateOfJoining, profileImage } = req.body;

  try {
    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      ...(role === "employee" && { dateOfJoining, profileImage }), // Only for employees
    });

    await newUser.save();

    res.status(201).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully` });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});

// ✅ Login Route (Fixes Role & Password Issue)
router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Ensure role matches
    if (user.role !== role) {
      return res.status(400).json({ message: "Incorrect role selected" });
    }

    // ✅ Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});

module.exports = router;
