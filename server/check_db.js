const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/agrokart');
  require('./models/User');
  require('./models/Order');
  const DeliveryAssignment = require('./models/DeliveryAssignment');
  
  const a = await DeliveryAssignment.find({ status: 'assigned', deliveryPartner: { $exists: false } });
  console.log('Count with exists: false ->', a.length);
  
  const b = await DeliveryAssignment.find({ status: 'assigned' });
  console.log('Total assigned count ->', b.length);
  
  const dummyPartnerId = new mongoose.Types.ObjectId();
  const c = await DeliveryAssignment.find({
      status: "assigned",
      deliveryPartner: { $exists: false },
      rejectedBy: { $ne: dummyPartnerId },
    });
  console.log('Count with rejectedBy constraint ->', c.length);

  process.exit(0);
}

test().catch(console.error);
