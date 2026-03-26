const axios = require('axios');

async function triggerOrder() {
    try {
        console.log('🚀 Triggering Order via API...');

        const payload = {
            items: [{
                // The exact product ID we synced to vendor inventory
                product: 'e2c0be24560d78c5e599c2a9',
                quantity: 1
            }],
            deliveryAddress: {
                street: 'Test St',
                city: 'Pune',
                state: 'Maharashtra',
                pincode: '411001',
                coordinates: {
                    type: 'Point',
                    coordinates: [73.8567, 18.5204] // Pune
                }
            },
            paymentMethod: 'cod',
            deliverySlot: {
                date: new Date().toISOString(),
                timeSlot: 'morning'
            }
        };

        const res = await axios.post('http://localhost:5000/api/orders', payload, {
            headers: {
                // Use the mock bypass found in auth.js
                'x-auth-token': 'mock-token',
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ ORDER CREATED! Status:', res.status);
        console.log('Response:', JSON.stringify(res.data, null, 2));

    } catch (err) {
        console.error('❌ REQUEST FAILED:', err.message);
        if (err.response) {
            console.error('Data:', err.response.data);
        }
    }
}

triggerOrder();
