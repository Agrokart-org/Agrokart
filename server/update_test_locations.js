const mongoose = require('mongoose');

async function updateLocations() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agrokart');
    const User = require('./models/User');
    
    const emails = ['test@example.com', 'dummyvendor@agrokart.com', 'delivery@agrokart.com'];
    const lon = 74.189692;
    const lat = 19.128684;
    
    for (let email of emails) {
      await User.updateOne({ email }, { 
        $set: { 
          'location.coordinates': [lon, lat], 
          'address.coordinates.coordinates': [lon, lat], 
          'location.address': 'Custom Testing Location' 
        } 
      });
      console.log('Successfully updated coordinates for', email);
    }
    process.exit(0);
  } catch(err) {
    console.error("Error connecting to DB:", err);
    process.exit(1);
  }
}
updateLocations();
