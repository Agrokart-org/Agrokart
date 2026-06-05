

async function testEndpoint() {
  try {
    console.log('Testing PUT /api/delivery/bank-account');
    const response = await fetch('http://localhost:5000/api/delivery/bank-account', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'delivery-jwt-token'
      },
      body: JSON.stringify({
        accountNumber: "1234567890",
        ifscCode: "SBIN0001234",
        accountHolderName: "Test Name",
        bankName: "SBI"
      })
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body:', text);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEndpoint();
