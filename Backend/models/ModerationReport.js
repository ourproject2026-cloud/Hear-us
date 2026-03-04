const mongoose = require("mongoose");

const moderationReportSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["Comment", "IncidentReport"], 
      required: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType", 
    },

    reason: {
      type: String,
      // ✅ FIXED: Removed the strict enum array here so users can type custom reasons 
      // without crashing the database!
      required: true,
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["Open", "Reviewed", "Dismissed", "Actioned"],
      default: "Open",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ModerationReport", moderationReportSchema);