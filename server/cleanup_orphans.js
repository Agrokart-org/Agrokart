require("dotenv").config();
const mongoose = require("mongoose");
const DeliveryAssignment = require("./models/DeliveryAssignment");
const Order = require("./models/Order");

async function cleanupOrphans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all assignments
    const assignments = await DeliveryAssignment.find();
    let deletedCount = 0;

    for (const assignment of assignments) {
      // Check if order exists
      const orderExists = await Order.findById(assignment.order);
      if (!orderExists) {
        await DeliveryAssignment.findByIdAndDelete(assignment._id);
        console.log(`Deleted orphaned assignment ${assignment._id} for non-existent order ${assignment.order}`);
        deletedCount++;
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} orphaned assignments.`);
  } catch (err) {
    console.error("Error during cleanup:", err);
  } finally {
    process.exit(0);
  }
}

cleanupOrphans();
