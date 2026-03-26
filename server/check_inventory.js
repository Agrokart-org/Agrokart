const mongoose = require('mongoose');
const VendorInventory = require('./src/models/VendorInventory');
const Product = require('./src/models/Product');
const User = require('./src/models/User');
require('dotenv').config();

const checkInventory = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrokart');
        console.log('Connected to MongoDB');

        const vendorEmail = 'kkvendor@gmail.com';
        const productId = '641b9c413b1ac9d343d9f840';

        const vendor = await User.findOne({ email: vendorEmail });
        if (!vendor) {
            console.log('Vendor not found');
            process.exit(1);
        }
        console.log(`Vendor found: ${vendor.email} (${vendor._id})`);

        const product = await Product.findById(productId);
        if (!product) {
            console.log('Product not found in global catalog');
        } else {
            console.log(`Product found: ${product.name} (${product._id})`);
        }

        const inventory = await VendorInventory.findOne({
            vendor: vendor._id,
            product: productId
        });

        if (inventory) {
            console.log('Inventory Record Found:');
            console.log(inventory);
        } else {
            console.log('NO INVENTORY RECORD FOUND for this product and vendor.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkInventory();
