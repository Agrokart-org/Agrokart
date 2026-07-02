const { auth: firebaseAuth } = require("../config/firebase");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  // Get Firebase token from header
  const firebaseToken =
    req.header("firebase-auth-token") ||
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.header("x-auth-token");

  if (!firebaseToken) {
    return res
      .status(401)
      .json({ message: "No authentication token provided." });
  }

  // Strictly verify the token in Production
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(firebaseToken);
    const { uid, email } = decodedToken;

    // Strict Database lookup
    let user = await User.findOne({ firebaseUid: uid });
    
    // If not found by UID, try fallback to email to sync UID
    if (!user && email) {
      user = await User.findOne({ email: email });
      if (user) {
        user.firebaseUid = uid;
        await user.save();
      }
    }

    if (!user) {
      return res
        .status(403)
        .json({ message: "User account not found in database." });
    }

    // Role-Based Access Control strict enforcement
    // Do NOT allow dynamic role shifting based on URL in production.
    const requestedUrl = req.originalUrl;
    
    // Vendor Route Protection
    if (requestedUrl.startsWith("/api/vendor") && user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor privileges required." });
    }
    
    // Delivery Route Protection
    if (requestedUrl.startsWith("/api/delivery") && user.role !== "delivery_partner") {
      return res.status(403).json({ message: "Access denied. Delivery privileges required." });
    }

    // Admin Route Protection
    if (requestedUrl.startsWith("/api/admin") && user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    // Assign verified user to request
    req.user = {
      id: user._id,
      firebaseUid: uid,
      email: email,
      role: user.role,
    };
    
    return next();
  } catch (err) {
    // Only log the actual error stack in non-production environments
    if (process.env.NODE_ENV !== "production") {
      console.error("Auth Error:", err);
    }
    return res
      .status(401)
      .json({ message: "Invalid or expired authentication token." });
  }
};
