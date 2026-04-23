const mongoose = require("mongoose");
const User = require("./models/User");
const Product = require("./models/Product");
const VendorInventory = require("./models/VendorInventory");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/agrokart";

async function checkVendorStatus() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Find the Vendor
    const vendor = await User.findOne({ role: "vendor" });
    if (!vendor) {
      console.log("❌ No Vendor found.");
      return;
    }
    console.log(`\nVendor: ${vendor.name} (${vendor._id})`);
    console.log(`Address: ${JSON.stringify(vendor.address)}`);

    // 2. Find a Product (any product)
    const product = await Product.findOne();
    if (!product) {
      console.log("❌ No Products found.");
      return;
    }
    console.log(`\nProduct: ${product.name} (${product._id})`);

    // 3. Check Geo Query Simulation (Vendor vs Self)
    const [lng, lat] = vendor.address.coordinates.coordinates;
    console.log(`\nSimulating Geo Query at [${lng}, ${lat}]...`);

    const nearbyVendors = await User.find({
      role: "vendor",
      "address.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: 15000, // 15km
        },
      },
    });
    console.log(`Geo Query Found: ${nearbyVendors.length} vendors.`);
    const isVendorFound = nearbyVendors.some((v) => v._id.equals(vendor._id));
    console.log(
      `Is our vendor in results? ${isVendorFound ? "✅ YES" : "❌ NO"}`,
    );

    // 4. Check Inventory
    console.log(
      `\nChecking Inventory for Vendor ${vendor._id} and Product ${product._id}...`,
    );
    const inventory = await VendorInventory.findOne({
      vendor: vendor._id,
      product: product._id,
    });

    if (inventory) {
      console.log("✅ Inventory Record Found:");
      console.log(inventory);
      if (inventory.availableStock > 0 && inventory.isActive) {
        console.log(
          "✅ Stock is Available and Active. Notification SHOULD send.",
        );
      } else {
        console.log("❌ Stock is 0 or Inactive. Notification will NOT send.");
      }
    } else {
      console.log(
        "❌ No Inventory Record Found. Vendor has not added this product.",
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkVendorStatus();
