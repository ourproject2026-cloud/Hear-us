const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IncidentReport",
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

    // 👍 REACTIONS
    likes: [{ type: String }],
    dislikes: [{ type: String }],

    // 🧵 THREADING CORE
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    // ⭐ ADD THIS (VERY IMPORTANT)
    depth: {
      type: Number,
      default: 0, // 0 = root comment, 1 = reply, 2 = reply to reply
    },

    // ⭐ OPTIONAL (for performance)
    replyCount: {
      type: Number,
      default: 0,
    },

    // 🚨 MODERATION
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