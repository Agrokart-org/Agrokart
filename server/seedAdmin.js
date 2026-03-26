const mongoose = require('mongoose');
const User = require('./src/models/User'); // Adjust path as needed
require('dotenv').config();

// Configuration
const TARGET_EMAIL = 'admin@agrokart.com'; // User to promote
// If this user doesn't exist, we will create a mock one for testing.

const promoteToAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrokart');
        console.log('Connected to MongoDB');

        let user = await User.findOne({ email: TARGET_EMAIL });

        if (!user) {
            // Check if phone exists (to avoid duplicate error)
            const existingPhone = await User.findOne({ phone: '9999999999' });
            const phone = existingPhone ? `99999${Math.floor(10000 + Math.random() * 90000)}` : '9999999999';

            console.log(`User ${TARGET_EMAIL} not found. Creating a new admin user with phone ${phone}...`);
            user = new User({
                name: 'Super Admin',
                email: TARGET_EMAIL,
                phone: phone,
                role: 'admin',
                firebaseUid: 'admin-mock-uid'
            });
        } else {
            console.log(`User ${TARGET_EMAIL} found. Promoting to admin...`);
            user.role = 'admin';
        }

        await user.save();
        console.log(`✅ Success! User ${TARGET_EMAIL} is now an ADMIN.`);
        console.log('You can now login with this email and access /admin/dashboard');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

promoteToAdmin();
