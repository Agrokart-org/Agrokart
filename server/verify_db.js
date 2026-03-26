const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const User = require('./src/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/agrokart', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');
    try {
        const vendor = await User.findOne({ email: 'kkvendor@gmail.com' });
        if (!vendor) {
            console.log('❌ Vendor kkvendor@gmail.com NOT FOUND');
        } else {
            console.log(`✅ Vendor Found: ${vendor._id}`);

            const orders = await Order.find({ 'items.vendor': vendor._id });
            console.log(`Found ${orders.length} orders for this vendor.`);

            orders.forEach(o => {
                console.log(`Order ${o._id}: Status=${o.orderStatus}`);
                o.items.forEach(i => console.log(` - Item: ${i.product}, Vendor=${i.vendor}`));
            });

            if (orders.length === 0) {
                // Check if ANY orders exist
                const allOrders = await Order.find({});
                console.log(`Total orders in DB: ${allOrders.length}`);
                allOrders.forEach(o => {
                    console.log(`Dump Order ${o._id}: Items Vendor IDs: ${o.items.map(i => i.vendor).join(', ')}`);
                });
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
});
