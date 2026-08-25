require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const http = require("http");
const User = require("../models/User");

// Helper to make HTTP POST requests to running server
function postJson(urlPath, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: "localhost",
      port: 4000,
      path: urlPath,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

async function runAuthTests() {
  console.log("\n=======================================================");
  console.log("TEST: AgroKart Email/Password Authentication Fix");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agrocart";
  await mongoose.connect(mongoUri);

  try {
    const testEmail = "test@example.com";
    const testPassword = "password123";
    const firebaseEmail = "firebase_only@example.com";

    const del = await User.deleteMany({
      $or: [
        { email: { $in: [testEmail, firebaseEmail] } },
        { phone: { $in: ["9999999999", "8888888888"] } },
      ],
    });
    console.log("Deleted old test records:", del.deletedCount);

    // User A: Password-authenticated user
    const uA = await User.create({
      name: "Test Farmer",
      phone: "9999999999",
      email: testEmail,
      password: await bcrypt.hash(testPassword, 10),
      role: "customer",
    });
    console.log("Created User A:", uA.email);

    // User B: Firebase-only user (no password set)
    const uB = await User.create({
      name: "Firebase Farmer",
      phone: "8888888888",
      email: firebaseEmail,
      firebaseUid: "firebase_uid_12345",
      role: "customer",
    });
    console.log("Created User B:", uB.email);

    // ── TEST 1: Correct Credentials ──
    console.log("Running Test 1: Correct credentials (test@example.com / password123)...");
    const res1 = await postJson("/api/auth/login", {
      email: testEmail,
      password: testPassword,
      expectedRole: "customer",
    });

    if (res1.status === 200 && res1.body.message === "Login successful" && res1.body.user) {
      console.log("✓ Test 1 Passed: 200 Login successful with valid credentials.");
    } else {
      throw new Error(`Test 1 Failed: Status ${res1.status}, Body: ${JSON.stringify(res1.body)}`);
    }

    // ── TEST 2: Wrong Password ──
    console.log("\nRunning Test 2: Wrong password (test@example.com / wrongpassword)...");
    const res2 = await postJson("/api/auth/login", {
      email: testEmail,
      password: "wrongpassword",
      expectedRole: "customer",
    });

    if (res2.status === 401 && res2.body.message === "Invalid email or password.") {
      console.log("✓ Test 2 Passed: 401 'Invalid email or password.' on incorrect password.");
    } else {
      throw new Error(`Test 2 Failed: Status ${res2.status}, Body: ${JSON.stringify(res2.body)}`);
    }

    // ── TEST 3: Unknown Email ──
    console.log("\nRunning Test 3: Unknown email (nonexistent@example.com)...");
    const res3 = await postJson("/api/auth/login", {
      email: "nonexistent@example.com",
      password: "password123",
    });

    if (res3.status === 401 && res3.body.message.includes("Invalid credentials")) {
      console.log("✓ Test 3 Passed: 401 Invalid credentials for unknown email.");
    } else {
      throw new Error(`Test 3 Failed: Status ${res3.status}, Body: ${JSON.stringify(res3.body)}`);
    }

    // ── TEST 4: Missing Password ──
    console.log("\nRunning Test 4: Missing password...");
    const res4 = await postJson("/api/auth/login", {
      email: testEmail,
      password: "",
      expectedRole: "customer",
    });

    if (res4.status === 401 && res4.body.message === "Invalid email or password.") {
      console.log("✓ Test 4 Passed: 401 Invalid email or password when password is empty.");
    } else {
      throw new Error(`Test 4 Failed: Status ${res4.status}, Body: ${JSON.stringify(res4.body)}`);
    }

    // ── TEST 5: Firebase Account Password Login Attempt ──
    console.log("\nRunning Test 5: Password login on Firebase-only account...");
    const res5 = await postJson("/api/auth/login", {
      email: firebaseEmail,
      password: "password123",
    });

    if (
      res5.status === 401 &&
      res5.body.message === "This account uses Firebase authentication. Please sign in with Firebase."
    ) {
      console.log("✓ Test 5 Passed: 401 Notice returned for accounts without passwords.");
    } else {
      throw new Error(`Test 5 Failed: Status ${res5.status}, Body: ${JSON.stringify(res5.body)}`);
    }

    console.log("\n🎉 ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY!\n");
  } catch (err) {
    console.error("\n❌ AUTH TEST FAILED:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runAuthTests();
