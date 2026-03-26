const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const checkVendorLocation = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agrokart');
        console.log('Connected to MongoDB');

        // Find the vendor (using the ID from the logs if possible, or just the first vendor)
        // Log ID: Q2W2Y72X8zWc8MZV0tbFZNbavQD2 (This looks like a Firebase UID, but MongoDB uses _id)
        // We'll search by role 'vendor'
        const vendors = await User.find({ role: 'vendor' });

        console.log(`Found ${vendors.length} vendors.`);
        vendors.forEach(v => {
            console.log(`Vendor: ${v.name} (${v.email})`);
            console.log(`  ID: ${v._id}`);
            console.log(`  Firebase UID: ${v.id}`); // Assuming 'id' field stores firebase uid or similar
            console.log(`  Address:`, v.address);
            console.log(`  Coordinates:`, v.address?.coordinates);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkVendorLocation();
