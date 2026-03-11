const IncidentReport = require("../models/IncidentReport");
const User = require("../models/User"); // Needed to fetch user name
const { verifyReport } = require("../utils/aiModerator");
const crypto = require("crypto");

const generateReportId = () => {
  return "REP-" + crypto.randomBytes(4).toString("hex").toUpperCase();
};

exports.createIncidentReport = async (req, res) => {
  try {
    const { title, category, description, location } = req.body;
    const isAnonymous = req.body.isAnonymous === true || req.body.isAnonymous === "true";

    if (!title || !category || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Get user ID from JWT
    const safeUserId = req.user.userId || req.user.id || req.user._id;

    // Fetch user from DB (to get name)
    const user = await User.findById(safeUserId);
    console.log("User fetched from DB:", user);

    // Handle media upload
    let mediaUrl = "";
    let mediaType = "";

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;

      if (req.file.mimetype.startsWith("image")) {
        mediaType = "image";
      } else if (req.file.mimetype.startsWith("video")) {
        mediaType = "video";
      } else if (req.file.mimetype.startsWith("audio")) {
        mediaType = "audio";
      } else {
        mediaType = "other";
      }
    }

    // AI moderation
    const moderationStatus = await verifyReport(title, description, category);

    const newReport = new IncidentReport({
      reportId: generateReportId(),
      userId: safeUserId,
      title,
      category,
      description,
      location: location || "Global",
      isAnonymous: isAnonymous || false,
      mediaUrl,
      mediaType,

      // FIX: Proper identity handling
      authorName: isAnonymous ? "Anonymous" : user?.name || "Unknown",

      status: moderationStatus
    });

    await newReport.save();

    res.status(201).json({
      message:
        moderationStatus === "approved"
          ? "Report published successfully"
          : "Report submitted and pending moderation",
      reportId: newReport.reportId
    });

  } catch (error) {
    console.error("Create Report Error:", error);
    res.status(500).json({
      message: "Failed to submit report",
      error: error.message
    });
  }
};




// PUBLIC FEED
exports.getPublicReports = async (req, res) => {
  try {

    const reports = await IncidentReport.find({ status: "approved" })
      .select(
        "reportId title category description authorName location mediaUrl mediaType createdAt latitude longitude"
      )
      .sort({ createdAt: -1 });

    res.status(200).json(reports);

  } catch (error) {
    console.error("Fetch Public Reports Error:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

