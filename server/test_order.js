const axios = require('axios');

async function testOrder() {
  const orderData = {
    items: [
      {
        product: "fert1",
        quantity: 2,
        price: 150,
        name: "Test Product"
      }
    ],
    deliveryAddress: {
      street: "123 Farm Road, Green Valley",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      coordinates: {
        type: "Point",
        coordinates: [73.8090, 18.4849]
      }
    },
    deliverySlot: {
      date: new Date().toISOString(),
      timeSlot: "morning"
    },
    paymentMethod: "cod"
  };

  try {
    console.log("Placing test order...");
    const res = await axios.post('http://localhost:5000/api/orders', orderData, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'mock-jwt-token'
      }
    });
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.log('Error status:', err.response.status);
      console.log('Error data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Error:', err.message);
    }
  }
}

testOrder();
