const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

/* =========================
   SIGNUP
========================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Signup successful ✅",
      user: { id: user._id, name: user.name, email: user.email },
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    if (!user.password)
      return res.status(400).json({
        message: "Use Google login for this account",
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
        role: user.role || "user",
        createdAt: user.createdAt
      },
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GOOGLE AUTH
========================= */

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { userId: req.user._id, role: req.user.role || "user" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.redirect(
        `http://localhost:5173/auth-success?token=${token}`
      );
    } catch (err) {
      res.redirect("http://localhost:5173/login");
    }
  }
);

/* =========================
   CURRENT USER (FIXED)
========================= */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;