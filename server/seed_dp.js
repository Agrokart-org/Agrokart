const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/agrokart');
  const User = require('./models/User');
  
  let dp = await User.findOne({ role: 'delivery_partner' });
  if (!dp) {
    dp = new User({
      name: 'Dummy Delivery',
      email: 'delivery@agrokart.com',
      phone: '9876543211',
      role: 'delivery_partner',
      firebaseUid: 'dummy_delivery_uid_123'
    });
    await dp.save();
    console.log("Created Delivery Partner:", dp._id);
  } else {
    console.log("Delivery Partner exists:", dp._id);
  }
  
  process.exit(0);
}

test().catch(console.error);
