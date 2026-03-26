const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testVendorFlow() {
    try {
        console.log('1. Logging in as vendor...');
        const loginRes = await axios.post(`${API_URL}/vendor/login`, {
            email: 'kkvendor@gmail.com',
            password: 'password123'
        });

        const token = loginRes.data.token;
        const user = loginRes.data.user;
        console.log('Login Successful!');
        console.log('User ID:', user.id);
        console.log('Token:', token ? 'Recieved' : 'Missing');

        console.log('\n2. Fetching Vendor Orders...');
        const ordersRes = await axios.get(`${API_URL}/vendor/orders`, {
            headers: { 'x-auth-token': token }
        });

        console.log('Orders Response Status:', ordersRes.status);
        console.log('Orders Data:', JSON.stringify(ordersRes.data, null, 2));

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testVendorFlow();
