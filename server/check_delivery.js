const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'kkpartner@agmail.com',
      password: 'demo@123',
      role: 'delivery_partner'
    });
    
    const token = loginRes.data.token;
    console.log("Logged in. Token:", token.substring(0, 20) + '...');
    
    // Fetch assignments
    const assignmentsRes = await axios.get('http://localhost:5000/api/delivery/assignments', {
      headers: { 'x-auth-token': token }
    });
    
    console.log("Assignments:", assignmentsRes.data.length);
    if(assignmentsRes.data.length > 0) {
      console.log("First assignment fee:", assignmentsRes.data[0].deliveryFee);
      console.log("Total Amount:", assignmentsRes.data[0].order?.totalAmount);
    }
    
    // Fetch history
    const historyRes = await axios.get('http://localhost:5000/api/delivery/history', {
      headers: { 'x-auth-token': token }
    });
    console.log("History length:", historyRes.data.history?.length);
    if(historyRes.data.history?.length > 0) {
      console.log("First history fee:", historyRes.data.history[0].deliveryFee);
    }
    
    process.exit(0);
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
    process.exit(1);
  }
}
test();
