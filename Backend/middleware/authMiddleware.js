const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded data to request
    req.user = decoded;

    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};