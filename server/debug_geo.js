const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/agrokart').then(async () => {
    const User = require('./src/models/User');

    console.log('=== Testing Exact Orders.js Logic ===\n');

    // Step 1: Check if vendors exist without geo query
    const allVendors = await User.find({ role: 'vendor' });
    console.log('1. Vendors with role=vendor:', allVendors.length);

    // Step 2: Try simple geo query
    const coords = [73.8090460746446, 18.48499481175644];
    console.log('2. Customer coords:', coords);

    // Step 3: Check if User model is same
    console.log('3. User model name:', User.modelName);

    // Step 4: Try the exact query from orders.js
    const vendors = await User.find({
        role: 'vendor',
        'address.coordinates': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coords
                },
                $maxDistance: 15000
            }
        }
    });

    console.log('4. Geo query found:', vendors.length, 'vendors');

    if (vendors.length > 0) {
        console.log('   First vendor:', vendors[0].email);
    }

    // Step 5: Check what happens if we query differently
    const vendorsNear = await User.find({ role: 'vendor' }).where('address.coordinates').near({
        center: { type: 'Point', coordinates: coords },
        maxDistance: 15000
    });
    console.log('5. Alternative query found:', vendorsNear.length, 'vendors');

    mongoose.disconnect();
    process.exit(0);
}).catch(e => {
    console.log('Error:', e.message);
    process.exit(1);
});
