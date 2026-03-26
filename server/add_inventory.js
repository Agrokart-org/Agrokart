const mongoose = require('mongoose');
const VendorInventory = require('./src/models/VendorInventory');
const User = require('./src/models/User'); // Import User model
require('dotenv').config();

const addInventory = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrokart');
        console.log('Connected to MongoDB');

        const vendorEmail = 'kkvendor@gmail.com';
        // Using the first valid product found: Urea Nitrogen
        const productId = '69835c1edf58249beb789e53';

        const vendor = await User.findOne({ email: vendorEmail });
        if (!vendor) {
            console.log('Vendor not found');
            process.exit(1);
        }

        // Check if inventory exists
        let inventory = await VendorInventory.findOne({
            vendor: vendor._id,
            product: productId
        });

        if (inventory) {
            console.log('Inventory already exists. Updating stock...');
            inventory.stock = 100;
            inventory.costPrice = 200;
            inventory.sellingPrice = 266.5;
            inventory.isActive = true;
            await inventory.save();
        } else {
            console.log('Creating new inventory record...');
            inventory = new VendorInventory({
                vendor: vendor._id,
                product: productId,
                stock: 100,         // Required
                costPrice: 200,     // Required
                sellingPrice: 266.5,// Required
                isActive: true
            });
            await inventory.save();
        }

        console.log('✅ Inventory updated successfully for product:', productId);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

addInventory();
