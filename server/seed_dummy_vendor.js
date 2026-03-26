const mongoose = require('mongoose');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const VendorInventory = require('./src/models/VendorInventory');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrokart';

const seedVendor = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check if our target vendor exists
        let vendor = await User.findOne({ email: 'dummyvendor@agrokart.com' });

        if (!vendor) {
            console.log('Vendor not found, creating a new dummy vendor...');
            vendor = new User({
                name: 'Dummy Vendor',
                email: 'dummyvendor@agrokart.com',
                phone: '9876543210',
                role: 'vendor',
                address: {
                    street: '123 Vendor Market',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001',
                    coordinates: {
                        type: 'Point',
                        coordinates: [72.8777, 19.0760] // Mumbai coordinates
                    }
                },
                vendorProfile: {
                    businessName: 'Agrokart Central Store',
                    businessType: 'general_agriculture',
                    isVerified: true,
                    verificationStatus: 'verified',
                    commissionRate: 10
                },
                isVerified: true
            });

            await vendor.save();
            console.log(`✅ Created dummy vendor: ${vendor.email}`);
        } else {
            console.log(`✅ Found existing dummy vendor: ${vendor.email}`);
        }

        // Get all products
        const products = await Product.find({});
        console.log(`Found ${products.length} products to add to vendor inventory.`);

        let added = 0;
        let updated = 0;

        for (const product of products) {
            let inventory = await VendorInventory.findOne({
                vendor: vendor._id,
                product: product._id
            });

            if (inventory) {
                inventory.stock = 100;
                inventory.availableStock = 100;
                inventory.isActive = true;
                await inventory.save();
                updated++;
            } else {
                inventory = new VendorInventory({
                    vendor: vendor._id,
                    product: product._id,
                    stock: 100,
                    availableStock: 100,
                    costPrice: product.price * 0.8,
                    sellingPrice: product.price,
                    discountPercentage: 0,
                    isActive: true
                });
                await inventory.save();
                added++;
            }
        }

        console.log(`✅ Inventory population complete. Added: ${added}, Updated: ${updated}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during vendor seeding:', error);
        process.exit(1);
    }
};

seedVendor();
