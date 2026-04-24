const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const findUserByEmail = async (email) => {
  const snapshot = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { _id: doc.id, id: doc.id, ...doc.data() };
};

const saveUser = async (userData) => {
  const docRef = await db.collection("users").add({
    ...userData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { _id: docRef.id, id: docRef.id, ...userData };
};

const logError = (error) => {
  const logPath = path.join(__dirname, "../../login_errors.log");
  const timestamp = new Date().toISOString();
  const message = `\n[${timestamp}] ERROR: ${error.message}\nSTACK: ${error.stack}\n`;
  fs.appendFileSync(logPath, message);
};

// Initialize Firebase Admin from config
const { auth: firebaseAuth } = require("../config/firebase");

// Register with Firebase Authentication
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role, firebaseUid } = req.body;

    console.log("📝 Registration request:", {
      name,
      email,
      phone,
      role,
      firebaseUid,
    });

    // Check if user already exists
    let user = await findUserByEmail(email);
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user in database
    user = await saveUser({
      name,
      email,
      firebaseUid, // Store Firebase UID instead of password
      phone,
      role: role || "customer", // Default to customer if no role specified
    });

    console.log("✅ User registered successfully:", {
      id: user._id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message, stack: err.stack });
  }
});

// Unified Login Endpoint (Handles both Email/Password and Firebase Token)
router.post("/login", async (req, res) => {
  try {
    const { email, password, expectedRole, idToken } = req.body;
    console.log("Login attempt:", {
      email,
      hasPassword: !!password,
      expectedRole,
      hasIdToken: !!idToken,
    });

    // Case 1: Firebase Token Login (Social Login / Token Sync)
    if (idToken) {
      try {
        // Verify Firebase token
        console.log("Verifying ID Token...");
        const decodedToken = await firebaseAuth.verifyIdToken(idToken);
        const { uid, email: tokenEmail } = decodedToken;

        console.log("Firebase token verified:", { uid, email: tokenEmail });

        if (!tokenEmail) {
          console.warn(
            "Token has no email. This might cause issues if email is required.",
          );
        }

        // Find user in our database
        let user = await findUserByEmail(tokenEmail);

        // If user doesn't exist in our database but exists in Firebase, create them
        if (!user) {
          console.log("User not found in DB. Fetching from Firebase...");
          // Get user details from Firebase
          const firebaseUser = await firebaseAuth.getUser(uid);

          console.log("Firebase user fetched:", {
            displayName: firebaseUser.displayName,
            phoneNumber: firebaseUser.phoneNumber,
          });

          // Create new user in our database
          const userRole = expectedRole || "customer";
          user = await saveUser({
            name:
              firebaseUser.displayName ||
              (tokenEmail ? tokenEmail.split("@")[0] : "User"),
            email: tokenEmail,
            firebaseUid: uid,
            phone: firebaseUser.phoneNumber,
            role: userRole, // Use the role from frontend selection
          });

          console.log("Created new user from Firebase auth:", {
            id: user._id,
            email: tokenEmail,
            role: userRole,
          });
        }

        console.log("✅ Login successful for user:", {
          id: user._id,
          email: user.email,
          role: user.role,
        });

        // If expectedRole is provided and user exists but has a different role, update it
        if (expectedRole && user.role !== expectedRole) {
          console.log(`Updating user role from '${user.role}' to '${expectedRole}' for ${user.email}`);
          // Update role in Firestore
          const userDocs = await db.collection("users").where("email", "==", user.email).limit(1).get();
          if (!userDocs.empty) {
            await userDocs.docs[0].ref.update({ role: expectedRole });
            user.role = expectedRole;
            console.log(`✅ Role updated to '${expectedRole}' in Firestore`);
          }
        }

        return res.json({
          message: "Login successful",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address, // Include address explicitly
            vendorProfile: user.vendorProfile, // Include vendor profile if valid
          },
          token: `${user.role}-jwt-token`,
        });
      } catch (innerError) {
        console.error("Inner Login Error (Token/DB):", innerError);
        logError(innerError);
        return res
          .status(500)
          .json({
            message: "Login processing error",
            details: innerError.message,
          });
      }
    }

    // Case 2: Email/Password Login (Legacy/Standard)
    console.log("🔄 Customer login attempt:", { email, expectedRole });

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user in database
    const user = await findUserByEmail(email);

    if (!user) {
      return res
        .status(401)
        .json({
          message: "Invalid credentials. No account found with this email.",
        });
    }

    // Validate user role if expectedRole is specified
    if (expectedRole && user.role !== expectedRole) {
      console.log(
        "❌ Role mismatch - Expected:",
        expectedRole,
        "Found:",
        user.role,
      );
      return res.status(403).json({
        message: `Access denied. This account is registered as ${user.role}, not ${expectedRole}. Please use the correct login page for your account type.`,
        userRole: user.role,
      });
    }

    console.log("✅ Customer login successful:", {
      id: user._id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
      token: "customer-jwt-token", // In a real app, generate a proper JWT
    });
  } catch (error) {
    console.error("Outer Login error:", error);
    logError(error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    // The auth middleware already verified the Firebase token
    // and added the user info to req.user
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await findUserByEmail(req.user.email);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify Firebase token
router.post("/verify-token", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Firebase ID token is required" });
    }

    // Verify Firebase token
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // Find user in our database
    let user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }

    res.json({
      message: "Token verified",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Token verification error:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
});

// Reset password should be handled through Firebase
// This endpoint is removed as we're using Firebase for authentication

module.exports = router;
