const express = require("express");
const cors = require("cors");
const passport = require("passport");
const path = require("path"); // ✅ ADD THIS LINE
require("dotenv").config();
// Configs
const connectDB = require("./config/db");
require("./config/googleAuth"); // Passport Google Strategy

// Route Imports - Fixed to match your actual filenames
// Add this with your other imports
const adminRoutes = require("./routes/adminRoutes");

// Add this in your /* API ROUTES */ section

const authRoutes = require("./routes/authRoutes");
const commentRoutes = require("./routes/commentRoutes"); // matches comments.js
const incidentReportRoutes = require("./routes/incidentReportRoutes");
const userRoutes = require("./routes/userRoutes"); // matches userRoutes.js

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

/* =========================
   API ROUTES
========================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/api/incidents", incidentReportRoutes);
app.use("/api/users", userRoutes);

// ✅ PASTE IT DOWN HERE! After app is initialized.
app.use("/api/admin", adminRoutes);

// ✅ NEW: Global Error Handler
// This catches Multer errors (like wrong file types) and ensures they are sent back as JSON!
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ 
    message: err.message || "An internal server error occurred." 
  });
});


/* =========================
   SERVER & DB STARTUP
========================= */
const PORT = process.env.PORT || 5000;
// ... rest of the file remains the same

const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected Successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

startServer();