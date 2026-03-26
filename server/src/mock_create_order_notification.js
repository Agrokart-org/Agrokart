const io = require("socket.io-client");
const axios = require("axios");
const mongoose = require("mongoose");
const User = require("./models/User");
const Product = require("./models/Product");
const VendorInventory = require("./models/VendorInventory");

const API_URL = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

// Vendor ID we verified earlier
const VENDOR_ID = "69835bd3c3c5d217d4e9613c";

async function runSubscriptionTest() {
  console.log("1. Connecting to MongoDB...");
  await mongoose.connect("mongodb://127.0.0.1:27017/agrokart");

  // 2. Find a product in this vendor's inventory
  const inventoryItem = await VendorInventory.findOne({
    vendor: VENDOR_ID,
    availableStock: { $gt: 0 },
  });
  if (!inventoryItem) {
    console.error("❌ Vendor has no stock!");
    process.exit(1);
  }
  const productId = inventoryItem.product;
  console.log(`✅ Found product in stock: ${productId}`);

  // 3. Login as a Customer (to place order)
  // We'll just pick the first user or create a temp one. simpler to just "register" a temp user or login if we know one.
  // Let's try to login with a known user or create one.
  let customerToken;
  try {
    const email = `testcust_${Date.now()}@example.com`;
    const password = "password123";
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Customer",
      email,
      password,
      phone: `999${Date.now().toString().slice(-7)}`, // Generate random phone
      role: "customer",
    });
    customerToken = registerRes.data.token;
    console.log("✅ Created test customer & got token");
  } catch (err) {
    console.error(
      "❌ Failed to create/login customer:",
      err.response ? JSON.stringify(err.response.data, null, 2) : err.message,
    );
    process.exit(1);
  }

  // 4. Connect Socket as Vendor
  console.log("4. Connecting Socket as Vendor...");
  const socket = io(SOCKET_URL);

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    console.log(`➡️ Joining room: vendor_${VENDOR_ID}`);
    socket.emit("join_vendor_room", VENDOR_ID);
  });

  // 5. Setup Listener
  const notificationPromise = new Promise((resolve, reject) => {
    socket.on("new_order_available", (data) => {
      console.log("🎉🎉🎉 SUCCESS! Received Notification:", data);
      resolve(data);
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      reject(new Error("Timeout waiting for notification"));
    }, 15000);
  });

  // 6. Place Order
  console.log("6. Placing Order...");
  try {
    const orderData = {
      items: [{ product: productId, quantity: 1 }],
      deliveryAddress: {
        street: "123 Main St",
        city: "Pune",
        state: "MH",
        pincode: "411001",
        coordinates: {
          type: "Point",
          coordinates: [73.8567, 18.5204], // Matches vendor location
        },
      },
      deliverySlot: {
        date: new Date().toISOString(),
        timeSlot: "morning",
      },
      paymentMethod: "cod",
    };

    const orderRes = await axios.post(`${API_URL}/orders`, orderData, {
      headers: { "x-auth-token": customerToken },
    });
    console.log("✅ Order placed:", orderRes.data.order.trackingNumber); // Assuming backend returns trackingNumber in order object
  } catch (err) {
    console.error("❌ Failed to place order:", err.message);
    if (err.response) {
      console.error("Response Status:", err.response.status);
      console.error("Response Data:", err.response.data);
    }
    process.exit(1);
  }

  // 7. Wait for notification
  try {
    await notificationPromise;
    console.log("✅ Validation passed!");
  } catch (err) {
    console.error("❌ Validation failed:", err.message);
  } finally {
    socket.disconnect();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runSubscriptionTest();
