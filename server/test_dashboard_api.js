const fetch = require('node-fetch');
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testAPI() {
  await mongoose.connect('mongodb://127.0.0.1:27017/agrokart', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  const user = await User.findOne({ email: 'kkpartner@agmail.com' });
  if (!user) {
    console.log("User not found in DB");
    process.exit(1);
  }
  
  const payload = {
    user: {
      id: user.id,
      role: user.role
    }
  };
  
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '5h' });

  const dashRes = await fetch('http://localhost:5000/api/delivery/dashboard', {
    method: 'GET',
    headers: { 'x-auth-token': token }
  });
  const dashData = await dashRes.json();
  
  console.log("Dashboard API Response:");
  console.log(JSON.stringify(dashData, null, 2));
  process.exit(0);
}

testAPI().catch(console.error);
