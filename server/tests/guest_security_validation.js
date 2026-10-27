const http = require("http");
const app = require("../app");

async function runSecurityValidation() {
  console.log("\n=======================================================");
  console.log("TEST: Guest Demo Backend Security & Authorization Checks");
  console.log("=======================================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  function makeRequest(method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const reqHeaders = {
        "Content-Type": "application/json",
        ...headers,
      };
      if (payload) {
        reqHeaders["Content-Length"] = Buffer.byteLength(payload);
      }

      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: port,
          path: path,
          method: method,
          headers: reqHeaders,
        },
        (res) => {
          let resBody = "";
          res.on("data", (chunk) => (resBody += chunk));
          res.on("end", () => {
            let parsed;
            try {
              parsed = JSON.parse(resBody);
            } catch (_) {
              parsed = resBody;
            }
            resolve({ status: res.statusCode, body: parsed });
          });
        }
      );
      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  let passed = 0;
  let failed = 0;

  function assert(description, condition) {
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failed++;
    }
  }

  try {
    // 1. Health check is accessible
    const health = await makeRequest("GET", "/api/health");
    assert("Health check is public (200 OK)", health.status === 200 && health.body.success === true);

    // 2. Order creation without token is blocked
    const orderNoToken = await makeRequest("POST", "/api/orders", {}, { items: [{ product: "123", quantity: 1 }] });
    assert("POST /api/orders without token returns 401", orderNoToken.status === 401);

    // 3. Order creation with fake guest token is blocked
    const orderGuestToken = await makeRequest(
      "POST",
      "/api/orders",
      { "x-auth-token": "guest-demo-token" },
      { items: [{ product: "123", quantity: 1 }] }
    );
    assert("POST /api/orders with fake guest token returns 401", orderGuestToken.status === 401);

    // 4. Payment create-order without token is blocked
    const paymentNoToken = await makeRequest("POST", "/api/payment/create-order", {}, { amount: 500 });
    assert("POST /api/payment/create-order without token returns 401", paymentNoToken.status === 401);

    // 5. Payment create-order with fake guest token is blocked
    const paymentGuestToken = await makeRequest(
      "POST",
      "/api/payment/create-order",
      { "x-auth-token": "guest-demo-token" },
      { amount: 500 }
    );
    assert("POST /api/payment/create-order with fake guest token returns 401", paymentGuestToken.status === 401);

    // 6. Payment verify-payment without token is blocked
    const verifyNoToken = await makeRequest("POST", "/api/payment/verify-payment", {}, {
      razorpay_order_id: "order_123",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "sig_123",
    });
    assert("POST /api/payment/verify-payment without token returns 401", verifyNoToken.status === 401);

    // 7. Vendor orders endpoint without token is blocked
    const vendorNoToken = await makeRequest("GET", "/api/vendor/orders", {});
    assert("GET /api/vendor/orders without token returns 401", vendorNoToken.status === 401);

    // 8. Delivery assignments endpoint without token is blocked
    const deliveryNoToken = await makeRequest("GET", "/api/delivery/assignments/available", {});
    assert("GET /api/delivery/assignments/available without token returns 401", deliveryNoToken.status === 401);

    console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  } finally {
    server.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityValidation().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
