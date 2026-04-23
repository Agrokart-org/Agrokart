require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
const Product = require('./models/Product'); // Ensure it's registered

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  const vendor = await User.findOne({ role: 'vendor' });
  if (!vendor) {
    console.log("No vendor found");
    process.exit(1);
  }

  try {
    let query = { "items.vendor": vendor._id };
    
    console.log("Query:", JSON.stringify(query));
    const orders = await Order.find(query)
      .populate("user", "name phone address")
      .populate("items.product", "name price images unit category")
      .populate("deliveryPartner", "name phone")
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(20);
      
    console.log(`Successfully fetched ${orders.length} orders.`);
  } catch (err) {
    console.error("Crash during fetch:", err.message);
  }
  process.exit(0);
}

debug();
