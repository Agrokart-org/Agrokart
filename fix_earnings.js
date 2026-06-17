const mongoose = require("mongoose");
const Earnings = require("./server/models/Earnings");
const DeliveryAssignment = require("./server/models/DeliveryAssignment");
require("dotenv").config({ path: "./server/.env" });

const fixEarnings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/agrokart");
    console.log("Connected to DB");

    // Find all earnings that are abnormally high (e.g., > 1000) for delivery
    const abnormalEarnings = await Earnings.find({
      userType: "delivery_partner",
      grossAmount: { $gt: 1000 }
    });

    console.log(`Found ${abnormalEarnings.length} abnormal earnings records`);

    for (const earning of abnormalEarnings) {
      console.log(`Fixing earning ${earning._id} with grossAmount ${earning.grossAmount}`);
      earning.grossAmount = 50; // Reset to base delivery fee
      earning.netAmount = 50;
      await earning.save();
    }

    // Also fix Delivery Assignments
    const abnormalAssignments = await DeliveryAssignment.find({
      deliveryFee: { $gt: 1000 }
    });

    console.log(`Found ${abnormalAssignments.length} abnormal delivery assignments`);

    for (const assignment of abnormalAssignments) {
      console.log(`Fixing assignment ${assignment._id} with fee ${assignment.deliveryFee}`);
      assignment.deliveryFee = 50;
      await assignment.save();
    }

    console.log("Done fixing records");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixEarnings();
