const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IncidentReport", // ✅ Linked to the correct model name
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    displayName: {
      type: String,
      required: true,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    likes: [{ type: String }], // Stores User IDs as strings to track unique reacts
    dislikes: [{ type: String }],

    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    // MODERATION FIELDS
    isHidden: {
      type: Boolean,
      default: false,
    },

    isReported: {
      type: Boolean,
      default: false,
    },

    reportCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);