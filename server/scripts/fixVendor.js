const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const VendorInventory = require('../models/VendorInventory');

async function fixVendor() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const dummyVendor = await User.findOne({ email: 'dummyvendor@agrokart.com' });
  const realVendor = await User.findOne({ email: 'kalekrushna430@gmail.com' });

  if (!dummyVendor) {
    console.log('Dummy vendor already removed. Checking real vendor...');
    const rv = await User.findOne({ email: 'kalekrushna430@gmail.com' });
    if (rv) {
      const invCount = await VendorInventory.countDocuments({ vendor: rv._id });
      console.log(`Krushna Kale (${rv._id}) has ${invCount} inventory items.`);
      console.log(`Address: ${rv.address?.city}, coords: [${rv.address?.coordinates?.coordinates}]`);
    }
    await mongoose.disconnect();
    return;
  }

  // Get products real vendor already has
  const realVendorProducts = await VendorInventory.find({ vendor: realVendor._id }).select('product').lean();
  const existingProductIds = new Set(realVendorProducts.map(p => p.product.toString()));

  // Get dummy vendor's inventory
  const dummyInventory = await VendorInventory.find({ vendor: dummyVendor._id }).lean();
  console.log(`Found ${dummyInventory.length} inventory items on Dummy Vendor`);
  console.log(`Real vendor already has ${existingProductIds.size} products`);

  // Only transfer items the real vendor doesn't already have
  let transferred = 0;
  for (const item of dummyInventory) {
    if (!existingProductIds.has(item.product.toString())) {
      await VendorInventory.updateOne(
        { _id: item._id },
        { $set: { vendor: realVendor._id } }
      );
      transferred++;
    }
  }
  console.log(`✅ Transferred ${transferred} new inventory items to Krushna Kale`);

  // Delete remaining dummy vendor inventory (duplicates)
  const deleted = await VendorInventory.deleteMany({ vendor: dummyVendor._id });
  console.log(`✅ Cleaned up ${deleted.deletedCount} remaining dummy vendor inventory`);

  // Delete the dummy vendor
  await User.deleteOne({ _id: dummyVendor._id });
  console.log('✅ Removed Dummy Vendor from database');

  // Verify
  const remainingVendors = await User.find({ role: 'vendor' }).select('_id email name address').lean();
  console.log('\n=== REMAINING VENDORS ===');
  remainingVendors.forEach(v => {
    console.log(`  ${v._id} - ${v.email} (${v.name})`);
    console.log(`  Address: ${v.address?.city}, coords: [${v.address?.coordinates?.coordinates}]`);
  });

  const invCount = await VendorInventory.countDocuments({ vendor: realVendor._id });
  console.log(`\nKrushna Kale now has ${invCount} inventory items.`);

  await mongoose.disconnect();
  console.log('\n🎉 Done! New orders will now be assigned to Krushna Kale.');
}

fixVendor().catch(e => { console.error(e); process.exit(1); });
