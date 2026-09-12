const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { db } = require("../config/firebase");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const User = require("../models/User");

const findUserByEmail = async (email) => {
  if (!email) return null;
  const cleanEmail = email.toString().trim().toLowerCase();
  return await User.findOne({ email: cleanEmail });
};

const findUserByPhone = async (phone) => {
  if (!phone) return null;
  const cleanPhone = phone.toString().trim();
  if (!cleanPhone) return null;
  return await User.findOne({ phone: cleanPhone });
};

const saveUser = async (userData) => {
  const user = new User(userData);
  await user.save();
  return user;
};

const logError = (error) => {
  const logPath = path.join(__dirname, "../../login_errors.log");
  const timestamp = new Date().toISOString();
  const message = `\n[${timestamp}] ERROR: ${error.message}\nSTACK: ${error.stack}\n`;
  fs.appendFileSync(logPath, message);
};

const jwt = require("jsonwebtoken");

// Initialize Firebase Admin from config
const { auth: firebaseAuth } = require("../config/firebase");

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role, firebaseUid } = req.body;

    console.log("📝 Registration request:", {
      name,
      email,
      phone,
      role,
      hasPassword: !!password,
      firebaseUid,
    });

    if (!email || !email.toString().trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.toString().trim().toLowerCase();

    // Check if user already exists
    let user = await findUserByEmail(cleanEmail);
    if (user) {
      return res.status(400).json({ message: "An account with this email already exists. Please log in." });
    }

    // Clean phone or generate fallback
    let userPhone = (phone || "").toString().trim();
    if (userPhone) {
      const existingPhoneUser = await findUserByPhone(userPhone);
      if (existingPhoneUser) {
        return res.status(400).json({
          message: "This phone number is already registered with another account. Please use a different phone number or log in.",
        });
      }
    } else {
      let attempts = 0;
      do {
        userPhone = `98${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
        const existing = await findUserByPhone(userPhone);
        if (!existing) break;
        attempts++;
      } while (attempts < 5);
    }

    // Hash password if provided
    let hashedPassword = undefined;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Create new user in database
    user = await saveUser({
      name: (name || "").trim() || cleanEmail.split("@")[0],
      email: cleanEmail,
      password: hashedPassword,
      firebaseUid: firebaseUid || undefined,
      phone: userPhone,
      role: role || "customer",
    });

    console.log("✅ User registered successfully:", {
      id: user._id,
      email: user.email,
      role: user.role,
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "agrokart_jwt_secret_production_key_2026",
      { expiresIn: "30d" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);

    // Handle MongoDB duplicate key errors (code 11000)
    if (err.code === 11000 || (err.name === "MongoServerError" && err.code === 11000)) {
      if (err.keyPattern?.phone || (err.message && err.message.includes("phone_1"))) {
        return res.status(400).json({
          message: "This phone number is already registered with another account. Please use a different phone number or log in.",
        });
      }
      if (err.keyPattern?.email || (err.message && err.message.includes("email_1"))) {
        return res.status(400).json({
          message: "An account with this email already exists. Please log in.",
        });
      }
      return res.status(400).json({
        message: "An account with this phone number or email already exists.",
      });
    }

    // Handle Mongoose schema validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: messages.join(", ") || "Validation error",
      });
    }

    res
      .status(500)
      .json({ message: "Server error", error: err.message });
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
          
          // Update role in MongoDB
          const User = require("../models/User");
          await User.updateOne({ email: user.email }, { $set: { role: expectedRole } });
          user.role = expectedRole;
          console.log(`✅ Role updated to '${expectedRole}' in MongoDB`);

          // Update role in Firestore
          const userDocs = await db.collection("users").where("email", "==", user.email).limit(1).get();
          if (!userDocs.empty) {
            await userDocs.docs[0].ref.update({ role: expectedRole });
            console.log(`✅ Role updated to '${expectedRole}' in Firestore`);
          }
        }

        const token = jwt.sign(
          { id: user._id, email: user.email, role: user.role, firebaseUid: user.firebaseUid },
          process.env.JWT_SECRET || "agrokart_jwt_secret_production_key_2026",
          { expiresIn: "30d" }
        );

        return res.json({
          success: true,
          message: "Login successful",
          user: {
            id: user._id,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address,
            vendorProfile: user.vendorProfile,
          },
          token,
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

    // Case 2: Email/Password Login (Standard)
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

    // Check if account has a password
    if (!user.password) {
      return res.status(401).json({
        message: "This account was registered via Google or Firebase. Please sign in with Google.",
      });
    }

    // Verify password against stored bcrypt hash
    const passwordValid = await bcrypt.compare(password || "", user.password);
    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Validate user role if expectedRole is specified (runs only after successful password verification)
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

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "agrokart_jwt_secret_production_key_2026",
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
      token,
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
