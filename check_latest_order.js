const mongoose = require("mongoose");
require("dotenv").config({ path: "./server/.env" });
const Order = require("./server/models/Order");
const User = require("./server/models/User");

async function checkLatestOrder() {
  await mongoose.connect(process.env.MONGODB_URI);
  const latestOrder = await Order.findOne().sort({ createdAt: -1 }).populate("items.vendor");
  console.log("Latest Order ID:", latestOrder._id);
  console.log("Status:", latestOrder.orderStatus);
  console.log("Tracking Number:", latestOrder.trackingNumber);
  console.log("Assigned Vendor(s):", latestOrder.items.map(i => i.vendor ? `${i.vendor.name} (${i.vendor.email})` : "none"));
  process.exit(0);
}

checkLatestOrder();
