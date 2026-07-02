const mongoose = require('mongoose');

// Note: If you are using a cloud database (like MongoDB Atlas), replace this URI with your cloud connection string.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agrokart';

async function updateLocations() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to Database.");
    
    // We are directly using the mongoose connection to bypass strict schema if necessary
    const User = mongoose.connection.collection('users');
    
    const emails = ['kkcustomer@gmail.com', 'jack@gmail.com', 'kkpartner@agmail.com'];
    const lon = 74.189692;
    const lat = 19.128684;
    
    for (let email of emails) {
      const result = await User.updateOne({ email: email }, { 
        $set: { 
          'location.type': 'Point',
          'location.coordinates': [lon, lat], 
          'location.address': 'My Custom Coordinates Location',
          
          'address.street': 'Main Street',
          'address.city': 'Rahuri',
          'address.state': 'Maharashtra',
          'address.pincode': '413705',
          'address.coordinates.type': 'Point',
          'address.coordinates.coordinates': [lon, lat]
        } 
      });
      
      if (result.matchedCount > 0) {
        console.log(`✅ Successfully updated location and address for: ${email}`);
      } else {
        console.log(`⚠️ User not found in database: ${email}`);
      }
    }
    
    console.log("\nDone! All 3 accounts are now at the exact same location.");
    process.exit(0);
  } catch(err) {
    console.error("Error connecting to DB:", err);
    process.exit(1);
  }
}

updateLocations();
