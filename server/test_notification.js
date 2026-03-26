const axios = require('axios');

async function testOrder() {
    try {
        console.log('🔄 Starting Automated Order Test...');

        // 1. Login as Customer
        // Note: Using a bypass endpoint or assuming we can use a hardcoded token if available, 
        // but better to just hit the endpoint if we have a way.
        // Actually, since I have DB access, I can just 'act' as the user in the backend 
        // without needing a real Firebase token if I run this code WITHIN the backend context.
        // BUT, to test the API route, I need a token. 

        // Alternative: I can write a script that imports the 'app' and calls the controller function directly, mocking the request.
        // This avoids network/auth issues.

        const mongoose = require('mongoose');
        const { createOrder } = require('./src/controllers/orderController');
        const User = require('./src/models/User');
        const Product = require('./src/models/Product');

        await mongoose.connect('mongodb://127.0.0.1:27017/agrokart');
        console.log('✅ DB Connected');

        const customer = await User.findOne({ email: 'testcustomer@gmail.com' });
        // Use the ID we know works
        const productId = 'e2c0be24560d78c5e599c2a9';

        if (!customer) {
            console.error('❌ Test customer not found');
            process.exit(1);
        }

        // Mock Request Object
        const req = {
            user: customer,
            body: {
                items: [{
                    product: productId,
                    quantity: 1
                }],
                deliveryAddress: {
                    street: 'Automated Test St',
                    city: 'Pune',
                    state: 'Maharashtra',
                    pincode: '411001',
                    coordinates: {
                        type: 'Point',
                        coordinates: [73.8567, 18.5204] // Exact Pune coords
                    }
                },
                paymentMethod: 'cod',
                deliverySlot: {
                    date: new Date().toISOString(),
                    timeSlot: 'morning'
                }
            }
        };

        // Mock Response Object
        const res = {
            status: (code) => ({
                json: (data) => {
                    console.log(`✅ RESPONSE STATUS: ${code}`);
                    console.log('✅ RESPONSE DATA:', JSON.stringify(data, null, 2));
                }
            })
        };

        // Call Controller Directly
        console.log('🚀 Invoking createOrder controller...');
        await createOrder(req, res);

        console.log('🏁 Test Complete. Check server logs for notification events.');

        // Wait a bit for async operations in controller
        setTimeout(() => {
            mongoose.disconnect();
            process.exit(0);
        }, 3000);

    } catch (error) {
        console.error('❌ TEST FAILED:', error);
        process.exit(1);
    }
}

testOrder();
