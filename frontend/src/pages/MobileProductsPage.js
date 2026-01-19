import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Checkbox,
  Slider,
  useTheme,
  InputAdornment,
  TextField,
  alpha,
  Snackbar,
  Alert
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Star as StarIcon,
  Add as AddIcon,
  Sort as SortIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import productsService from '../services/productsService';
import ProductImage from '../components/ProductImage';
import { motion, AnimatePresence } from 'framer-motion';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const MobileProductsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    priceRange: [0, 2000],
    rating: 0,
    inStock: false
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    try {
      const allProducts = productsService.getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      // Mock data fallback if needed... (omitted for brevity, relying on service or previous mock)
      // Re-using the mock data from previous version if service fails would be safest, but assuming service works or has mock inside.
      // For safety, let's keep the mock data fallback.
      const mockProducts = [
        { id: 1, name: 'NPK Fertilizer Premium', price: 850, originalPrice: 1200, discount: 29, rating: 4.5, image: '/api/placeholder/200/200', category: 'Fertilizers', inStock: true },
        { id: 2, name: 'Organic Compost', price: 450, originalPrice: 600, discount: 25, rating: 4.3, image: '/api/placeholder/200/200', category: 'Organic', inStock: true },
        { id: 3, name: 'Wheat Seeds Premium', price: 320, originalPrice: 400, discount: 20, rating: 4.7, image: '/api/placeholder/200/200', category: 'Seeds', inStock: true },
        { id: 4, name: 'Plant Growth Booster', price: 280, originalPrice: 350, discount: 20, rating: 4.4, image: '/api/placeholder/200/200', category: 'Fertilizers', inStock: false },
        { id: 5, name: 'Organic Pesticide', price: 380, originalPrice: 450, discount: 16, rating: 4.2, image: '/api/placeholder/200/200', category: 'Pesticides', inStock: true },
        { id: 6, name: 'Drip Irrigation Kit', price: 1200, originalPrice: 1500, discount: 20, rating: 4.6, image: '/api/placeholder/200/200', category: 'Equipment', inStock: true }
      ];
      setProducts(mockProducts);
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, sortBy, products]);

  const applyFilters = () => {
    let filtered = [...products];

    if (filters.category) {
      filtered = filtered.filter(product =>
        product.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    filtered = filtered.filter(product => {
      const price = typeof product.price === 'string' ? parseFloat(product.price.replace(/[₹,]/g, '')) : product.price;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    if (filters.rating > 0) {
      filtered = filtered.filter(product => product.rating >= filters.rating);
    }

    if (filters.inStock) {
      filtered = filtered.filter(product => product.inStock || product.availability === 'In Stock');
    }

    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => (typeof a.price === 'string' ? parseFloat(a.price.replace(/[₹,]/g, '')) : a.price) - (typeof b.price === 'string' ? parseFloat(b.price.replace(/[₹,]/g, '')) : b.price));
        break;
      case 'price_high':
        filtered.sort((a, b) => (typeof b.price === 'string' ? parseFloat(b.price.replace(/[₹,]/g, '')) : b.price) - (typeof a.price === 'string' ? parseFloat(a.price.replace(/[₹,]/g, '')) : a.price));
        break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'discount': filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0)); break;
      default: break;
    }
    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product) => {
    addToCart({ ...product, quantity: 1 });
    setSnackbar({ open: true, message: `${product.name} added to cart!`, severity: 'success' });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const categories = ['Fertilizers', 'Seeds', 'Pesticides', 'Equipment', 'Organic', 'Tools'];
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'discount', label: 'Discount' }
  ];

  return (
    <Box sx={{ bgcolor: '#F9FAFB', minHeight: '100vh', pb: 4 }}>
      {/* Header */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        ...theme.glass(0.95),
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        px: 2,
        py: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
          <IconButton onClick={() => navigate(-1)} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              placeholder="Search products..."
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                sx: { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.03)', '& fieldset': { border: 'none' } }
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" fontWeight="600" color="text.secondary">
            {filteredProducts.length} Results
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SortIcon />}
              onClick={() => setSortOpen(true)}
              sx={{ borderRadius: 2, borderColor: '#E0E0E0', color: 'text.primary', textTransform: 'none' }}
            >
              Sort
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterIcon />}
              onClick={() => setFilterOpen(true)}
              sx={{ borderRadius: 2, borderColor: '#E0E0E0', color: 'text.primary', textTransform: 'none', bgcolor: (filters.category || filters.rating > 0) ? '#E8F5E9' : 'transparent' }}
            >
              Filter
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Active Filters Chips */}
      {(filters.category || filters.rating > 0 || filters.inStock) && (
        <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filters.category && (
            <Chip label={filters.category} size="small" onDelete={() => setFilters(prev => ({ ...prev, category: '' }))} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontWeight: 600 }} />
          )}
          {filters.rating > 0 && (
            <Chip label={`${filters.rating}+ Rating`} size="small" onDelete={() => setFilters(prev => ({ ...prev, rating: 0 }))} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main, fontWeight: 600 }} />
          )}
          {filters.inStock && (
            <Chip label="In Stock" size="small" onDelete={() => setFilters(prev => ({ ...prev, inStock: false }))} sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, fontWeight: 600 }} />
          )}
        </Box>
      )}

      {/* Products Grid */}
      <Box sx={{ px: 2, py: 1 }}>
        <Grid container spacing={2}>
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <Grid item xs={6} key={product.id} component={motion.div} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, delay: index * 0.05 }}>
                <MotionCard
                  whileTap={{ scale: 0.96 }}
                  sx={{
                    borderRadius: 3,
                    boxShadow: 'none',
                    border: '1px solid #F0F0F0',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'visible'
                  }}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <Box sx={{ position: 'relative', pt: '100%' }}>
                    <ProductImage
                      product={product}
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                    />
                    {product.discount > 0 && (
                      <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: '#FF5722', color: 'white', px: 0.8, py: 0.2, borderRadius: 1, fontSize: '0.65rem', fontWeight: 'bold' }}>
                        {product.discount}% OFF
                      </Box>
                    )}
                  </Box>
                  <CardContent sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" fontWeight="600" sx={{ mb: 0.5, lineHeight: 1.2, height: 32, overflow: 'hidden' }}>
                      {product.name}
                    </Typography>

                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="800" color="primary">₹{product.price}</Typography>
                          {product.originalPrice > product.price && (
                            <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>₹{product.originalPrice}</Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#FFF8E1', px: 0.5, borderRadius: 0.5 }}>
                          <StarIcon sx={{ fontSize: 12, color: '#FFC107' }} />
                          <Typography variant="caption" fontWeight="bold" sx={{ ml: 0.3, color: '#FFA000' }}>{product.rating}</Typography>
                        </Box>
                      </Box>

                      {(product.inStock || product.availability === 'In Stock' || product.countInStock > 0) ? (
                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 0.5, fontSize: '0.75rem', boxShadow: 'none' }}
                        >
                          Add
                        </Button>
                      ) : (
                        <Button fullWidth variant="outlined" disabled size="small" sx={{ borderRadius: 2, fontSize: '0.7rem' }}>Out of Stock</Button>
                      )}
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      </Box>

      {/* Filter Drawer */}
      <Drawer
        anchor="bottom"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        PaperProps={{ sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24 } }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="800">Filters</Typography>
            <IconButton onClick={() => setFilterOpen(false)} size="small" sx={{ bgcolor: '#F5F5F5' }}><CloseIcon /></IconButton>
          </Box>

          <Typography variant="subtitle2" fontWeight="700" gutterBottom>Category</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                clickable
                onClick={() => setFilters(prev => ({ ...prev, category: prev.category === cat ? '' : cat }))}
                sx={{
                  bgcolor: filters.category === cat ? 'primary.main' : '#F5F5F5',
                  color: filters.category === cat ? 'white' : 'text.primary',
                  fontWeight: 600
                }}
              />
            ))}
          </Box>

          <Typography variant="subtitle2" fontWeight="700" gutterBottom>Price Range (₹0 - ₹2000)</Typography>
          <Box sx={{ px: 1, mb: 3 }}>
            <Slider
              value={filters.priceRange}
              onChange={(e, val) => setFilters(prev => ({ ...prev, priceRange: val }))}
              min={0} max={2000}
              valueLabelDisplay="auto"
              sx={{ color: 'primary.main' }}
            />
          </Box>

          <Button fullWidth variant="contained" size="large" onClick={() => setFilterOpen(false)} sx={{ borderRadius: 3, fontWeight: 'bold' }}>
            Apply Filters
          </Button>
        </Box>
      </Drawer>

      {/* Sort Drawer */}
      <Drawer
        anchor="bottom"
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        PaperProps={{ sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24 } }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="800" sx={{ mb: 2 }}>Sort By</Typography>
          <List>
            {sortOptions.map((opt) => (
              <ListItem
                button
                key={opt.value}
                onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: sortBy === opt.value ? '#E8F5E9' : 'transparent',
                  color: sortBy === opt.value ? 'primary.main' : 'text.primary'
                }}
              >
                <ListItemText primary={opt.label} primaryTypographyProps={{ fontWeight: sortBy === opt.value ? 700 : 500 }} />
                {sortBy === opt.value && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />}
              </ListItem>
            ))}
          </List>
        </Box>

      </Drawer >

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 70, md: 24 } }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box >
  );
};

export default MobileProductsPage;
