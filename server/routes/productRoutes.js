const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const auth = require('../middleware/auth');
const {
  getProducts,
  searchProducts,
  getAllCategories,
  getProductsByCategory,
  getFeaturedProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// ── Multer: upload product images to uploads/products/ ────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/products'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Routes ─────────────────────────────────────────────────────────────────────
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/categories/all', getAllCategories);
router.get('/category/:category', getProductsByCategory);
router.get('/featured/all', getFeaturedProducts);
router.get('/:id', getProductById);

// POST /api/products — create product with optional image upload
router.post('/', upload.single('productImage'), addProduct);

router.put('/:id', auth, upload.single('productImage'), updateProduct);
router.delete('/:id', auth, deleteProduct);

module.exports = router;
