const multer = require("multer");
const path = require("path");
const fs = require("fs"); // ✅ NEW: Import the built-in File System module

// Set where files should be saved and how they should be named
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/";
    
    // ✅ NEW: Check if the folder exists, if not, create it!
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir); 
  },
  filename: function (req, file, cb) {
    // Creates a unique filename: fieldname-timestamp.extension
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

// Check file type to ensure it's an image, audio, or video
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|mp4|mp3|wav|mpeg/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only Images, Audio, and Video files are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50000000 }, // 50MB limit
  fileFilter: fileFilter,
});

module.exports = upload;