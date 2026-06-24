const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });
const User = require("./models/User");

async function checkVendors() {
  await mongoose.connect(process.env.MONGODB_URI);
  const vendors = await User.find({ role: "vendor" });
  for (const v of vendors) {
    console.log(`Vendor: ${v.name} (${v.email}) - ID: ${v._id} - FirebaseUID: ${v.firebaseUid || 'none'}`);
    if (v.address && v.address.coordinates) {
      console.log(`  Coords: ${v.address.coordinates.coordinates}`);
    } else {
      console.log(`  No coordinates.`);
    }
  }
  process.exit(0);
}

checkVendors();
