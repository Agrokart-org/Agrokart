const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('../models/Order');
const User = require('../models/User');

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // List all vendors
  const vendors = await User.find({ role: 'vendor' }).select('_id email name').lean();
  console.log('=== ALL VENDORS ===');
  vendors.forEach(v => console.log(`  ${v._id} - ${v.email} (${v.name})`));

  // List recent orders with their vendor assignments
  const orders = await Order.find({})
    .select('orderStatus items.vendor trackingNumber createdAt')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  
  console.log('\n=== RECENT 10 ORDERS ===');
  orders.forEach(o => {
    const vIds = o.items.map(i => i.vendor ? i.vendor.toString() : 'NO_VENDOR');
    console.log(`  ${o.trackingNumber || o._id}: status=${o.orderStatus}, item_vendors=[${vIds.join(', ')}]`);
  });

  // Cross-check: For each vendor, how many orders have their ID in items.vendor?
  console.log('\n=== ORDERS PER VENDOR ===');
  for (const v of vendors) {
    const count = await Order.countDocuments({ 'items.vendor': v._id });
    console.log(`  ${v.email} (${v._id}): ${count} orders`);
  }

  await mongoose.disconnect();
}

debug().catch(e => { console.error(e); process.exit(1); });
