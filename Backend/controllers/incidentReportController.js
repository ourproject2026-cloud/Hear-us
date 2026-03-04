const IncidentReport = require("../models/IncidentReport");
const crypto = require("crypto");
const User = require("../models/User"); 
const { verifyReport } = require("../utils/aiModerator"); 

const generateReportId = () => {
  return "REP-" + crypto.randomBytes(4).toString("hex").toUpperCase();
};

exports.createIncidentReport = async (req, res) => {
  try {
    const { title, category, description, location, isAnonymous, latitude, longitude } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let mediaUrl = "";
    let mediaType = "";

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      if (req.file.mimetype.startsWith("image/")) {
        mediaType = "image";
      } else if (req.file.mimetype.startsWith("video/")) {
        mediaType = "video";
      } else if (req.file.mimetype.startsWith("audio/")) {
        mediaType = "audio";
      } else {
        mediaType = "other";
      }
    }

    const isAnon = isAnonymous === 'true' || isAnonymous === true;
    const aiStatus = await verifyReport(title, description, category);

    // 🚀 NEW: Print the user token payload to the terminal to see what's inside!
    console.log("--- NEW REPORT SUBMISSION ---");
    console.log("Token Data (req.user):", req.user);
    
    const safeUserId = req.user?.id || req.user?.userId || req.user?._id;
    console.log("Extracted safeUserId:", safeUserId);

    let finalAuthorName = "Verified User"; 
    
    if (isAnon) {
      finalAuthorName = "Anonymous";
    } else if (safeUserId) {
      const foundUser = await User.findById(safeUserId);
      if (foundUser && foundUser.name) {
        finalAuthorName = foundUser.name; 
      }
    }

    const newReport = new IncidentReport({
      reportId: generateReportId(),
      userId: safeUserId, 
      title,
      category,
      description,
      location: location || "Global",
      isAnonymous: isAnon,
      mediaUrl,
      mediaType,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      authorName: finalAuthorName, 
      status: aiStatus 
    });

    console.log("Report ready to save to database. UserId attached:", newReport.userId);

    await newReport.save();

    const responseMessage = aiStatus === "approved" 
      ? "Report secured and automatically approved!" 
      : "Report secured and sent for manual review.";

    res.status(201).json({ 
      message: responseMessage, 
      reportId: newReport.reportId,
      status: aiStatus
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Failed to submit report", error: error.message });
  }
};

exports.getPublicReports = async (req, res) => {
  try {
    const { location } = req.query; 
    let filter = { status: "approved" };

    if (location && location !== "Global") {
      filter.location = { $regex: location, $options: "i" };
    }

    const reports = await IncidentReport.find(filter)
      .select("reportId title category description authorName location mediaUrl mediaType latitude longitude createdAt status")
      .sort({ createdAt: -1 });
      
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};