const mongoose = require("mongoose");
const User = require("./models/User"); // Adjust path as needed
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/agrokart";

async function checkPartners() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Find all Delivery Partners
    const partners = await User.find({ role: "delivery_partner" });
    console.log(`\nTotal Delivery Partners: ${partners.length}`);

    partners.forEach((p) => {
      console.log(`\nPartner: ${p.name} (${p._id})`);
      console.log(`  - Is Available: ${p.deliveryProfile?.isAvailable}`);
      console.log(`  - Coordinates: ${JSON.stringify(p.address?.coordinates)}`);
      console.log(`  - Vehicle: ${p.deliveryProfile?.vehicleType}`);
    });

    // 2. Simulate Vendor Query (using a dummy vendor location or the first vendor found)
    const vendor = await User.findOne({
      role: "vendor",
      "address.coordinates": { $exists: true },
    });

    if (!vendor) {
      console.log("\n❌ No Vendor found with coordinates to test proximity.");
      return;
    }

    console.log(`\nTesting Proximity from Vendor: ${vendor.name}`);
    console.log(
      `  - Vendor Coords: ${JSON.stringify(vendor.address.coordinates)}`,
    );
    const [lng, lat] = vendor.address.coordinates.coordinates;

    const nearbyPartners = await User.find({
      role: "delivery_partner",
      "deliveryProfile.isAvailable": true,
      "address.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: 100000, // Increased to 100km for debugging
        },
      },
    });

    console.log(
      `\nFound ${nearbyPartners.length} Available Partners within 100km:`,
    );
    nearbyPartners.forEach((p) => console.log(`  - ${p.name}`));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkPartners();
