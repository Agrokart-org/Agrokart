const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/agrokart');
  const User = require('./models/User');
  require('./models/Order');
  
  const vendor = await User.findOne({ role: 'vendor' });
  if (!vendor) {
    console.log("No vendor found!");
    process.exit(1);
  }
  
  const token = 'vendor-jwt-token';
  
  console.log("Got token for vendor:", vendor.name);
  
  const axios = require('axios');
  try {
    const res = await axios.get('http://localhost:5000/api/vendor/orders', {
      headers: { 'x-auth-token': token }
    });
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.log('Error status:', err.response.status);
      console.log('Error Data:', err.response.data);
    } else {
      console.log('Error:', err.message);
    }
  }

  process.exit(0);
}

test().catch(console.error);
