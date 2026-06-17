const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/agrokart').then(async () => {
  const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
  const orders = await Order.find({totalAmount: { $gt: 100000 }});
  console.log(orders.map(o => ({id: o._id, total: o.totalAmount, items: o.items})));
  process.exit(0);
});
