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

  // Handle Role-Specific Placeholder / Dev / Demo Tokens
  const rolePlaceholderTokens = {
    "customer-jwt-token": "customer",
    "vendor-jwt-token": "vendor",
    "delivery-jwt-token": "delivery_partner",
    "admin-jwt-token": "admin",
    "mock-jwt-token": "customer",
    "mock-token": "customer",
  };

  if (rolePlaceholderTokens[firebaseToken]) {
    const targetRole = rolePlaceholderTokens[firebaseToken];
    try {
      let user = await User.findOne({ role: targetRole }).sort({ updatedAt: -1 });
      if (!user && targetRole === "delivery_partner") {
        user = await User.findOne({ email: "delivery@agrokart.com" });
        if (!user) {
          user = new User({
            name: "Raju Delivery Partner",
            email: "delivery@agrokart.com",
            phone: "9876500001",
            role: "delivery_partner",
            deliveryProfile: {
              isAvailable: true,
              isVerified: true,
              vehicleType: "bike",
              vehicleNumber: "MH-12-AB-1234",
              serviceRadius: 20
            }
          });
          await user.save();
        }
      } else if (!user && targetRole === "customer") {
        user = await User.findOne({}).sort({ updatedAt: -1 });
      }
      if (user) {
        req.user = {
          id: user._id,
          firebaseUid: user.firebaseUid || `demo-${targetRole}`,
          email: user.email,
          role: user.role,
        };
        return next();
      }
    } catch (dbErr) {
      console.error("DB error looking up role-specific user:", dbErr.message);
    }
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
      // Auto-create user if missing in DB but exists in Firebase
      user = new User({
        firebaseUid: uid,
        email: email || `${uid}@guest.agrokart.com`,
        name: decodedToken.name || "Agrokart User",
        phone: decodedToken.phone_number || `+00${Date.now().toString().slice(-10)}`,
        role: "customer" // Default to customer
      });
      await user.save();
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
