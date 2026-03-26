const mongoose = require("mongoose");
const VendorInventory = require("./models/VendorInventory");
// We need to register Product model if it's referenced in populate (even if not used explicitly here, good practice)
require("./models/Product");

mongoose
  .connect("mongodb://127.0.0.1:27017/agrokart")
  .then(async () => {
    try {
      const vendorId = "69835bd3c3c5d217d4e9613c"; // The vendor we found earlier
      console.log(`Checking inventory for vendor: ${vendorId}`);

      const inventory = await VendorInventory.find({
        vendor: vendorId,
      }).populate("product");

      if (inventory.length === 0) {
        console.log("No inventory found for this vendor.");
      } else {
        console.log(`Found ${inventory.length} items in inventory.`);
        inventory.forEach((item) => {
          const productName = item.product
            ? item.product.name
            : "Unknown Product";
          console.log(
            `- Product: ${productName} | Stock: ${item.availableStock} | Active: ${item.isActive}`,
          );
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error("Connection error:", err);
    process.exit(1);
  });
