const mongoose = require('mongoose');
const Order = require('./models/Order');
const DeliveryAssignment = require('./models/DeliveryAssignment');
const Earnings = require('./models/Earnings');

async function fixHugeFees() {
  await mongoose.connect('mongodb://127.0.0.1:27017/agrokart', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log("Connected to MongoDB.");
  
  const assignments = await DeliveryAssignment.find({});
  let fixedAssignments = 0;
  for (let assignment of assignments) {
    let fee = parseFloat(assignment.deliveryFee);
    if (isNaN(fee) || fee > 500) {
      assignment.deliveryFee = 50;
      await assignment.save();
      fixedAssignments++;
    }
  }
  console.log("Fixed Assignments:", fixedAssignments);
  
  const orders = await Order.find({});
  let fixedOrders = 0;
  for (let order of orders) {
    let fee = parseFloat(order.deliveryFee);
    if (isNaN(fee) || fee > 500) {
      order.deliveryFee = 50;
      await order.save();
      fixedOrders++;
    }
  }
  console.log("Fixed Orders:", fixedOrders);

  const earnings = await Earnings.find({});
  let fixedEarnings = 0;
  for (let e of earnings) {
     let changed = false;
     if (parseFloat(e.totalEarnings) > 50000) { e.totalEarnings = 500; changed = true; }
     if (parseFloat(e.monthlyEarnings) > 50000) { e.monthlyEarnings = 500; changed = true; }
     
     if (e.dailyStats && e.dailyStats.length > 0) {
        for (let stat of e.dailyStats) {
            if (parseFloat(stat.earnings) > 5000) { stat.earnings = 50; changed = true; }
        }
     }
     if (changed) { await e.save(); fixedEarnings++; }
  }
  console.log("Fixed Earnings:", fixedEarnings);
  
  process.exit(0);
}

fixHugeFees().catch(console.error);
