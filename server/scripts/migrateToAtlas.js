require("dotenv").config();
const mongoose = require("mongoose");

// Target Collections to migrate
const collectionsToMigrate = ["users", "products", "vendorinventories", "orders", "notifications"];

async function migrateDatabase() {
  const sourceUri = process.env.LOCAL_DB_URI || "mongodb://localhost:27017/agrokart";
  const targetUri = process.env.ATLAS_URI;

  if (!targetUri) {
    console.error("❌ ERROR: Please provide your MongoDB Atlas URI.");
    console.error("Usage: set ATLAS_URI=mongodb+srv://... && node migrateToAtlas.js");
    process.exit(1);
  }

  console.log("Connecting to Source Database...");
  const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
  console.log("✅ Connected to Local MongoDB.");

  console.log("Connecting to Target (Atlas) Database...");
  const targetConn = await mongoose.createConnection(targetUri).asPromise();
  console.log("✅ Connected to MongoDB Atlas.");

  for (const colName of collectionsToMigrate) {
    console.log(`\nMigrating collection: ${colName}...`);
    try {
      const sourceCol = sourceConn.collection(colName);
      const targetCol = targetConn.collection(colName);

      const docs = await sourceCol.find({}).toArray();
      if (docs.length === 0) {
        console.log(` - No documents found in ${colName}. Skipping.`);
        continue;
      }

      console.log(` - Found ${docs.length} documents. Clearing target collection...`);
      await targetCol.deleteMany({}); // Optional: clear existing data on Atlas
      
      console.log(` - Inserting documents into Atlas...`);
      await targetCol.insertMany(docs);
      console.log(` ✅ Successfully migrated ${colName}.`);
    } catch (err) {
      console.error(` ❌ Failed to migrate ${colName}:`, err.message);
    }
  }

  console.log("\n🎉 Database Migration Complete!");
  
  await sourceConn.close();
  await targetConn.close();
  process.exit(0);
}

migrateDatabase().catch(err => {
  console.error("Migration Error:", err);
  process.exit(1);
});
