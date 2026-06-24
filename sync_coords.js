const mongoose = require("mongoose");
require("dotenv").config({ path: "./server/.env" });
const User = require("./server/models/User");

async function syncCoordinates() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // 1. Get the newly registered customer (the one most recently created)
  const customer = await User.findOne({ role: "customer" }).sort({ _id: -1 });
  if (!customer || !customer.address || !customer.address.coordinates) {
    console.log("Could not find new customer or coordinates.");
    process.exit(1);
  }

  const customerCoords = customer.address.coordinates.coordinates;
  console.log(`Found newest customer ${customer.email} at coordinates:`, customerCoords);

  // 2. Update Jack and kkpartner to these EXACT coordinates
  await User.updateMany(
    { email: { $in: ["jack@gmail.com", "kkpartner@agmail.com"] } },
    {
      $set: {
        "address.coordinates.coordinates": customerCoords,
        "address.coordinates.type": "Point"
      }
    }
  );

  console.log(`Successfully synced Jack and kkpartner to exactly match the customer's coordinates.`);
  process.exit(0);
}

syncCoordinates();
