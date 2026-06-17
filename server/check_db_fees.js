const mongoose = require('mongoose');
const Order = require('./models/Order');
const Delivery = require('./models/Delivery');

async function checkHugeFees() {
  await mongoose.connect('mongodb://127.0.0.1:27017/agrokart', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log("Connected to MongoDB.");
  
  const orders = await Order.find({ deliveryFee: { $gt: 500 } });
  console.log("Orders with deliveryFee > 500:", orders.length);
  
  const deliveries = await Delivery.find({ deliveryFee: { $gt: 500 } });
  console.log("Deliveries with deliveryFee > 500:", deliveries.length);
  
  process.exit(0);
}

checkHugeFees().catch(console.error);
