const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const streamifier = require("streamifier");

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create Employee
router.post("/create-employee", protect, adminOnly, async (req, res) => {
  const { name, email, password, dateOfJoining, department, profileImage } = req.body;

  if (!name || !email || !password || !dateOfJoining || !department) {
    return res.status(400).json({ message: "All fields except profile image are required" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Employee already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = new User({
      name,
      email,
      password: hashedPassword,
      role: "employee",
      admin: req.user._id,
      dateOfJoining: new Date(dateOfJoining),
      department: department.trim(),
      profileImage: profileImage || "",
    });

    await employee.save();
    res.status(201).json({ message: "Employee created successfully", employee });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ message: "Error creating employee", error: error.message });
  }
});

// Get Employees
router.get("/employees", protect, adminOnly, async (req, res) => {
  try {
    const employees = await User.find({ admin: req.user._id, role: "employee" }).select("-password");
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Error fetching employees", error: error.message });
  }
});

// Upload Employee Profile Image
router.post("/upload-profile-image", protect, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Only employees can upload profile images" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    // Upload image to Cloudinary
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "employee_profiles" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });

        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);

    // Update User Profile Image
    await User.findByIdAndUpdate(req.user._id, { profileImage: result.secure_url });

    res.status(200).json({ message: "Profile image updated successfully", profileImage: result.secure_url });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ message: "Image upload failed", error: error.message });
  }
});

// Get Employee Profile
router.get("/profile", protect, async (req, res) => {
  try {
    const employee = await User.findById(req.user._id).select("-password");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json(employee);
  } catch (error) {
    console.error("Error fetching employee profile:", error);
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

module.exports = router;
