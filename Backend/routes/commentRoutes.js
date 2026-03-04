const express = require("express");
const router = express.Router();

const Comment = require("../models/comment");
const ModerationReport = require("../models/ModerationReport");
const User = require("../models/User"); // Needed to fetch the real name
const auth = require("../middleware/authMiddleware");

/* =========================
    GET COMMENTS BY REPORT ID
========================= */
router.get("/", async (req, res) => {
  try {
    const { reportId } = req.query;
    if (!reportId) return res.status(400).json({ message: "reportId is required" });

    const comments = await Comment.find({ reportId }).sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (error) {
    console.error("GET COMMENTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
    POST NEW COMMENT
========================= */
router.post("/", auth, async (req, res) => {
  try {
    const { reportId, text, isAnonymous, parentCommentId } = req.body;

    if (!text || !reportId) {
      return res.status(400).json({ message: "Text and reportId are required" });
    }

    // Safely extract User ID
    const safeUserId = req.user?.id || req.user?.userId || req.user?._id;

    // Look up the user's real name
    let finalAuthorName = "Verified User"; 
    if (isAnonymous) {
      finalAuthorName = "Anonymous";
    } else {
      const foundUser = await User.findById(safeUserId);
      if (foundUser && foundUser.name) {
        finalAuthorName = foundUser.name;
      }
    }

    const newComment = new Comment({
      reportId,
      text,
      isAnonymous,
      parentCommentId: parentCommentId || null,
      author: finalAuthorName,
      authorId: safeUserId,
      likes: [],    // 🚀 FIXED: Starts as empty arrays
      dislikes: []
    });

    const savedComment = await newComment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    console.error("POST COMMENT ERROR:", error);
    res.status(500).json({ message: "Failed to post comment" });
  }
});

/* =========================
    REACT TO COMMENT (Toggle Like/Dislike)
========================= */
router.post("/:id/react", auth, async (req, res) => {
  try {
    const { action } = req.body; 
    const comment = await Comment.findById(req.params.id);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const safeUserId = req.user?.id || req.user?.userId || req.user?._id;

    // Safety fallback
    if (!comment.likes) comment.likes = [];
    if (!comment.dislikes) comment.dislikes = [];

    const hasLiked = comment.likes.includes(safeUserId);
    const hasDisliked = comment.dislikes.includes(safeUserId);

    // 🚀 FIXED: Smart Toggle Logic
    if (action === "like") {
      if (hasLiked) {
        comment.likes.pull(safeUserId); // Remove like
      } else {
        comment.likes.push(safeUserId); // Add like
        comment.dislikes.pull(safeUserId); // Remove dislike
      }
    } else if (action === "dislike") {
      if (hasDisliked) {
        comment.dislikes.pull(safeUserId); // Remove dislike
      } else {
        comment.dislikes.push(safeUserId); // Add dislike
        comment.likes.pull(safeUserId); // Remove like
      }
    }

    await comment.save();
    res.json({ likes: comment.likes.length, dislikes: comment.dislikes.length });
  } catch (err) {
    console.error("Reaction Error:", err);
    res.status(500).json({ message: "Reaction failed" });
  }
});

/* =========================
   REPORT A COMMENT
========================= */
router.post("/:id/report", auth, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: "Reason is required" });

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const safeUserId = req.user?.id || req.user?.userId || req.user?._id;

    await ModerationReport.create({
      targetType: "Comment", 
      targetId: comment._id,
      reason,
      reportedBy: safeUserId, 
    });

    await Comment.updateOne({ _id: comment._id }, { $set: { isReported: true } });

    res.status(201).json({ message: "Comment reported successfully" });
  } catch (error) {
    console.error("REPORT COMMENT ERROR:", error);
    res.status(500).json({ message: "Server error while reporting comment" });
  }
});
// ✅ Admin/User: Delete a Comment
router.delete("/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // 🚀 NEW: Delete any flags associated with this comment!
    await ModerationReport.deleteMany({ targetId: req.params.id });

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting comment" });
  }
});
// ... existing imports ...

// ✅ FIX: Bulletproof Edit Route
router.put("/:id", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Text is required" });

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Safely extract User ID from token
    const safeUserId = req.user?.id || req.user?.userId || req.user?._id;

    // Verify ownership
    if (!comment.authorId || comment.authorId.toString() !== safeUserId.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this comment" });
    }

    comment.text = text;
    await comment.save();

    res.json(comment);
  } catch (error) {
    console.error("Edit Comment Error:", error);
    res.status(500).json({ message: "Server error editing comment", error: error.message });
  }
});

module.exports = router;