const express = require("express");
const router = express.Router();
const IncidentReport = require("../models/IncidentReport");
const ModerationReport = require("../models/ModerationReport"); // Used for flagged items
const auth = require("../middleware/authMiddleware");
const { createIncidentReport, getPublicReports } = require("../controllers/incidentReportController");
const { verifyReport } = require("../utils/aiModerator"); 
const upload = require("../middleware/upload");

// ✅ Public feed
router.get("/public", getPublicReports);

// ✅ Admin: Fetch ALL reports for the dashboard
// MUST BE BEFORE /:id
router.get("/all", auth, async (req, res) => {
  try {
    const reports = await IncidentReport.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error("Error fetching all reports:", error);
    res.status(500).json({ message: "Server error fetching all reports" });
  }
});

// ✅ Admin: Fetch ALL flagged content (Reports & Comments)
// MUST BE BEFORE /:id
// ✅ Admin: Fetch ALL flagged content (Reports & Comments) WITH Content Previews
// ✅ Admin: Fetch and Auto-Cleanup Dead Tickets
router.get("/admin/flagged", auth, async (req, res) => {
  try {
    const flaggedItems = await ModerationReport.find().sort({ createdAt: -1 }).lean();
    const validFlags = [];

    for (let flag of flaggedItems) {
      if (flag.targetType === "IncidentReport") {
        flag.targetData = await IncidentReport.findById(flag.targetId).lean();
      } else if (flag.targetType === "Comment") {
        const Comment = require("../models/comment");
        flag.targetData = await Comment.findById(flag.targetId).lean();
      }

      // 🚀 AUTO-CLEANUP: If data is missing, delete the flag forever
      if (!flag.targetData) {
        await ModerationReport.findByIdAndDelete(flag._id);
      } else {
        validFlags.push(flag);
      }
    }
    res.json(validFlags);
  } catch (error) {
    res.status(500).json({ message: "Error fetching items" });
  }
});

// ✅ GET: Fetch user's own reports for the Profile page
router.get("/me", auth, async (req, res) => {
  try {
    // Extract the ID exactly as you do in your controller
    const safeUserId = req.user?.id || req.user?.userId || req.user?._id;
    
    // Find reports matching this userId
    const myReports = await IncidentReport.find({ userId: safeUserId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(myReports);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: "Failed to fetch profile reports" });
  }
});
// ✅ Get single report
router.get("/:id", async (req, res) => {
  try {
    const report = await IncidentReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Not found" });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching report" });
  }
});

// ✅ Create report
router.post("/", auth, upload.single("media"), createIncidentReport);

// ✅ Like a Report
router.post("/:id/like", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const report = await IncidentReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (!report.likes) report.likes = [];
    if (!report.dislikes) report.dislikes = [];

    report.dislikes = report.dislikes.filter(id => id.toString() !== userId);

    if (report.likes.includes(userId)) {
      report.likes = report.likes.filter(id => id.toString() !== userId);
    } else {
      report.likes.push(userId);
    }

    await report.save();
    res.json({ likes: report.likes.length, dislikes: report.dislikes.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Dislike a Report
router.post("/:id/dislike", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const report = await IncidentReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (!report.likes) report.likes = [];
    if (!report.dislikes) report.dislikes = [];

    report.likes = report.likes.filter(id => id.toString() !== userId);

    if (report.dislikes.includes(userId)) {
      report.dislikes = report.dislikes.filter(id => id.toString() !== userId);
    } else {
      report.dislikes.push(userId);
    }

    await report.save();
    res.json({ likes: report.likes.length, dislikes: report.dislikes.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Flag a Report (Auto-triggers AI Moderator)
router.post("/:id/flag", auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.userId || req.user.id;
    const report = await IncidentReport.findById(req.params.id);
    
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (!report.flags) report.flags = [];

    if (report.flags.includes(userId)) {
      return res.status(400).json({ message: "You already flagged this report." });
    }

    report.flags.push(userId);
    await report.save();

    await ModerationReport.create({
      targetId: report._id,
      targetType: "IncidentReport", 
      reportedBy: userId,
      reason: reason || "Inappropriate Content"
    });

    if (report.flags.length >= 1) {
      const aiStatus = await verifyReport(report.title, report.description, report.category);
      if (aiStatus !== "approved") {
        report.status = "pending"; 
        await report.save();
        return res.json({ message: "Report flagged and removed for admin review." });
      }
    }

    res.json({ message: "Report flagged successfully." });
  } catch (err) {
    res.status(500).json({ message: "Error flagging report" });
  }
});

// 🚀 DELETE Route (Requires Auth)
// ✅ Corrected DELETE Route in incidentReportRoutes.js
router.delete("/:id", auth, async (req, res) => {
  try {
    const report = await IncidentReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    // 🚀 NEW: Automatically delete any flags linked to this report ID
    const ModerationReport = require("../models/ModerationReport"); // Adjust path as needed
    await ModerationReport.deleteMany({ targetId: req.params.id });

    // Delete the actual report
    await IncidentReport.findByIdAndDelete(req.params.id);

    res.json({ message: "Report and associated flags deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error while deleting" });
  }
});
// ✅ Admin: Update Report Status
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const report = await IncidentReport.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );
    
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Error updating status" });
  }
});
// ✅ Edit a Comment
router.put("/:id", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Text is required" });

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Safely extract the logged-in user's ID
    const safeUserId = req.user?.id || req.user?.userId || req.user?._id;
    
    // 🚀 NEW: Bulletproof safety check! 
    // If the comment has no authorId, or if it doesn't match the logged-in user, reject it safely.
    if (!comment.authorId || comment.authorId.toString() !== safeUserId.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this comment" });
    }

    comment.text = text;
    await comment.save();

    res.json(comment);
  } catch (error) {
    console.error("Edit Comment Error:", error);
    // Send the actual error message back so we can read it if it fails again!
    res.status(500).json({ message: "Server error editing comment", error: error.message });
  }
});
// ✅ Place this in incidentReportRoutes.js
router.delete("/admin/flagged/:flagId", auth, async (req, res) => {
  try {
    await ModerationReport.findByIdAndDelete(req.params.flagId);
    res.json({ message: "Flag dismissed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error dismissing flag" });
  }
});
module.exports = router;