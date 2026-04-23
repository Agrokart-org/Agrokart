const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testHttp() {
  await mongoose.connect(process.env.MONGODB_URI);
  const vendor = await User.findOne({ role: 'vendor' });
  
  // Login directly
  const loginRes = await axios.post('http://localhost:5000/api/vendor/login', {
    email: vendor.email,
    password: 'password123'
  }).catch(err => err.response);
  
  if (loginRes.status !== 200) {
    console.log("Login failed", loginRes.data);
    process.exit(1);
  }
  
  const token = loginRes.data.token;
  console.log("Got token");
  
  try {
    const ordersRes = await axios.get('http://localhost:5000/api/vendor/orders', {
      headers: { 'x-auth-token': token }
    });
    console.log("HTTP GET Orders OK, count:", ordersRes.data.orders.length);
  } catch (err) {
    console.error("HTTP GET Orders failed!");
    if (err.response) {
      console.log("Status:", err.response.status);
      console.log("Data:", err.response.data);
    } else {
      console.log(err.message);
    }
  }
  process.exit(0);
}
testHttp();
