const mongoose = require('mongoose');
const Earnings = require('./models/Earnings');

async function fixEarnings() {
  await mongoose.connect('mongodb://127.0.0.1:27017/agrokart', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log("Connected to MongoDB.");
  
  const earnings = await Earnings.find({});
  let fixedEarnings = 0;
  for (let e of earnings) {
     let changed = false;
     
     if (e.grossAmount > 1000) {
        e.grossAmount = 50;
        changed = true;
     }
     if (e.netAmount > 1000) {
        e.netAmount = 50;
        changed = true;
     }
     
     if (changed) { 
        await e.save(); 
        fixedEarnings++; 
     }
  }
  console.log("Fixed Earnings:", fixedEarnings);
  
  process.exit(0);
}

fixEarnings().catch(console.error);
