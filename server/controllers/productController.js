const { db } = require("../config/firebase");
const { getMarkup, getCustomerPrice } = require("../utils/pricing");

const formatProduct = (doc) => ({ _id: doc.id, id: doc.id, ...doc.data() });

/**
 * Apply platform markup to a product for customer-facing display.
 * Preserves the original vendor price as `basePrice`.
 */
const applyMarkup = (product) => {
  const base = Number(product.price) || 0;
  return {
    ...product,
    basePrice: base,
    markup: getMarkup(base),
    price: getCustomerPrice(base),
  };
};

const getProducts = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 20, sortBy = "name", sortOrder = "asc", minPrice, maxPrice, search } = req.query;

    let snapshot = await db.collection("products").where("isActive", "==", true).get();
    let products = snapshot.docs.map(formatProduct);

    if (category && category !== "all") {
      products = products.filter((p) => p.category === category);
    }
    if (minPrice || maxPrice) {
      products = products.filter((p) => {
        let isValid = true;
        if (minPrice) isValid = isValid && p.price >= Number(minPrice);
        if (maxPrice) isValid = isValid && p.price <= Number(maxPrice);
        return isValid;
      });
    }
    if (search) {
      const s = search.toLowerCase();
      products = products.filter((p) =>
        (p.name && p.name.toLowerCase().includes(s)) ||
        (p.description && p.description.toLowerCase().includes(s)) ||
        (p.brand && p.brand.toLowerCase().includes(s))
      );
    }

    products.sort((a, b) => {
      let valA = a[sortBy] || "";
      let valB = b[sortBy] || "";
      if (typeof valA === "string") return sortOrder === "desc" ? valB.localeCompare(valA) : valA.localeCompare(valB);
      return sortOrder === "desc" ? valB - valA : valA - valB;
    });

    const total = products.length;
    const skip = (page - 1) * limit;
    const paginatedProducts = products.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      message: "Products retrieved successfully",
      data: {
        products: paginatedProducts.map(applyMarkup),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, message: "Query too short", data: { products: [] } });
    }

    const searchCriteria = q.trim().toLowerCase();
    let snapshot = await db.collection("products").get();
    let products = snapshot.docs
      .map(formatProduct)
      .filter((p) =>
        (p.name && p.name.toLowerCase().includes(searchCriteria)) ||
        (p.description && p.description.toLowerCase().includes(searchCriteria)) ||
        (p.category && p.category.toLowerCase().includes(searchCriteria))
      )
      .slice(0, 10);

    res.json({
      success: true,
      message: "Search completed",
      data: {
        products: products.map((product) => {
          const marked = applyMarkup(product);
          return {
            id: product._id,
            name: product.name,
            category: product.category,
            basePrice: marked.basePrice,
            price: marked.price,
            markup: marked.markup,
            image: product.image,
            description: product.description,
          };
        }),
        query: req.query.q,
        count: products.length,
      }
    });
  } catch (err) {
    next(err);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    let snapshot = await db.collection("products").where("isActive", "==", true).get();
    let products = snapshot.docs.map((d) => d.data());
    let categoryMapStore = {};

    products.forEach((p) => {
      if (!p.category) return;
      if (!categoryMapStore[p.category]) {
        categoryMapStore[p.category] = { count: 0, sum: 0, min: p.price || 0, max: p.price || 0 };
      }
      let c = categoryMapStore[p.category];
      c.count++;
      c.sum += p.price || 0;
      if (p.price < c.min) c.min = p.price;
      if (p.price > c.max) c.max = p.price;
    });

    const categoryMap = {
      urea: { name: "Urea", icon: "🌱", description: "Nitrogen-rich fertilizers" },
      dap: { name: "DAP", icon: "🌾", description: "Phosphorus fertilizers" },
      npk: { name: "NPK", icon: "🌿", description: "Balanced nutrition" },
      organic: { name: "Organic", icon: "🍃", description: "Natural fertilizers" },
      other: { name: "Other", icon: "🔧", description: "Specialized products" },
    };

    const enrichedCategories = Object.keys(categoryMapStore)
      .map((catId) => {
        const data = categoryMapStore[catId];
        return {
          id: catId,
          name: categoryMap[catId]?.name || catId,
          icon: categoryMap[catId]?.icon || "📦",
          description: categoryMap[catId]?.description || "",
          count: data.count,
          avgPrice: Math.round(data.sum / data.count) || 0,
          priceRange: { min: data.min, max: data.max },
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id));

    res.json({ success: true, message: "Categories loaded", data: enrichedCategories });
  } catch (err) {
    next(err);
  }
};

const getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20, sortBy = "name", sortOrder = "asc", minPrice, maxPrice } = req.query;

    let snapshot = await db.collection("products").where("category", "==", category).where("isActive", "==", true).get();
    let products = snapshot.docs.map(formatProduct);

    if (minPrice || maxPrice) {
      products = products.filter((p) => {
        let isValid = true;
        if (minPrice) isValid = isValid && p.price >= Number(minPrice);
        if (maxPrice) isValid = isValid && p.price <= Number(maxPrice);
        return isValid;
      });
    }

    products.sort((a, b) => {
      let valA = a[sortBy] || "";
      let valB = b[sortBy] || "";
      if (typeof valA === "string") return sortOrder === "desc" ? valB.localeCompare(valA) : valA.localeCompare(valB);
      return sortOrder === "desc" ? valB - valA : valA - valB;
    });

    const total = products.length;
    const skip = (page - 1) * limit;
    const paginatedProducts = products.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      message: "Category products loaded",
      data: {
        category,
        products: paginatedProducts.map(applyMarkup),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

const getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    let snapshot = await db.collection("products").where("isActive", "==", true).get();
    let products = snapshot.docs
      .map(formatProduct)
      .filter((p) => p.averageRating >= 4.0 || p.isFeatured)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, Number(limit));
      
    res.json({ success: true, message: "Featured products loaded", data: products.map(applyMarkup) });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const doc = await db.collection("products").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, message: "Product loaded", data: applyMarkup(formatProduct(doc)) });
  } catch (err) {
    next(err);
  }
};

const addProduct = async (req, res, next) => {
  try {
    const {
      name, description, category, brand,
      price, stock, unit,
    } = req.body;

    // Build image URL if a file was uploaded
    let imageUrl = '';
    if (req.file) {
      // Serve from /uploads/products/<filename>
      imageUrl = `/uploads/products/${req.file.filename}`;
    }

    const VALID_CATEGORIES = [
      'Bio-Fertilizers', 'Micronutrients', 'NPK Fertilizers',
      'Pesticides', 'Seeds', 'Tools', 'Urea',
    ];

    const productData = {
      name: name || '',
      description: description || '',
      category: VALID_CATEGORIES.includes(category) ? category : category || 'Tools',
      brand: brand || '',
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      unit: unit || 'kg',
      image: imageUrl,
      images: imageUrl ? [imageUrl] : [],
      isActive: true,
      averageRating: 0,
      numReviews: 0,
      isFeatured: false,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('products').add(productData);
    const doc = await docRef.get();
    res.status(201).json({ success: true, message: 'Product created', data: formatProduct(doc) });
  } catch (err) {
    next(err);
  }
};


const updateProduct = async (req, res, next) => {
  try {
    await db.collection("products").doc(req.params.id).update(req.body);
    const doc = await db.collection("products").doc(req.params.id).get();
    res.json({ success: true, message: "Product updated", data: formatProduct(doc) });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await db.collection("products").doc(req.params.id).delete();
    res.json({ success: true, message: "Product deleted", data: {} });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  searchProducts,
  getAllCategories,
  getProductsByCategory,
  getFeaturedProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct
};
