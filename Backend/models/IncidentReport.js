const mongoose = require("mongoose");

const incidentReportSchema = new mongoose.Schema(
  {
    
    userId: {
      type: String, // Or mongoose.Schema.Types.ObjectId if using refs
      required: true,
      index: true
    },
    reportId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
   category: {
      type: String,
      required: true,
      // 🚀 FIXED: Strictly alphabetical and "other" replaces "general"
      enum: [
        "civil",
        "crime",
        "economic",
        "environment",
        "medical",
        "other",
        "sports",
        "technical"
      ]
    },
    
    description: {
      type: String,
      required: true,
      minlength: 20,
    },
    location: {
      type: String,
      default: "Global",
    },
    // ✅ NEW: GPS Coordinates for the Interactive Map
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    authorName: {
      type: String,
      default: "Anonymous",
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    mediaType: {
      type: String,
      // ✅ UPDATED: Added "audio" and "other" to support all uploads
      enum: ["image", "video", "audio", "other", ""],
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("IncidentReport", incidentReportSchema);