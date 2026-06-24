const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");

async function syncCoordinates() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // 1. Get the newest customer (the one most recently created who has coordinates)
  const customers = await User.find({ role: "customer", "address.coordinates.coordinates": { $exists: true } }).sort({ _id: -1 }).limit(1);
  if (customers.length === 0) {
    console.log("No customers with coordinates found.");
    process.exit(1);
  }

  const customer = customers[0];
  const customerCoords = customer.address.coordinates.coordinates;
  console.log(`Found newest customer ${customer.email} at coordinates:`, customerCoords);

  if (customerCoords[0] === 0 && customerCoords[1] === 0) {
     console.log("Customer coordinates are 0,0. They didn't send real GPS either!");
  }

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

  console.log(`Successfully synced Jack and kkpartner to match customer's coordinates.`);
  process.exit(0);
}

syncCoordinates();
