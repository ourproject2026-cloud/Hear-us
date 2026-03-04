const express = require("express");
const router = express.Router();
const IncidentReport = require("../models/IncidentReport");
const ModerationReport = require("../models/ModerationReport");
const auth = require("../middleware/authMiddleware");

/* =========================
    GET ALL REPORTS (Admin)
    URL: GET /api/reports
========================= */
router.get("/", async (req, res) => {
  try {
    const reports = await IncidentReport.find().sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
    SUBMIT ABUSE REPORT (Incident/Post)
    URL: POST /api/reports/abuse
========================= */
router.post("/abuse", auth, async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const abuseReport = new ModerationReport({
      targetType, // "incident" or "comment"
      targetId,
      reason,
      reportedBy: req.user.id,
      status: "pending"
    });

    await abuseReport.save();
    res.status(201).json({ message: "Report submitted to moderators" });
  } catch (error) {
    console.error("ABUSE REPORT ERROR:", error);
    res.status(500).json({ message: "Failed to submit report" });
  }
});

/* =========================
    GET SINGLE REPORT
    URL: GET /api/reports/:id
========================= */
router.get("/:id", async (req, res) => {
  try {
    const report = await IncidentReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;