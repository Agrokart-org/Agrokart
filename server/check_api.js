const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/agrokart');
  const User = require('./models/User');
  require('./models/Order');
  require('./models/DeliveryAssignment');
  
  const dp = await User.findOne({ role: 'delivery_partner' });
  if (!dp) {
    console.log("No delivery partner found!");
    process.exit(1);
  }
  
  const token = 'delivery-jwt-token';
  
  console.log("Got token for dp:", dp.name);
  
  const axios = require('axios');
  try {
    const res = await axios.get('http://localhost:5000/api/delivery/assignments/available', {
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
