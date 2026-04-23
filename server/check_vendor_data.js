const mongoose = require("mongoose");
const User = require("./models/User");

mongoose
  .connect("mongodb://127.0.0.1:27017/agrokart")
  .then(async () => {
    try {
      const vendors = await User.find({ role: "vendor" }).limit(5);
      console.log("--- FOUND VENDORS ---");
      vendors.forEach((v) => {
        console.log(`ID: ${v._id}`);
        console.log(`Firebase UID: ${v.firebaseUid || "N/A"}`);
        console.log(`Email: ${v.email}`);
        console.log(`Coords: ${JSON.stringify(v.address?.coordinates)}`);
        console.log("---");
      });
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
