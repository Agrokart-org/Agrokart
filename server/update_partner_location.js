const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/agrokart";

async function updatePartnerLocation() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Get Vendor Location
    const vendor = await User.findOne({
      role: "vendor",
      "address.coordinates": { $exists: true },
    });
    if (!vendor) {
      console.log("❌ No Vendor found.");
      return;
    }
    const [lng, lat] = vendor.address.coordinates.coordinates;
    console.log(`Vendor Location: [${lng}, ${lat}]`);

    // 2. Find Delivery Partner
    const partner = await User.findOne({ role: "delivery_partner" });
    if (!partner) {
      console.log("❌ No Delivery Partner found.");
      return;
    }

    console.log(`Updating Partner ${partner.name}...`);

    // 3. Update Partner Location to be very close (same spot for test)
    partner.address = {
      street: "Test Street, Near Vendor",
      city: "Pune",
      state: "MH",
      zipCode: "411001",
      country: "India",
      coordinates: {
        type: "Point",
        coordinates: [lng, lat], // Exact match for testing
      },
    };
    partner.deliveryProfile.isAvailable = true; // Ensure they are online

    await partner.save();
    console.log("✅ Partner location updated successfully!");
    console.log(
      `New Coordinates: ${JSON.stringify(partner.address.coordinates)}`,
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

updatePartnerLocation();
