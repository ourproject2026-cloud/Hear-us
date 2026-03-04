const express = require("express");
const router = express.Router();

// ✅ Ensure all models are imported!
const Comment = require("../models/comment"); 
const ModerationReport = require("../models/ModerationReport");
const IncidentReport = require("../models/IncidentReport"); 

const auth = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/isAdmin");

// Apply auth and admin checks to ALL routes in this file
router.use(auth, isAdmin);

/* =========================
   ADMIN PING
========================= */
router.get("/ping", (req, res) => {
  res.json({ ok: true });
});

/* =========================
   INCIDENT REPORT ROUTES 
========================= */
// GET: Fetch ALL reports (Approved, Pending, Rejected)
router.get("/reports", async (req, res) => {
  try {
    const reports = await IncidentReport.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});

// PATCH: Override AI Decision (Change Status)
router.patch("/reports/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const report = await IncidentReport.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

// DELETE: Completely remove an Incident report
router.delete("/reports/:id", async (req, res) => {
  try {
    await IncidentReport.findByIdAndDelete(req.params.id);
    res.json({ message: "Report permanently deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete report" });
  }
});

/* =========================
   FLAGGED CONTENT ROUTES (🔥 NEW for Dashboard)
========================= */
// GET: Fetch all active moderation tickets for the "Flagged Content" tab
router.get("/flagged-tickets", async (req, res) => {
  try {
    // Only fetch "Open" tickets and populate the details so the Admin can see what was flagged
    const tickets = await ModerationReport.find({ status: "Open" })
      .populate("targetId")
      .populate("reportedBy", "name email") 
      .sort({ createdAt: -1 });
      
    res.json(tickets || []);
  } catch (err) {
    console.error("ADMIN MODERATION ERROR:", err);
    res.status(500).json({ message: "Failed to fetch flagged tickets" });
  }
});

// POST: Resolve a Flagged Ticket (Ignore or Delete)
router.post("/tickets/:id/resolve", async (req, res) => {
  try {
    const { status } = req.body; // Expects "Dismissed" or "Actioned"
    const ticket = await ModerationReport.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // 1. Update the ticket status so it leaves the "Open" queue
    ticket.status = status;
    await ticket.save();

    // 2. If the Admin decided the flag was valid and chose to Delete ("Actioned")
    if (status === "Actioned") {
      if (ticket.targetType === "IncidentReport") {
        await IncidentReport.findByIdAndDelete(ticket.targetId);
      } else if (ticket.targetType === "Comment") {
        await Comment.findByIdAndDelete(ticket.targetId);
      }
    }

    res.json({ message: `Ticket resolved and marked as ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error resolving ticket" });
  }
});

/* =========================
   HIDE / DELETE COMMENTS
========================= */
router.patch("/comment/:id/hide", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined") return res.status(400).json({ message: "Invalid ID" });

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Not found" });

    comment.isHidden = true;
    await comment.save();
    res.json({ message: "Comment hidden" });
  } catch (error) {
    res.status(500).json({ message: "Error hiding comment" });
  }
});

router.delete("/comment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined") return res.status(400).json({ message: "Invalid ID" });

    await Comment.findByIdAndDelete(id);
    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment" });
  }
});

module.exports = router;