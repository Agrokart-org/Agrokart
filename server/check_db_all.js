const mongoose = require('mongoose');
const Earnings = require('./models/Earnings');
const User = require('./models/User');

async function checkDB() {
  await mongoose.connect('mongodb://localhost:27017/agrokart', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log("Connected to MongoDB.");
  
  const users = await User.find({ email: /kkpartner/i });
  console.log("Users with kkpartner:", users.map(u => u.email));
  
  const earnings = await Earnings.find({});
  console.log(`Found ${earnings.length} earnings records.`);
  if (earnings.length > 0) {
      console.log("First earning:", JSON.stringify(earnings[0], null, 2));
      let maxNet = 0;
      for (let e of earnings) {
          if (e.netAmount > maxNet) maxNet = e.netAmount;
      }
      console.log("Max netAmount in DB:", maxNet);
  }
  
  process.exit(0);
}

checkDB().catch(console.error);
