const { auth: firebaseAuth } = require("../config/firebase");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  // Get Firebase token from header (check multiple possible header formats)
  const firebaseToken =
    req.header("firebase-auth-token") ||
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.header("x-auth-token");

  console.log("---------------------------------------------------");
  console.log("AUTH MIDDLEWARE HIT");
  console.log("Token present:", !!firebaseToken);

  // 1. Handle Missing Token
  if (!firebaseToken) {
    console.log("No token provided.");
    return res
      .status(401)
      .json({ message: "No authentication token provided." });
  }

  // 2. Handle Explicit Mock Token (Frontend Demo Mode)
  if (firebaseToken === "mock-jwt-token" || firebaseToken === "mock-token") {
    console.log("Mock token detected. Using Dev User.");
    req.user = {
      id: "507f1f77bcf86cd799439011", // Dummy MongoDB ObjectId
      firebaseUid: "mock-user-uid",
      email: "demo@shetmitra.com",
      role: "customer",
    };
    return next();
  }

  // 2b. Handle Role-Specific Placeholder Tokens
  const rolePlaceholderTokens = {
    "vendor-jwt-token": "vendor",
    "delivery-jwt-token": "delivery_partner",
    "admin-jwt-token": "admin",
  };
  if (rolePlaceholderTokens[firebaseToken]) {
    const targetRole = rolePlaceholderTokens[firebaseToken];
    console.log(
      `Role-specific placeholder token detected: ${firebaseToken} -> role: ${targetRole}`,
    );
    try {
      const user = await User.findOne({ role: targetRole }).sort({
        updatedAt: -1,
      });
      if (user) {
        console.log(`Found ${targetRole} user: ${user.email} (${user._id})`);
        req.user = {
          id: user._id,
          firebaseUid: user.firebaseUid || `placeholder-${targetRole}`,
          email: user.email,
          role: user.role,
        };
        return next();
      } else {
        console.log(`No user found with role ${targetRole}`);
        return res
          .status(403)
          .json({ message: `No ${targetRole} account found in database.` });
      }
    } catch (dbErr) {
      console.error("DB error looking up role-specific user:", dbErr.message);
      return res
        .status(500)
        .json({ message: "Server error during authentication." });
    }
  }

  // 3. Try Real Verification
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(firebaseToken);
    const { uid, email } = decodedToken;

    let user = await User.findOne({ firebaseUid: uid });

    // Auto-create/mock logic if user missing from DB but token valid
    if (!user) {
      console.log(
        "Token valid but user not found by firebaseUid. Trying email lookup...",
      );
      // Try to find by email instead (firebaseUid may not have been synced)
      user = await User.findOne({ email: email });
      if (user) {
        console.log(
          `Found user by email: ${email}, role: ${user.role}. Syncing firebaseUid...`,
        );
        // Sync the firebaseUid for future lookups
        user.firebaseUid = uid;
        await user.save();
        req.user = {
          id: user._id,
          firebaseUid: uid,
          email: email,
          role: user.role,
        };
      } else {
        console.log(`No user found in MongoDB for Firebase UID: ${uid}`);
        
        let assumedRole = "customer";
        let dummyId = "507f1f77bcf86cd799439011";

        if (req.originalUrl.includes("/api/vendor")) {
          assumedRole = "vendor";
          const dummyVendor = await User.findOne({ role: "vendor" });
          if (dummyVendor) dummyId = dummyVendor._id;
        } else if (req.originalUrl.includes("/api/delivery")) {
          assumedRole = "delivery_partner";
          const dummyDelivery = await User.findOne({ role: "delivery_partner" });
          if (dummyDelivery) dummyId = dummyDelivery._id;
        }

        // Create a mock user object based on the valid firebase token for Dev
        req.user = {
          id: dummyId,
          firebaseUid: uid,
          email: email,
          role: assumedRole,
        };
        return next();
      }
    } else {
      let assumedRole = user.role;
      let effectiveId = user._id;

      // Smart dev override: If they have a Customer role but try testing the Delivery app,
      // let them assume the dummy delivery account for testing purposes immediately.
      if (
        user.role !== "vendor" &&
        req.originalUrl.includes("/api/vendor")
      ) {
        assumedRole = "vendor";
        const dummyVendor = await User.findOne({ role: "vendor" });
        if (dummyVendor) effectiveId = dummyVendor._id;
      } else if (
        user.role !== "delivery_partner" &&
        req.originalUrl.includes("/api/delivery")
      ) {
        assumedRole = "delivery_partner";
        const dummyDelivery = await User.findOne({
          role: "delivery_partner",
        });
        if (dummyDelivery) effectiveId = dummyDelivery._id;
      }

      req.user = {
        id: effectiveId,
        firebaseUid: uid,
        email: email,
        role: assumedRole,
      };
    }
    console.log("Firebase verification successful.");
    return next();
  } catch (err) {
    console.error(">>> AUTH ERROR (Primary Verification Failed):", err.message);

    // 4. FAILSAFE BYPASS (The "Nuclear" Option)
    // If verification fails (e.g. bad keys, dev env), we LET THEM IN anyway as a dev user.
    console.warn(
      "⚠️ ACTIVATING DEV BYPASS: Verification failed, but allowing access for debugging.",
    );

    // Try to decode insecurely just to get an email/sub if possible for logging
    let extractedEmail = "bypass-dev@agrokart.com";
    let extractedUid = "bypass-uid";

    try {
      const parts = firebaseToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        extractedEmail = payload.email || extractedEmail;
        extractedUid = payload.sub || extractedUid;
      }
    } catch (e) {
      /* ignore decode error */
    }

    // Try to find a real user to impersonate, or use mock
    // We wrap this in try-catch to prevent crashing
    try {
      // Find ANY user to mock if specific one not found
      let user = await User.findOne({ email: extractedEmail });
      if (!user) {
        // Just for dev: pick the first user in the DB
        user = await User.findOne({});
      }

      if (user) {
        console.log("Bypassing with Real DB User:", user.email);
        req.user = {
          id: user._id,
          firebaseUid: user.firebaseUid || extractedUid,
          email: user.email,
          role: user.role,
        };
      } else {
        let assumedRole = "customer";
        let dummyId = "507f1f77bcf86cd799439011";

        if (req.originalUrl.includes("/api/vendor")) {
          assumedRole = "vendor";
          const dummyVendor = await User.findOne({ role: "vendor" });
          if (dummyVendor) dummyId = dummyVendor._id;
        } else if (req.originalUrl.includes("/api/delivery")) {
          assumedRole = "delivery_partner";
          const dummyDelivery = await User.findOne({ role: "delivery_partner" });
          if (dummyDelivery) dummyId = dummyDelivery._id;
        }

        console.log(`Bypassing with Mock Data (No DB user found), Role: ${assumedRole}`);
        req.user = {
          id: dummyId,
          firebaseUid: extractedUid,
          email: extractedEmail,
          role: assumedRole,
        };
      }
      return next();
    } catch (dbErr) {
      console.error("DB Error during bypass:", dbErr.message);
      // Absolute fallback
      req.user = {
        id: "507f1f77bcf86cd799439011",
        firebaseUid: "bypass-uid",
        email: "panic-fallback@agrokart.com",
        role: "customer",
      };
      return next();
    }
  }
};
