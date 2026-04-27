const express = require("express");
const router = express.Router();
const IncidentReport = require("../models/IncidentReport");
const ModerationReport = require("../models/ModerationReport");
const auth = require("../middleware/authMiddleware");
const { createIncidentReport, getPublicReports } = require("../controllers/incidentReportController");
const upload = require("../middleware/upload");
const User = require("../models/User");
// 🛡️ INTERNAL HELPER: Check if user is Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access only." });
  }
  next();
};

// ✅ Public feed
router.get("/public", getPublicReports);

// ✅ Admin All Reports (Protected)
router.get("/all", auth, isAdmin, async (req, res) => {
  try {
    const reports = await IncidentReport.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports" });
  }
});

// ✅ Admin Flagged (Protected + Auto-Cleanup)
router.get("/admin/flagged", auth, isAdmin, async (req, res) => {
  try {
    const flaggedItems = await ModerationReport.find().sort({ createdAt: -1 }).lean();
    const validFlags = [];
    for (let flag of flaggedItems) {
      if (flag.targetType === "IncidentReport") {
        flag.targetData = await IncidentReport.findById(flag.targetId).lean();
      } else {
        const Comment = require("../models/comment");
        flag.targetData = await Comment.findById(flag.targetId).lean();
      }
      if (!flag.targetData) await ModerationReport.findByIdAndDelete(flag._id);
      else validFlags.push(flag);
    }
    res.json(validFlags);
  } catch (error) {
    res.status(500).json({ message: "Error fetching flagged items" });
  }
});

// ✅ Profile Page
router.get("/me", auth, async (req, res) => {
  try {
    const safeUserId = req.user.userId || req.user.id || req.user._id;
    const myReports = await IncidentReport.find({ userId: safeUserId }).sort({ createdAt: -1 });
    res.json(myReports);
  } catch (error) {
    res.status(500).json({ message: "Profile load failed" });
  }
});

// ✅ Get single report
router.get("/:id", async (req, res) => {
  try {
    const report = await IncidentReport.findById(req.params.id);
    res.json(report);
  } catch (err) {
    res.status(404).send();
  }
});

// ✅ Create report
router.post("/", auth, upload.single("media"), createIncidentReport);

// =======================================================
// 🚀 RESTORED MISSING ROUTES: LIKES, DISLIKES & FLAGS
// =======================================================

/* =========================
   👍 LIKE POST (Boosts Reputation)
========================= */
router.post("/:id/like", auth, async (req, res) => {
  try {
    const report = await IncidentReport.findById(req.params.id);
    const safeUserId = req.user.id || req.user.userId || req.user._id;

    if (!report) return res.status(404).json({ message: "Report not found" });

    // Initialize arrays if they don't exist
    if (!report.likes) report.likes = [];
    if (!report.dislikes) report.dislikes = [];

    const hasLiked = report.likes.includes(safeUserId);

    if (hasLiked) {
      report.likes.pull(safeUserId); // Remove like
    } else {
      report.likes.push(safeUserId); // Add like
      report.dislikes.pull(safeUserId); // Remove dislike

      // 🚀 REPUTATION BOOST: Reward the author for good content
      if (report.userId) {
        await User.findByIdAndUpdate(report.userId, { $inc: { trustScore: 1 } });
      }
    }

    await report.save();
    res.json({ likes: report.likes.length, dislikes: report.dislikes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Dislike a Report
router.post("/:id/dislike", auth, async (req, res) => {
  try {
    const safeUserId = req.user.id || req.user.userId || req.user._id;
    const report = await IncidentReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (!report.likes) report.likes = [];
    if (!report.dislikes) report.dislikes = [];

    // Remove from likes
    report.likes = report.likes.filter(id => id.toString() !== safeUserId.toString());

    // Toggle the dislike
    const hasDisliked = report.dislikes.some(id => id.toString() === safeUserId.toString());
    if (hasDisliked) {
      report.dislikes = report.dislikes.filter(id => id.toString() !== safeUserId.toString());
    } else {
      report.dislikes.push(safeUserId);
    }

    await report.save();
    res.json({ likes: report.likes.length, dislikes: report.dislikes.length });
  } catch (err) {
    console.error("Dislike Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   🚩 FLAG POST (Auto-Hides & Penalizes)
========================= */
router.post("/:id/flag", auth, async (req, res) => {
  try {
    const report = await IncidentReport.findById(req.params.id);
    const safeUserId = req.user.id || req.user.userId || req.user._id;

    if (!report) return res.status(404).json({ message: "Report not found" });

    // Initialize flags array if it doesn't exist
    if (!report.flags) report.flags = [];

    // Prevent a user from flagging the same post 10 times
    if (report.flags.includes(safeUserId)) {
      return res.status(400).json({ message: "You have already flagged this report." });
    }

    report.flags.push(safeUserId);

    // 🚀 THE AUTO-MODERATOR LOGIC
    if (report.flags.length >= 5) {
      // 1. Pull the post off the public feed immediately
      report.status = "under_review"; 

      // 2. Heavily penalize the author's trust score
      if (report.userId) {
        const author = await User.findById(report.userId);
        if (author) {
          author.trustScore -= 15; // Massive penalty for fake reports
          
          // 3. Auto-ban if they drop below zero
          if (author.trustScore <= 0) {
            author.isRestricted = true; 
          }
          await author.save();
        }
      }
    }

    await report.save();
    
    if (report.status === "under_review") {
      res.json({ message: "Report has been hidden pending Admin review." });
    } else {
      res.json({ message: `Report flagged. Total flags: ${report.flags.length}/5 before removal.` });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =======================================================

// ✅ DELETE (Authorized: Owner OR Admin)
router.delete("/:id", auth, async (req, res) => {
  try {
    const report = await IncidentReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Not found" });

    const safeUserId = req.user.userId || req.user.id || req.user._id;
    
    if (report.userId !== safeUserId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await ModerationReport.deleteMany({ targetId: req.params.id });
    await IncidentReport.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).send(); }
});

// ✅ Status Update (Admin Only)
// ✅ Status Update (Admin Only)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    // Basic admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { status, moderatorMessage } = req.body;
    
    // 🚀 NEW: Save the status AND the message
    const updateData = { status };
    if (moderatorMessage) {
      updateData.moderatorMessage = moderatorMessage;
    }

    const report = await IncidentReport.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ EDIT a Report (Authorized: Owner Only)
router.put("/:id", auth, async (req, res) => {
  try {
    const report = await IncidentReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    // Safely extract user ID
    const safeUserId = req.user.userId || req.user.id || req.user._id;
    
    // Verify the user trying to edit actually owns the report
    if (report.userId !== safeUserId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to edit this report." });
    }

    // Update the allowed fields
    const { title, description, category, location } = req.body;
    if (title) report.title = title;
    if (description) report.description = description;
    if (category) report.category = category;
    if (location) report.location = location;

    await report.save();
    res.json(report);
  } catch (err) {
    console.error("Edit Error:", err);
    res.status(500).json({ message: "Server error editing report" });
  }
});

// ✅ Flag Cleanup (Admin Only)
router.delete("/admin/flagged/:flagId", auth, isAdmin, async (req, res) => {
  try {
    await ModerationReport.findByIdAndDelete(req.params.flagId);
    res.json({ message: "Flag removed" });
  } catch (err) { res.status(500).send(); }
});

module.exports = router;