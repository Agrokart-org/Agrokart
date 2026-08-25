const http = require("http");

function postJson(urlPath, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: "localhost",
      port: 5001,
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

async function verifyFrontendLoginIntegration() {
  console.log("\n=======================================================");
  console.log("VERIFYING FRONTEND LOGIN BACKEND ENDPOINT CONNECTIVITY");
  console.log("=======================================================\n");

  // 1. Valid customer login
  const res1 = await postJson("/api/auth/login", {
    email: "test@example.com",
    password: "password123",
    expectedRole: "customer",
  });
  console.log("1. Valid Customer Login:");
  console.log("   Status:", res1.status);
  console.log("   Message:", res1.body.message);
  console.log("   User Email:", res1.body.user?.email);
  console.log("   User Role:", res1.body.user?.role);
  console.log("   Token received:", !!res1.body.token);

  if (res1.status === 200 && res1.body.user?.role === "customer" && res1.body.token) {
    console.log("   ✓ VALID CUSTOMER LOGIN PASSED");
  } else {
    throw new Error(`Valid customer login failed: ${JSON.stringify(res1.body)}`);
  }

  // 2. Wrong password
  const res2 = await postJson("/api/auth/login", {
    email: "test@example.com",
    password: "wrongpassword",
    expectedRole: "customer",
  });
  console.log("\n2. Invalid Password Login:");
  console.log("   Status:", res2.status);
  console.log("   Message:", res2.body.message);

  if (res2.status === 401 && res2.body.message === "Invalid email or password.") {
    console.log("   ✓ INVALID PASSWORD REJECTION PASSED");
  } else {
    throw new Error(`Invalid password rejection failed: ${JSON.stringify(res2.body)}`);
  }

  console.log("\n=======================================================");
  console.log("🎉 FRONTEND LOGIN INTEGRATION VERIFIED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

verifyFrontendLoginIntegration().catch((err) => {
  console.error(err);
  process.exit(1);
});
