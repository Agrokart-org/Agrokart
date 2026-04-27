const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function checkVendorCoords() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const vendors = await User.find({ role: 'vendor' }).select('_id email name address').lean();
  vendors.forEach(v => {
    console.log(`\nVendor: ${v.name} (${v.email})`);
    console.log(`  ID: ${v._id}`);
    console.log(`  Address:`, JSON.stringify(v.address, null, 2));
  });

  await mongoose.disconnect();
}

checkVendorCoords().catch(e => { console.error(e); process.exit(1); });
