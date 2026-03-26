const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./src/models/Product');
const VendorInventory = require('./src/models/VendorInventory');
const User = require('./src/models/User');

mongoose.connect('mongodb://localhost:27017/agrokart', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const productsDir = path.join(__dirname, '../client/public/images/products');

async function seed() {
    try {
        await Product.deleteMany({});
        await VendorInventory.deleteMany({});
        console.log('Cleared existing products and inventory.');

        const categories = ['Bio-Fertilizers', 'Micronutrients', 'NPK Fertilizers', 'Organic', 'Pesticides', 'Seeds', 'Tools', 'Urea'];
        const newProducts = [];

        for (const category of categories) {
            const catPath = path.join(productsDir, category);
            if (fs.existsSync(catPath)) {
                const files = fs.readdirSync(catPath);
                for (const file of files) {
                    if (file.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
                        // capitalize and clean name
                        const name = file.replace(/\.[^/.]+$/, "")
                            .replace(/-/g, ' ')
                            .replace(/(^\w|\s\w)/g, m => m.toUpperCase());

                        const price = Math.floor(Math.random() * 900) + 100;
                        newProducts.push({
                            name: name,
                            description: `High quality ${name} from our ${category} collection.`,
                            category: category,
                            brand: 'Agrobrand Premium',
                            price: price,
                            stock: Math.floor(Math.random() * 500) + 50,
                            unit: category === 'Tools' ? 'piece' : (category === 'Seeds' ? 'pack' : 'kg'),
                            image: `/images/products/${category}/${file}`,
                            images: [`/images/products/${category}/${file}`]
                        });
                    }
                }
            }
        }

        const insertedProducts = await Product.insertMany(newProducts);
        console.log(`Inserted ${insertedProducts.length} new products.`);

        const vendors = await User.find({ role: 'vendor' });
        if (vendors.length > 0) {
            const inventoryItems = [];
            for (const vendor of vendors) {
                // Shuffle array and pick 15-20 random products for each vendor
                const shuffled = [...insertedProducts].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, Math.floor(Math.random() * 10) + 15);

                for (const prod of selected) {
                    const stock = Math.floor(Math.random() * 100) + 20;
                    inventoryItems.push({
                        vendor: vendor._id,
                        product: prod._id,
                        stock: stock,
                        reservedStock: 0,
                        availableStock: stock,
                        costPrice: Math.floor(prod.price * 0.7),
                        sellingPrice: prod.price,
                        minStockLevel: 10,
                        maxStockLevel: 200,
                        isActive: true
                    });
                }
            }
            await VendorInventory.insertMany(inventoryItems);
            console.log(`Assigned ${inventoryItems.length} inventory items to ${vendors.length} vendors.`);
        }

        console.log('Done!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
