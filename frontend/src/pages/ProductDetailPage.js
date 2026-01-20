import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  Divider,
  Chip,
  Rating,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Stack,
  Fab
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  Verified as VerifiedIcon,
  Support as SupportIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { getProduct } from '../services/api';
import { mockProducts } from '../data/mockProducts';
import { motion, AnimatePresence } from 'framer-motion';
import { alpha } from '@mui/material/styles';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo(0, 0);

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, try to find in mock products
        const mockProduct = mockProducts.find(p => p._id === id);
        if (mockProduct) {
          setProduct({
            _id: mockProduct._id,
            name: mockProduct.name,
            price: mockProduct.price,
            originalPrice: mockProduct.originalPrice,
            description: mockProduct.description,
            images: mockProduct.images || [],
            image: mockProduct.images?.[0],
            category: mockProduct.category,
            rating: mockProduct.averageRating,
            numReviews: mockProduct.ratings?.length || 0,
            stock: mockProduct.stock,
            brand: mockProduct.brand,
            specifications: mockProduct.specifications || {}
          });
          setLoading(false);
          return;
        }

        // Mock data for demo/seed IDs (legacy support)
        if (id && id.startsWith('seed')) {
          setTimeout(() => {
            setProduct({
              _id: id,
              name: id === 'seed1' ? 'Basmati Rice Seeds' : 'Organic Wheat Seeds',
              price: id === 'seed1' ? 450 : 350,
              originalPrice: id === 'seed1' ? 550 : 450,
              description: 'Premium quality seeds treated for disease resistance and high yield. Suitable for all soil types. Enhance your farming with our genetically superior seeds.',
              images: ['https://placehold.co/600x400/2E7D32/FFFFFF?text=Basmati+Seeds', 'https://placehold.co/600x400/81C784/FFFFFF?text=Packaging', 'https://placehold.co/600x400/A5D6A7/FFFFFF?text=Grains'],
              category: 'Seeds',
              rating: 4.8,
              numReviews: 142,
              stock: 50,
              brand: 'AgroGold',
              specifications: {
                type: 'Hybrid',
                maturity: '120-135 days',
                weight: '1 kg',
                usage: 'Soak seeds for 24 hours before sowing. maintain 2-3 inches of water level.',
                precautions: 'Do not use for human consumption directly. Treated with fungicide.'
              }
            });
            setLoading(false);
          }, 500);
          return;
        }

        // Simulate API delay for smoothness
        setTimeout(async () => {
          try {
            const response = await getProduct(id);
            if (response._id || response.id) {
              setProduct(response);
            } else {
              setError(response.message || 'Product not found');
            }
          } catch (apiError) {
            console.error('API error:', apiError);
            setError('Product not found');
          }
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to fetch product. Please try again.');
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const relatedProducts = [
    {
      id: 1,
      name: 'Bio Fertilizer',
      price: 750,
      image: 'https://placehold.co/400x300/4CAF50/FFFFFF?text=Bio+Fertilizer',
      category: 'Organic'
    },
    {
      id: 2,
      name: 'Soil Amendment',
      price: 650,
      image: 'https://placehold.co/400x300/81C784/FFFFFF?text=Soil+Amendment',
      category: 'Soil Health'
    },
    {
      id: 3,
      name: 'Micronutrient Mix',
      price: 950,
      image: 'https://placehold.co/400x300/A5D6A7/FFFFFF?text=Micronutrient+Mix',
      category: 'Nutrients'
    }
  ];

  const handleQuantityChange = (change) => {
    const newValue = quantity + change;
    if (newValue > 0 && newValue <= (product?.stock || 1)) {
      setQuantity(newValue);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      setSnackbar({
        open: true,
        message: `${product.name} added to cart!`,
        severity: 'success'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 4, mx: 'auto', maxWidth: 600 }}>
          {error || 'Product not found'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/customer/products')} size="large">
          Browse Products
        </Button>
      </Container>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image || 'https://placehold.co/600x400/2E7D32/FFFFFF?text=No+Image', 'https://placehold.co/600x400/81C784/FFFFFF?text=Side+View', 'https://placehold.co/600x400/A5D6A7/FFFFFF?text=Detail+View'];

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link underline="hover" color="inherit" href="/customer/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
          </Link>
          <Link underline="hover" color="inherit" href="/products">
            Products
          </Link>
          <Typography color="text.primary" fontWeight={500}>{product.name}</Typography>
        </Breadcrumbs>

        <Grid container spacing={6}>
          {/* Left Column: Images */}
          <Grid item xs={12} md={7} lg={6}>
            <Box sx={{ position: 'sticky', top: 100 }}>
              <Paper
                elevation={0}
                sx={{
                  overflow: 'hidden',
                  borderRadius: 4,
                  mb: 2,
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  aspectRatio: '4/3'
                }}
              >
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={images[selectedImage].startsWith('http') ? images[selectedImage] : `/uploads/${images[selectedImage]}`}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20px' }}
                />
                <IconButton
                  sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                </IconButton>
              </Paper>

              {/* Thumbnails */}
              <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                {images.map((img, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      minWidth: 80,
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: selectedImage === index ? theme.palette.primary.main : 'transparent',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      p: 1
                    }}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={img.startsWith('http') ? img : `/uploads/${img}`}
                      alt={`Thumbnail ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Right Column: Details */}
          <Grid item xs={12} md={5} lg={6}>
            <Box>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={product.category}
                  color="primary"
                  size="small"
                  sx={{ mb: 1.5, fontWeight: 600, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}
                />
                <Typography variant="h3" fontWeight="800" sx={{ mb: 1, color: '#1e293b' }}>
                  {product.name}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Rating value={product.rating || 4.5} precision={0.5} readOnly />
                  <Typography variant="body2" color="text.secondary">
                    {product.numReviews || 128} reviews
                  </Typography>
                  <Divider orientation="vertical" flexItem />
                  <Stack direction="row" spacing={0.5} alignItems="center" color="success.main">
                    <VerifiedIcon fontSize="small" />
                    <Typography variant="body2" fontWeight="600">In Stock</Typography>
                  </Stack>
                </Stack>
              </Box>

              <Box sx={{ mb: 4, p: 3, bgcolor: 'white', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ mb: 2 }}>
                  <Typography variant="h3" fontWeight="700" color="primary.main">
                    ₹{product.price}
                  </Typography>
                  {product.originalPrice && (
                    <>
                      <Typography variant="h6" sx={{ textDecoration: 'line-through', color: 'text.secondary', mb: 0.5 }}>
                        ₹{product.originalPrice}
                      </Typography>
                      <Chip
                        label={`${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF`}
                        color="error"
                        size="small"
                        sx={{ mb: 1, height: 24 }}
                      />
                    </>
                  )}
                </Stack>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {product.description}
                </Typography>

                {/* Quantity & Add to Cart */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                  <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#f8fafc' }}>
                    <IconButton onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                      <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ px: 2, fontWeight: 600, minWidth: 40, textAlign: 'center' }}>
                      {quantity}
                    </Typography>
                    <IconButton onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CartIcon />}
                    onClick={handleAddToCart}
                    fullWidth
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      py: 1.5,
                      boxShadow: '0 8px 20px rgba(46, 125, 50, 0.25)'
                    }}
                  >
                    Add to Cart
                  </Button>
                </Stack>
              </Box>

              {/* Features Grid */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                  { icon: <ShippingIcon color="primary" />, title: 'Fast Delivery', desc: 'Within 2-3 days' },
                  { icon: <CheckCircleIcon color="primary" />, title: 'Quality Assured', desc: '100% Original' },
                  { icon: <SupportIcon color="primary" />, title: 'Expert Support', desc: '24/7 Assistance' },
                ].map((feature, idx) => (
                  <Grid item xs={4} key={idx}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 2, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ mb: 1, p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'inline-flex' }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="subtitle2" fontWeight="700">{feature.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{feature.desc}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Tabs */}
              <Box>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label="Specifications" />
                  <Tab label="Usage Guide" />
                  <Tab label="Reviews" />
                </Tabs>

                <Box sx={{ minHeight: 200 }}>
                  {activeTab === 0 && (
                    <Box>
                      <List disablePadding>
                        {Object.entries(product.specifications || {}).map(([key, value]) => (
                          !['usage', 'precautions'].includes(key) && (
                            <ListItem key={key} divider>
                              <ListItemText
                                primary={key.replace(/([A-Z])/g, ' $1').trim()}
                                primaryTypographyProps={{ fontWeight: 600, textTransform: 'capitalize' }}
                              />
                              <Typography variant="body2">{value}</Typography>
                            </ListItem>
                          )
                        ))}
                        <ListItem divider>
                          <ListItemText primary="Brand" primaryTypographyProps={{ fontWeight: 600 }} />
                          <Typography variant="body2">{product.brand || 'Agrokart Generic'}</Typography>
                        </ListItem>
                      </List>
                    </Box>
                  )}
                  {activeTab === 1 && (
                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
                      <Typography variant="subtitle1" fontWeight="700" gutterBottom>How to Apply</Typography>
                      <Typography paragraph>{product.specifications?.usage || 'Detailed usage instructions will be provided with the packaging.'}</Typography>

                      <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
                        {product.specifications?.precautions || 'Keep away from children and pets. Store in a cool, dry place.'}
                      </Alert>
                    </Box>
                  )}
                </Box>
              </Box>

            </Box>
          </Grid>
        </Grid>

        {/* Related Products */}
        <Box sx={{ mt: 8, mb: 4 }}>
          <Typography variant="h4" fontWeight="700" gutterBottom sx={{ mb: 4 }}>Similar Products</Typography>
          <Grid container spacing={3}>
            {relatedProducts.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: 'white',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                  }}
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  <Box sx={{ position: 'relative', pt: '60%', mb: 2, borderRadius: 2, overflow: 'hidden', bgcolor: '#f1f5f9' }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Typography variant="body2" color="primary" fontWeight="600">{item.category}</Typography>
                  <Typography variant="h6" fontWeight="700">{item.name}</Typography>
                  <Typography variant="h6" color="secondary" sx={{ mt: 1 }}>₹{item.price}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductDetailPage; 