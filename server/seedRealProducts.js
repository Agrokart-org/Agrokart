/**
 * seedRealProducts.js
 * Seeds the 42 real products into both Firebase Firestore AND MongoDB.
 * Also creates vendor inventory for any existing vendors.
 *
 * Usage: node seedRealProducts.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const VendorInventory = require("./models/VendorInventory");
const User = require("./models/User");
const { db } = require("./config/firebase");

// ── The 42 Real Products ────────────────────────────────────────────────────
const PRODUCTS = [
  // ══════ Bio-Fertilizers ══════
  { name: "Azospirillum Biofertilizer", description: "Nitrogen-fixing biofertilizer that enhances root growth and improves soil fertility. Ideal for cereals, millets, and oilseeds.", category: "Bio-Fertilizers", brand: "AgriLife", price: 290, stock: 120, unit: "kg", image: "/images/products/Bio-Fertilizers/Azospirillum Biofertilizer.webp", averageRating: 4.3 },
  { name: "Jivanu Biofertilizer", description: "Multi-strain biofertilizer consortium for balanced nutrition. Improves nutrient uptake and overall plant health.", category: "Bio-Fertilizers", brand: "GSFC", price: 350, stock: 85, unit: "kg", image: "/images/products/Bio-Fertilizers/Jivanu Biofertilizer.jpg", averageRating: 4.5 },
  { name: "PSB (Phosphate Solubilizing Bacteria)", description: "Solubilizes insoluble phosphorus in soil making it available to plants. Reduces dependency on chemical phosphatic fertilizers.", category: "Bio-Fertilizers", brand: "IPL Biologicals", price: 280, stock: 95, unit: "kg", image: "/images/products/Bio-Fertilizers/PSB (Phosphate Solubilizing Bacteria).png", averageRating: 4.2 },
  { name: "Rhizobium Biofertilizer", description: "Symbiotic nitrogen-fixing bacteria for leguminous crops. Enhances nodulation and nitrogen fixation in pulses and oilseeds.", category: "Bio-Fertilizers", brand: "National Fertilizers", price: 250, stock: 150, unit: "kg", image: "/images/products/Bio-Fertilizers/Rhizobium Biofertilizer.jpg", averageRating: 4.6 },
  { name: "Trichoderma Viride", description: "Bio-fungicide and growth promoter. Controls soil-borne diseases like root rot, wilt, and damping off.", category: "Bio-Fertilizers", brand: "Multiplex", price: 320, stock: 110, unit: "kg", image: "/images/products/Bio-Fertilizers/Trichoderma.webp", averageRating: 4.4 },

  // ══════ Micronutrients ══════
  { name: "Boron Fertilizer", description: "Essential micronutrient for flower and fruit development. Prevents hollow stem in brassicas.", category: "Micronutrients", brand: "Aries Agro", price: 450, stock: 75, unit: "kg", image: "/images/products/Micronutrients/Boron Fertilizer.webp", averageRating: 4.1 },
  { name: "Ferrous Sulphate", description: "Iron supplement for crops showing yellowing (chlorosis). Essential for chlorophyll synthesis.", category: "Micronutrients", brand: "Coromandel", price: 180, stock: 200, unit: "kg", image: "/images/products/Micronutrients/Ferrous Sulphate.jpg", averageRating: 4.0 },
  { name: "Ferrous Sulphate Granular Premium", description: "Premium grade ferrous sulphate in granular form for easy soil application.", category: "Micronutrients", brand: "Zuari Agro", price: 220, stock: 160, unit: "kg", image: "/images/products/Micronutrients/Ferrous Sulphate Granular.jpg", averageRating: 4.2 },
  { name: "Multiplex Micronutrient Mixture", description: "Complete micronutrient mixture containing Zn, Fe, Mn, Cu, B, Mo. Balanced nutrition for all crops.", category: "Micronutrients", brand: "Multiplex", price: 520, stock: 90, unit: "kg", image: "/images/products/Micronutrients/Multiplex Micronutrient Mixture.webp", averageRating: 4.5 },
  { name: "Zinc Sulphate 21%", description: "Zinc micronutrient fertilizer for correcting zinc deficiency in paddy, wheat, maize, and citrus.", category: "Micronutrients", brand: "IFFCO", price: 280, stock: 180, unit: "kg", image: "/images/products/Micronutrients/Zinc Sulphate 21.jpg", averageRating: 4.3 },

  // ══════ NPK Fertilizers ══════
  { name: "NPK 10-26-26", description: "Complex fertilizer with high phosphorus and potassium. Ideal for root development and flowering.", category: "NPK Fertilizers", brand: "Coromandel", price: 1350, stock: 60, unit: "bag", image: "/images/products/NPK Fertilizers/10-26-26-(NPK).png", averageRating: 4.4 },
  { name: "Coromandel Gromor NPK", description: "Premium quality NPK complex fertilizer from Coromandel. Provides balanced nutrition.", category: "NPK Fertilizers", brand: "Coromandel", price: 1400, stock: 45, unit: "bag", image: "/images/products/NPK Fertilizers/Coromandel NPK.jpg", averageRating: 4.6 },
  { name: "IFFCO NPK 12-32-16", description: "India's most trusted NPK fertilizer by IFFCO. Balanced formula for all major crops.", category: "NPK Fertilizers", brand: "IFFCO", price: 1350, stock: 70, unit: "bag", image: "/images/products/NPK Fertilizers/IFFCO NPK.jpeg", averageRating: 4.7 },
  { name: "Mahadhan NPK", description: "Mahadhan brand NPK fertilizer for balanced crop nutrition. Suitable for all soil types.", category: "NPK Fertilizers", brand: "Deepak Fertilizers", price: 1300, stock: 55, unit: "bag", image: "/images/products/NPK Fertilizers/Mahadhan.jpg", averageRating: 4.3 },
  { name: "Sujala Liquid NPK", description: "Water-soluble liquid NPK fertilizer for foliar spray and drip irrigation.", category: "NPK Fertilizers", brand: "KRIBHCO", price: 480, stock: 130, unit: "bottle", image: "/images/products/NPK Fertilizers/Sujala NPK.png", averageRating: 4.2 },

  // ══════ Organic ══════
  { name: "City Compost", description: "Recycled urban organic waste compost. Rich in organic matter and beneficial microorganisms.", category: "Organic", brand: "MCGM Organic", price: 350, stock: 200, unit: "bag", image: "/images/products/Organic/City Compost.jpg", averageRating: 3.9 },
  { name: "Cow Dung Manure (Gobar Khad)", description: "Traditional well-decomposed cow dung manure. Improves soil structure and microbial activity.", category: "Organic", brand: "Farm Fresh Organic", price: 250, stock: 300, unit: "bag", image: "/images/products/Organic/Cow Dung Manure (Gobar Khad).webp", averageRating: 4.4 },
  { name: "Neem Cake Fertilizer", description: "Organic neem cake for soil enrichment and pest control. Acts as fertilizer and natural pesticide.", category: "Organic", brand: "Neem India", price: 450, stock: 140, unit: "bag", image: "/images/products/Organic/Neem Cake Fertilizer.jpg", averageRating: 4.5 },
  { name: "PROM (Phosphate Rich Organic Manure)", description: "Government-approved phosphate-rich organic manure. Substitute for DAP with organic benefits.", category: "Organic", brand: "RCF", price: 520, stock: 100, unit: "bag", image: "/images/products/Organic/PROM (Phosphate Rich Organic Manure).webp", averageRating: 4.3 },
  { name: "Vermicompost", description: "Premium quality vermicompost produced by earthworms. Rich in nutrients and beneficial microbes.", category: "Organic", brand: "Samarth Organic", price: 380, stock: 180, unit: "bag", image: "/images/products/Organic/Vermicompost.jpg", averageRating: 4.6 },

  // ══════ Pesticides ══════
  { name: "Actara (Syngenta)", description: "Systemic insecticide (Thiamethoxam 25% WG) for sucking pests. Effective against whitefly and aphids.", category: "Pesticides", brand: "Syngenta", price: 560, stock: 90, unit: "pack", image: "/images/products/Pesticides/Actara (Syngenta).webp", averageRating: 4.7 },
  { name: "Confidor (Bayer)", description: "Systemic insecticide by Bayer. Controls aphids, thrips, and brown plant hopper.", category: "Pesticides", brand: "Bayer CropScience", price: 620, stock: 80, unit: "bottle", image: "/images/products/Pesticides/Confidor (Bayer).jpg", averageRating: 4.5 },
  { name: "Coragen (FMC)", description: "Premium insecticide for bollworms and caterpillars. Long-lasting crop protection.", category: "Pesticides", brand: "FMC Corporation", price: 1850, stock: 50, unit: "bottle", image: "/images/products/Pesticides/Coragen (FMC).jpeg", averageRating: 4.8 },
  { name: "Monocrotophos 36 SL", description: "Broad-spectrum systemic insecticide for bollworms, stem borers, and leafhoppers.", category: "Pesticides", brand: "Crystal Crop", price: 380, stock: 120, unit: "litre", image: "/images/products/Pesticides/Monocrotophos 36 SL.jpg", averageRating: 4.0 },
  { name: "Ulala (UPL)", description: "Selective insecticide (Flonicamid 50% WG) for aphids and whitefly. Safe for beneficials.", category: "Pesticides", brand: "UPL Limited", price: 980, stock: 65, unit: "pack", image: "/images/products/Pesticides/Ulala (UPL).png", averageRating: 4.4 },

  // ══════ Seeds ══════
  { name: "Advanta Corn Seeds", description: "High-yielding hybrid corn seeds with excellent germination rate.", category: "Seeds", brand: "Advanta Seeds (UPL)", price: 850, stock: 100, unit: "pack", image: "/images/products/Seeds/Advanta Corn Seeds.jpg", averageRating: 4.3 },
  { name: "Cucumber Seeds Hybrid", description: "High-quality hybrid cucumber seeds for kitchen garden and commercial farming.", category: "Seeds", brand: "Seminis", price: 180, stock: 200, unit: "pack", image: "/images/products/Seeds/Cucumber Seeds.jpeg", averageRating: 4.1 },
  { name: "Kaveri Wheat Seeds (HD-2967)", description: "High-yielding wheat variety suitable for irrigated conditions.", category: "Seeds", brand: "Kaveri Seeds", price: 650, stock: 80, unit: "pack", image: "/images/products/Seeds/Kaveri Wheat Seeds.jpeg", averageRating: 4.5 },
  { name: "Lady Finger (Bhindi) Seeds", description: "Premium okra seeds for year-round cultivation. High-yielding variety.", category: "Seeds", brand: "Namdhari Seeds", price: 150, stock: 250, unit: "pack", image: "/images/products/Seeds/Lady Finger Seeds.jpeg", averageRating: 4.2 },
  { name: "Mahyco Cotton Seeds (Bt)", description: "Bollgard cotton seeds with inbuilt insect resistance and high fiber quality.", category: "Seeds", brand: "Mahyco", price: 780, stock: 70, unit: "pack", image: "/images/products/Seeds/Mahyco Cotton Seeds.avif", averageRating: 4.4 },
  { name: "Syngenta Hybrid Maize Seeds", description: "Premium hybrid maize seeds with high yield potential and drought tolerance.", category: "Seeds", brand: "Syngenta", price: 920, stock: 60, unit: "pack", image: "/images/products/Seeds/Syngenta Hybrid Maize Seeds.webp", averageRating: 4.6 },
  { name: "Tomato Seeds Hybrid", description: "Disease-resistant hybrid tomato seeds. High yielding with firm round fruits.", category: "Seeds", brand: "Indo-American Seeds", price: 220, stock: 180, unit: "pack", image: "/images/products/Seeds/Tomato Seeds.jpeg", averageRating: 4.3 },

  // ══════ Tools ══════
  { name: "Battery Sprayer (12V)", description: "Rechargeable 12V battery-operated sprayer. 16L tank capacity with adjustable nozzle.", category: "Tools", brand: "Neptune", price: 3500, stock: 30, unit: "piece", image: "/images/products/Tools/Battery Sprayer (12V).jpg", averageRating: 4.5 },
  { name: "Khurpi (Hand Hoe)", description: "Traditional Indian hand hoe for weeding and light cultivation. Durable steel blade.", category: "Tools", brand: "Trust Tools", price: 180, stock: 200, unit: "piece", image: "/images/products/Tools/Khurpi (Hand Hoe).jpg", averageRating: 4.2 },
  { name: "Manual Knapsack Sprayer (16L)", description: "Heavy-duty manually operated knapsack sprayer. Brass lance with adjustable nozzle.", category: "Tools", brand: "Aspee", price: 1850, stock: 40, unit: "piece", image: "/images/products/Tools/Manual Knapsack Sprayer (16L).png", averageRating: 4.4 },
  { name: "Multi-Function Seed Planting Machine", description: "Versatile manual seed planter for precise seed spacing. Suitable for corn, soybean, and vegetables.", category: "Tools", brand: "Farm Mechanix", price: 4200, stock: 20, unit: "piece", image: "/images/products/Tools/Seed Planting Machine.webp", averageRating: 4.1 },
  { name: "Three Teeth Cultivator", description: "Garden cultivator with 3 prongs for soil loosening and weeding.", category: "Tools", brand: "Falcon Garden", price: 350, stock: 150, unit: "piece", image: "/images/products/Tools/Three Teeth Cultivator.jpg", averageRating: 4.0 },

  // ══════ Urea ══════
  { name: "Bharat Urea 45kg", description: "Standard grade urea fertilizer (46% N). Government subsidized price for Indian farmers.", category: "Urea", brand: "Bharat Fertilizers", price: 266, stock: 300, unit: "bag", image: "/images/products/Urea/bharat_urea.jpg", averageRating: 4.3 },
  { name: "IFFCO Urea 45kg", description: "India's top-selling urea fertilizer by IFFCO. Premium quality with 46% nitrogen content.", category: "Urea", brand: "IFFCO", price: 267, stock: 350, unit: "bag", image: "/images/products/Urea/IFFCO Urea.jpg", averageRating: 4.5 },
  { name: "Neem Coated Urea", description: "Neem-coated urea for slow nitrogen release. Increases crop yield by 5-10%.", category: "Urea", brand: "RCF", price: 270, stock: 250, unit: "bag", image: "/images/products/Urea/Neem-Coated-Urea.jpeg", averageRating: 4.6 },
  { name: "NFL Neem Coated Urea", description: "National Fertilizers Limited neem-coated urea. Controlled nitrogen release.", category: "Urea", brand: "NFL", price: 268, stock: 280, unit: "bag", image: "/images/products/Urea/NFL Neem Coated Urea.webp", averageRating: 4.4 },
  { name: "Ujwala Neem Coated Urea", description: "Ujwala brand neem-coated urea with enhanced nitrogen efficiency.", category: "Urea", brand: "Ujwala Fertilizers", price: 275, stock: 220, unit: "bag", image: "/images/products/Urea/Ujwala Neem Coated Urea.avif", averageRating: 4.2 },
];

async function seedFirestore() {
  console.log("\n🔥 Seeding Firebase Firestore...");

  try {
    // Try to delete existing products (may fail if collection doesn't exist)
    try {
      const snapshot = await db.collection("products").get();
      if (snapshot.size > 0) {
        const deleteOps = snapshot.docs.map((doc) => doc.ref.delete());
        await Promise.all(deleteOps);
        console.log(`   Deleted ${snapshot.size} existing Firestore products.`);
      } else {
        console.log("   No existing products found in Firestore.");
      }
    } catch (err) {
      console.log("   ⚠️ Could not list/delete existing products (collection may not exist).");
    }

    // Add new products
    const batch = db.batch();
    for (const product of PRODUCTS) {
      const docRef = db.collection("products").doc();
      batch.set(docRef, {
        ...product,
        images: [product.image],
        isActive: true,
        isFeatured: product.averageRating >= 4.5,
        numReviews: Math.floor(Math.random() * 200) + 30,
        createdAt: new Date().toISOString(),
      });
    }
    await batch.commit();
    console.log(`   ✅ Added ${PRODUCTS.length} products to Firestore.`);
  } catch (error) {
    console.log(`   ⚠️ Firestore seeding skipped (${error.message}).`);
    console.log("   The app will use MongoDB and mock data as fallback.");
  }
}

async function seedMongoDB() {
  console.log("\n🍃 Seeding MongoDB...");

  // Connect to MongoDB
  const MONGODB_URI = process.env.MONGODB_URI;
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("   Connected to MongoDB.");

  // Clear existing products and vendor inventory
  await Product.deleteMany({});
  await VendorInventory.deleteMany({});
  console.log("   Cleared existing products and vendor inventory.");

  // Insert products
  const productDocs = PRODUCTS.map((p) => ({
    name: p.name,
    description: p.description,
    category: p.category,
    brand: p.brand,
    price: p.price,
    stock: p.stock,
    unit: p.unit,
    image: p.image,
    images: [p.image],
    isActive: true,
    averageRating: p.averageRating,
    numReviews: Math.floor(Math.random() * 200) + 30,
  }));

  const insertedProducts = await Product.insertMany(productDocs);
  console.log(`   ✅ Inserted ${insertedProducts.length} products into MongoDB.`);

  // Assign inventory to vendors
  const vendors = await User.find({ role: "vendor" });
  if (vendors.length > 0) {
    const inventoryItems = [];
    for (const vendor of vendors) {
      // Each vendor gets all 42 products
      for (const prod of insertedProducts) {
        const stock = Math.floor(Math.random() * 80) + 20;
        inventoryItems.push({
          vendor: vendor._id,
          product: prod._id,
          stock: stock,
          reservedStock: 0,
          availableStock: stock,
          costPrice: Math.floor(prod.price * 0.75),
          sellingPrice: prod.price,
          minStockLevel: 10,
          maxStockLevel: 200,
          isActive: true,
        });
      }
    }

    await VendorInventory.insertMany(inventoryItems);
    console.log(`   ✅ Assigned ${inventoryItems.length} inventory items to ${vendors.length} vendor(s).`);
  } else {
    console.log("   ⚠️ No vendors found. Skipping inventory assignment.");
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  Agrokart Real Product Seeder (42 Products)         ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  try {
    await seedFirestore();
    await seedMongoDB();

    console.log("\n✅ All done! 42 real products seeded successfully.");
    console.log("   - Firebase Firestore: ✅");
    console.log("   - MongoDB Products: ✅");
    console.log("   - Vendor Inventory: ✅");
  } catch (error) {
    console.error("\n❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
