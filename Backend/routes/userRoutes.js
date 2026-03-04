const router = require("express").Router();
const IncidentReport = require("../models/IncidentReport");
const Comment = require("../models/comment");
const auth = require("../middleware/authMiddleware");

/* =========================
    GET USER STATS
========================= */
router.get("/stats", auth, async (req, res) => {
  try {
    // req.user.userId comes from your authMiddleware
    const userId = req.user.userId;

    // Count how many reports this user has (if you store owner IDs)
    // Note: If reports are strictly anonymous, these may return 0
    const reportsCount = await IncidentReport.countDocuments({ userId: userId });
    const commentsCount = await Comment.countDocuments({ userId: userId });

    res.json({
      reports: reportsCount,
      comments: commentsCount,
      likes: 0, 
      flagged: 0,
    });
  } catch (error) {
    console.error("STATS ERROR:", error);
    res.status(500).json({ message: "Error fetching user stats" });
  }
});

module.exports = router;