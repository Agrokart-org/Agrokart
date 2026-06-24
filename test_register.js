const https = require('https');

const data = JSON.stringify({
  name: "Test Customer",
  email: `test_cust_${Date.now()}@gmail.com`,
  password: "password123",
  phone: "1234567890",
  role: "customer",
  firebaseUid: "dummy_uid_" + Date.now()
});

const options = {
  hostname: 'agrokart-api.onrender.com',
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => {
    console.log(body);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
