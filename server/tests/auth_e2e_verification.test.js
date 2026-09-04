require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const http = require("http");
const User = require("../models/User");

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

async function runAuthE2ETests() {
  console.log("\n=======================================================");
  console.log("TEST: Complete Authentication E2E Verification");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agrocart";
  await mongoose.connect(mongoUri);

  try {
    const testEmail = "test@example.com";
    const testPassword = "password123";

    // Ensure test user exists
    let user = await User.findOne({ email: testEmail });
    if (!user) {
      user = await User.create({
        name: "Test Farmer",
        phone: "9999999999",
        email: testEmail,
        password: await bcrypt.hash(testPassword, 10),
        role: "customer",
      });
      console.log("✓ Test customer user created.");
    } else {
      user.password = await bcrypt.hash(testPassword, 10);
      user.role = "customer";
      await user.save();
      console.log("✓ Test customer user verified/updated.");
    }

    // Check existing vendor account (do not delete or recreate)
    const vendorAccount = await User.findOne({ email: "vendor_test@agrokart.com" });
    if (vendorAccount) {
      console.log("✓ Existing account vendor_test@agrokart.com verified intact in database.");
    } else {
      console.log("ℹ Note: vendor_test@agrokart.com not currently in DB (preserving DB state without running destructive seed.js).");
    }

    // ── 1. Valid Customer Login ──
    console.log("\n1. Testing Valid Customer Login...");
    const res1 = await postJson("/api/auth/login", {
      email: testEmail,
      password: testPassword,
      expectedRole: "customer",
    });

    if (
      res1.status === 200 &&
      res1.body.message === "Login successful" &&
      res1.body.user &&
      res1.body.user.role === "customer" &&
      !res1.body.user.password
    ) {
      console.log("✓ PASS: Valid customer login returned HTTP 200, role = customer, password omitted.");
    } else {
      throw new Error(`FAIL: Valid Customer Login returned Status ${res1.status}, Body: ${JSON.stringify(res1.body)}`);
    }

    // ── 2. Wrong Password ──
    console.log("\n2. Testing Wrong Password...");
    const res2 = await postJson("/api/auth/login", {
      email: testEmail,
      password: "wrongpassword",
      expectedRole: "customer",
    });

    if (res2.status === 401 && res2.body.message === "Invalid email or password.") {
      console.log("✓ PASS: Wrong password returned HTTP 401 'Invalid email or password.'");
    } else {
      throw new Error(`FAIL: Wrong Password returned Status ${res2.status}, Body: ${JSON.stringify(res2.body)}`);
    }

    // ── 3. Unknown Email ──
    console.log("\n3. Testing Unknown Email...");
    const res3 = await postJson("/api/auth/login", {
      email: "nonexistent_user_999@example.com",
      password: "password123",
    });

    if (res3.status === 401 && res3.body.message.includes("Invalid credentials")) {
      console.log("✓ PASS: Unknown email returned HTTP 401 'Invalid credentials.'");
    } else {
      throw new Error(`FAIL: Unknown Email returned Status ${res3.status}, Body: ${JSON.stringify(res3.body)}`);
    }

    // ── 4. Missing Email ──
    console.log("\n4. Testing Missing Email...");
    const res4 = await postJson("/api/auth/login", {
      email: "",
      password: "password123",
    });

    if (res4.status === 400 && res4.body.message === "Email is required") {
      console.log("✓ PASS: Missing email returned HTTP 400 'Email is required'");
    } else {
      throw new Error(`FAIL: Missing Email returned Status ${res4.status}, Body: ${JSON.stringify(res4.body)}`);
    }

    // ── 5. Missing Password ──
    console.log("\n5. Testing Missing Password...");
    const res5 = await postJson("/api/auth/login", {
      email: testEmail,
      password: "",
      expectedRole: "customer",
    });

    if (res5.status === 401 && res5.body.message === "Invalid email or password.") {
      console.log("✓ PASS: Missing password returned HTTP 401 'Invalid email or password.'");
    } else {
      throw new Error(`FAIL: Missing Password returned Status ${res5.status}, Body: ${JSON.stringify(res5.body)}`);
    }

    // ── 6. Role Mismatch ──
    console.log("\n6. Testing Role Mismatch (Customer requesting 'vendor')...");
    const res6 = await postJson("/api/auth/login", {
      email: testEmail,
      password: testPassword,
      expectedRole: "vendor",
    });

    if (res6.status === 403 && res6.body.message.includes("Access denied")) {
      console.log("✓ PASS: Role mismatch returned HTTP 403 'Access denied.'");
    } else {
      throw new Error(`FAIL: Role Mismatch returned Status ${res6.status}, Body: ${JSON.stringify(res6.body)}`);
    }

    console.log("\n=======================================================");
    console.log("🎉 ALL E2E AUTHENTICATION BACKEND TESTS PASSED!");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("\n❌ E2E AUTH TEST FAILED:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runAuthE2ETests();
