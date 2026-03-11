const express = require("express");
const router = express.Router();
const IncidentReport = require("../models/IncidentReport");
const ModerationReport = require("../models/ModerationReport");
const auth = require("../middleware/authMiddleware");
const { createIncidentReport, getPublicReports } = require("../controllers/incidentReportController");
const upload = require("../middleware/upload");

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

// ✅ Like a Report
router.post("/:id/like", auth, async (req, res) => {
  try {
    const safeUserId = req.user.id || req.user.userId || req.user._id;
    const report = await IncidentReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (!report.likes) report.likes = [];
    if (!report.dislikes) report.dislikes = [];

    // Remove from dislikes
    report.dislikes = report.dislikes.filter(id => id.toString() !== safeUserId.toString());

    // Toggle the like
    const hasLiked = report.likes.some(id => id.toString() === safeUserId.toString());
    if (hasLiked) {
      report.likes = report.likes.filter(id => id.toString() !== safeUserId.toString());
    } else {
      report.likes.push(safeUserId);
    }

    await report.save();
    res.json({ likes: report.likes.length, dislikes: report.dislikes.length });
  } catch (err) {
    console.error("Like Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
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

// ✅ Flag a Report (Auto-triggers AI Moderator)
router.post("/:id/flag", auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const safeUserId = req.user.id || req.user.userId || req.user._id;
    const report = await IncidentReport.findById(req.params.id);
    
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (!report.flags) report.flags = [];

    // Prevent double-flagging
    if (report.flags.some(id => id.toString() === safeUserId.toString())) {
      return res.status(400).json({ message: "You already flagged this report." });
    }

    report.flags.push(safeUserId);
    await report.save();

    // Send to Admin Dashboard
    await ModerationReport.create({
      targetId: report._id,
      targetType: "IncidentReport", 
      reportedBy: safeUserId,
      reason: reason || "Inappropriate Content"
    });

    // Re-trigger AI Review
    if (report.flags.length >= 1) {
      const { verifyReport } = require("../utils/aiModerator"); 
      const aiStatus = await verifyReport(report.title, report.description, report.category);
      if (aiStatus !== "approved") {
        report.status = "pending"; 
        await report.save();
        return res.json({ message: "Report flagged and removed for admin review." });
      }
    }

    res.json({ message: "Report flagged successfully and sent to Command Center." });
  } catch (err) {
    console.error("Flag Error:", err);
    res.status(500).json({ message: "Error flagging report" });
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
router.patch("/:id/status", auth, isAdmin, async (req, res) => {
  try {
    const report = await IncidentReport.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(report);
  } catch (err) { res.status(500).send(); }
});

// ✅ Flag Cleanup (Admin Only)
router.delete("/admin/flagged/:flagId", auth, isAdmin, async (req, res) => {
  try {
    await ModerationReport.findByIdAndDelete(req.params.flagId);
    res.json({ message: "Flag removed" });
  } catch (err) { res.status(500).send(); }
});

module.exports = router;