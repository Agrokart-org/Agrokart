const mongoose = require('mongoose');
const VendorInventory = require('./src/models/VendorInventory');
const Product = require('./src/models/Product');
const User = require('./src/models/User');
require('dotenv').config();

const populateInventory = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrokart');
        console.log('Connected to MongoDB');

        const vendorEmail = 'kkvendor@gmail.com';
        const vendor = await User.findOne({ email: vendorEmail });

        if (!vendor) {
            console.log('Vendor not found');
            process.exit(1);
        }
        console.log(`Target Vendor: ${vendor.email}`);

        // Get all global products
        const allProducts = await Product.find({});
        console.log(`Found ${allProducts.length} products in global catalog.`);

        let addedCount = 0;
        let updatedCount = 0;

        for (const product of allProducts) {
            let inventory = await VendorInventory.findOne({
                vendor: vendor._id,
                product: product._id
            });

            if (inventory) {
                // Update existing inventory to ensure it has stock
                if (inventory.stock < 10) {
                    inventory.stock = 100;
                    inventory.availableStock = 100; // Legacy field just in case
                    inventory.isActive = true;
                    await inventory.save();
                    console.log(`Updated stock for: ${product.name}`);
                    updatedCount++;
                }
            } else {
                // Create new inventory
                inventory = new VendorInventory({
                    vendor: vendor._id,
                    product: product._id,
                    stock: 50,
                    costPrice: product.price * 0.8, // 20% margin assumed
                    sellingPrice: product.price,
                    discountPercentage: 0,
                    isActive: true
                });
                await inventory.save();
                console.log(`Added to inventory: ${product.name}`);
                addedCount++;
            }
        }

        console.log('-----------------------------------');
        console.log(`Operation Complete.`);
        console.log(`Added: ${addedCount}`);
        console.log(`Updated: ${updatedCount}`);
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

populateInventory();
