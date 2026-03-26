const mongoose = require('mongoose');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const VendorInventory = require('./src/models/VendorInventory');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/agrokart', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');

    try {
        // 1. Create a Vendor
        const hashedPw = await bcrypt.hash('password123', 10);
        let vendor = await User.findOne({ email: 'kkvendor@gmail.com' });

        if (!vendor) {
            vendor = new User({
                name: 'K K Vendor',
                email: 'kkvendor@gmail.com',
                password: hashedPw,
                role: 'vendor',
                phone: '9876543210',
                vendorProfile: {
                    businessName: 'KK Agro Shop',
                    businessType: 'general_agriculture',
                    isVerified: true,
                    rating: { average: 4.5, count: 10 }
                },
                address: {
                    street: 'Main Market',
                    city: 'Pune',
                    state: 'Maharashtra',
                    coordinates: { type: 'Point', coordinates: [73.8567, 18.5204] }
                }
            });
            await vendor.save();
            console.log('Vendor created:', vendor._id);
        } else {
            console.log('Vendor already exists:', vendor._id);
        }

        // 2. Create a Product
        let product = await Product.findOne({ name: 'Test Urea' });
        if (!product) {
            product = new Product({
                name: 'Test Urea',
                description: 'High quality urea fertilizer',
                price: 500,
                category: 'urea',
                brand: 'AgroBrand',
                unit: 'kg',
                images: ['https://via.placeholder.com/150'],
                image: 'https://via.placeholder.com/150',
                stock: 100
            });
            await product.save();
            console.log('Product created:', product._id);
        }

        // 3. Create Orders linked to Vendor
        const order1 = new Order({
            user: vendor._id, // Self-order for simplicity or create another user
            items: [{
                product: product._id,
                quantity: 2,
                price: 500,
                vendor: vendor._id, // LINK TO VENDOR
                status: 'pending'
            }],
            totalAmount: 1000,
            deliveryAddress: {
                street: 'Test Street',
                city: 'Pune',
                state: 'Maharashtra',
                pincode: '411001',
                coordinates: { type: 'Point', coordinates: [73.8567, 18.5204] }
            },
            deliverySlot: {
                date: new Date(),
                timeSlot: 'morning'
            },
            paymentMethod: 'cod',
            orderStatus: 'pending',
            trackingNumber: 'ORD-' + Date.now()
        });
        await order1.save();
        console.log('Created Pending Order:', order1._id);

        const order2 = new Order({
            user: vendor._id,
            items: [{
                product: product._id,
                quantity: 1,
                price: 500,
                vendor: vendor._id,
                status: 'confirmed'
            }],
            totalAmount: 500,
            deliveryAddress: {
                street: 'Test St',
                city: 'Pune',
                coordinates: { type: 'Point', coordinates: [73.8567, 18.5204] }
            },
            deliverySlot: {
                date: new Date(),
                timeSlot: 'afternoon'
            },
            paymentMethod: 'upi',
            orderStatus: 'confirmed', // Accepted order
            trackingNumber: 'ORD-' + (Date.now() + 1)
        });
        await order2.save();
        console.log('Created Confirmed Order:', order2._id);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}).catch(err => console.error('Connection error:', err));
