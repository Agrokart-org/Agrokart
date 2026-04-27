require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Product = require("../models/Product");
const VendorInventory = require("../models/VendorInventory");
const User = require("../models/User");

const SOURCE_DIR = "C:\\Users\\ASUS\\OneDrive\\Desktop\\Products";
const TARGET_IMG_DIR = path.join(__dirname, "../client/public/images/products");

async function main() {
  console.log("Starting Product Seeding Process...");
  
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  // Ensure target image directory exists
  if (!fs.existsSync(TARGET_IMG_DIR)) {
    fs.mkdirSync(TARGET_IMG_DIR, { recursive: true });
  }

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/agrokart");
    console.log("Connected to MongoDB.");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }

  // Find the vendor
  const vendorEmail = "kalekrushna430@gmail.com";
  let vendor = await User.findOne({ email: vendorEmail });
  
  if (!vendor) {
    console.log(`Vendor ${vendorEmail} not found. Creating temporary vendor record...`);
    vendor = await User.create({
      name: "Krushna Kale",
      email: vendorEmail,
      phone: "1234567890",
      role: "vendor",
      isVerified: true,
      vendorProfile: {
        businessName: "Kale Agrokart",
        businessAddress: "Pune",
        verificationStatus: "verified"
      }
    });
  } else {
    console.log(`Found vendor: ${vendorEmail}`);
  }

  let productsAdded = 0;
  let inventoryAdded = 0;

  // Read categories (folders)
  const categories = fs.readdirSync(SOURCE_DIR);
  
  for (const category of categories) {
    const categoryPath = path.join(SOURCE_DIR, category);
    
    // Only process directories
    if (!fs.statSync(categoryPath).isDirectory()) continue;
    
    console.log(`\nProcessing Category: ${category}`);
    
    // Ensure category exists in target images folder
    const targetCatDir = path.join(TARGET_IMG_DIR, category);
    if (!fs.existsSync(targetCatDir)) {
      fs.mkdirSync(targetCatDir, { recursive: true });
    }

    const files = fs.readdirSync(categoryPath);
    
    for (const file of files) {
      const sourceFilePath = path.join(categoryPath, file);
      
      // Skip non-files or hidden files
      if (!fs.statSync(sourceFilePath).isFile() || file.startsWith('.')) continue;
      
      const productName = path.parse(file).name;
      const targetFilePath = path.join(targetCatDir, file);
      
      // Copy image to client/public so it works locally and on next Firebase deploy
      fs.copyFileSync(sourceFilePath, targetFilePath);
      const imageUrl = `/images/products/${category}/${file}`;
      
      // Create or find product
      let product = await Product.findOne({ name: productName });
      if (!product) {
        product = await Product.create({
          name: productName,
          description: `Premium ${productName} for optimal agricultural yield.`,
          category: category,
          brand: "Agrokart Verified",
          price: 500, // Default price
          unit: "piece",
          image: imageUrl,
          images: [imageUrl],
          isActive: true,
          stock: 100,
          averageRating: 4.5,
          numReviews: Math.floor(Math.random() * 50) + 5
        });
        productsAdded++;
      }

      // Add to VendorInventory with 50 quantity
      let inventory = await VendorInventory.findOne({ vendor: vendor._id, product: product._id });
      if (inventory) {
        // Update existing
        inventory.stock = 50;
        inventory.availableStock = 50;
        await inventory.save();
      } else {
        // Create new
        await VendorInventory.create({
          vendor: vendor._id,
          product: product._id,
          stock: 50,
          reservedStock: 0,
          availableStock: 50,
          costPrice: product.price * 0.8,
          sellingPrice: product.price,
          minStockLevel: 5,
          maxStockLevel: 200,
          isActive: true
        });
        inventoryAdded++;
      }
      
      console.log(` - Added: ${productName} (Qty: 50)`);
    }
  }

  console.log("\n=================================");
  console.log(`Seeding Complete!`);
  console.log(`New Products Created: ${productsAdded}`);
  console.log(`Items Added to ${vendorEmail}'s Inventory: ${inventoryAdded}`);
  console.log("=================================\n");
  
  process.exit(0);
}

main().catch(err => {
  console.error("Script Error:", err);
  process.exit(1);
});
