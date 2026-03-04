const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // basic info
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    // password (optional for Google users)
    password: {
      type: String,
      default: null,
    },

    // Google OAuth
    googleId: {
      type: String,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    // role system (admin panel ready)
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);