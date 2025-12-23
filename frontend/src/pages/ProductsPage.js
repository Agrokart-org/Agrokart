import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Rating,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Skeleton,
  useTheme,
  alpha,
  Alert,
  Drawer,
  Slider,
  Checkbox,
  FormControlLabel,
  Paper,
  Divider,
  Stack,
  useMediaQuery,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  FilterList as FilterIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Visibility as ViewIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWorkflow } from '../components/WorkflowManager';
import { motion, AnimatePresence } from 'framer-motion';

import SearchSuggestions from '../components/SearchSuggestions';
import { mockProducts } from '../data/mockProducts';

const FilterContent = ({
  categories,
  categoryFilter,
  setCategoryFilter,
  priceRange,
  setPriceRange,
  minRating,
  setMinRating,
  clearFilters,
  maxPrice
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="700">Filters</Typography>
        <Button size="small" onClick={clearFilters} color="secondary">Clear All</Button>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* Categories */}
      <Typography variant="subtitle1" fontWeight="600" gutterBottom>Categories</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
        {categories.map(category => (
          <FormControlLabel
            key={category}
            control={
              <Checkbox
                checked={categoryFilter.includes(category)}
                onChange={(e) => {
                  if (e.target.checked) setCategoryFilter([...categoryFilter, category]);
                  else setCategoryFilter(categoryFilter.filter(c => c !== category));
                }}
                size="small"
                sx={{ color: theme.palette.secondary.main, '&.Mui-checked': { color: theme.palette.secondary.main } }}
              />
            }
            label={<Typography variant="body2">{category}</Typography>}
            sx={{ mb: 0.5 }}
          />
        ))}
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* Price */}
      <Typography variant="subtitle1" fontWeight="600" gutterBottom>Price Range</Typography>
      <Box sx={{ px: 1, mb: 3 }}>
        <Slider
          value={priceRange}
          onChange={(e, newValue) => setPriceRange(newValue)}
          valueLabelDisplay="auto"
          min={0}
          max={maxPrice}
          step={50}
          sx={{ color: theme.palette.tertiary.main }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption">₹{priceRange[0]}</Typography>
          <Typography variant="caption">₹{priceRange[1]}+</Typography>
        </Box>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* Rating */}
      <Typography variant="subtitle1" fontWeight="600" gutterBottom>Rating</Typography>
      <Box sx={{ mb: 3 }}>
        {[4, 3, 2, 1].map((rating) => (
          <Box
            key={rating}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              mb: 1,
              opacity: minRating === rating ? 1 : 0.7,
              '&:hover': { opacity: 1 }
            }}
            onClick={() => setMinRating(rating)}
          >
            <Rating value={rating} readOnly size="small" />
            <Typography variant="body2" sx={{ ml: 1 }}>& Up</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const ProductsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { transitionTo, WORKFLOW_STEPS } = useWorkflow();

  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState(new Set());
  const [searchFromNav, setSearchFromNav] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const productsPerPage = 12;

  // Effects
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    const categoryFromUrl = searchParams.get('category');

    if (searchFromUrl) {
      setSearchFromNav(searchFromUrl);
      setSearchQuery(searchFromUrl);
      setCurrentPage(1);
    }

    if (categoryFromUrl) {
      setCategoryFilter([categoryFromUrl]); // Treat as single selection initially
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Derived Data
  const categories = [...new Set(products.map(product => product.category))];
  const maxPrice = Math.max(...products.map(p => p.price), 5000);

  // Filter Logic
  const filteredProducts = products
    .filter(product => {
      const effectiveSearchQuery = searchFromNav || searchQuery;
      // Search
      const matchesSearch = !effectiveSearchQuery ||
        product.name.toLowerCase().includes(effectiveSearchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(effectiveSearchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(effectiveSearchQuery.toLowerCase());

      // Category
      const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes('all') || categoryFilter.includes(product.category);

      // Price
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      // Rating
      const matchesRating = product.averageRating >= minRating;

      return matchesSearch && matchesCategory && matchesPrice && matchesRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return b.averageRating - a.averageRating;
        case 'name': default: return a.name.localeCompare(b.name);
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  // Handlers
  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product);
    transitionTo(WORKFLOW_STEPS.ADD_TO_CART, { product });
  };

  const handleProductView = (productId) => {
    transitionTo(WORKFLOW_STEPS.PRODUCT_DETAIL, { productId });
    navigate(`/product/${productId}`);
  };

  const toggleFavorite = (e, productId) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) newFavorites.delete(productId);
      else newFavorites.add(productId);
      return newFavorites;
    });
  };

  const clearFilters = () => {
    setCategoryFilter([]);
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setSearchQuery('');
    setSearchFromNav('');
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('search');
    newSearchParams.delete('category');
    setSearchParams(newSearchParams);
  };



  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: '80vh' }}>

      {/* Breadcrumbs & Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/customer/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
          </Link>
          <Typography color="text.primary">Shop</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" fontWeight="800" sx={{ color: theme.palette.text.primary }}>
            {searchFromNav ? `Results for "${searchFromNav}"` : 'Our Products'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {isMobile && (
              <Button
                startIcon={<FilterIcon />}
                variant="outlined"
                onClick={() => setMobileOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Filters
              </Button>
            )}

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              size="small"
              sx={{ minWidth: 150, borderRadius: 2, bgcolor: 'white' }}
              displayEmpty
            >
              <MenuItem value="name">Sort by: Name</MenuItem>
              <MenuItem value="price-low">Price: Low to High</MenuItem>
              <MenuItem value="price-high">Price: High to Low</MenuItem>
              <MenuItem value="rating">Top Rated</MenuItem>
            </Select>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Sidebar (Desktop) */}
        <Grid item md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, position: 'sticky', top: 100 }}>
            <FilterContent
              categories={categories}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              minRating={minRating}
              setMinRating={setMinRating}
              clearFilters={clearFilters}
              maxPrice={maxPrice}
            />
          </Paper>
        </Grid>

        {/* Mobile Filter Drawer */}
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: 280, borderRadius: '0 20px 20px 0' } }}
        >
          <FilterContent
            categories={categories}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            minRating={minRating}
            setMinRating={setMinRating}
            clearFilters={clearFilters}
            maxPrice={maxPrice}
          />
        </Drawer>

        {/* Product Grid */}
        <Grid item xs={12} md={9}>
          {loading ? (
            <Grid container spacing={3}>
              {[...Array(6)].map((_, i) => (
                <Grid item xs={12} sm={6} lg={4} key={i}>
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          ) : filteredProducts.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Typography variant="h6" color="text.secondary">No products found matching your criteria.</Typography>
              <Button onClick={clearFilters} sx={{ mt: 2 }} variant="contained">Clear Filters</Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              <AnimatePresence>
                {paginatedProducts.map((product) => (
                  <Grid item xs={12} sm={6} lg={4} key={product._id} component={motion.div} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        position: 'relative',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s ease',
                        bgcolor: 'white',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 12px 24px -10px rgba(0,0,0,0.15)',
                          borderColor: theme.palette.secondary.main,
                          '& .product-actions': { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
                          '& .product-img': { transform: 'scale(1.05)' }
                        }
                      }}
                      onClick={() => handleProductView(product._id)}
                    >
                      {/* Badge / Favorites */}
                      <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => toggleFavorite(e, product._id)}
                          sx={{
                            bgcolor: 'white',
                            boxShadow: 1,
                            '&:hover': { bgcolor: '#ffebee', color: 'error.main' },
                            color: favorites.has(product._id) ? 'error.main' : 'text.secondary'
                          }}
                        >
                          {favorites.has(product._id) ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                        </IconButton>
                      </Box>

                      {/* Stock Badge */}
                      {product.stock === 0 && (
                        <Chip
                          label="Out of Stock"
                          size="small"
                          color="error"
                          sx={{ position: 'absolute', top: 12, left: 12, zIndex: 5, fontWeight: 700 }}
                        />
                      )}

                      {/* Image Area */}
                      <Box sx={{ position: 'relative', pt: '75%', overflow: 'hidden', borderRadius: '12px 12px 0 0', bgcolor: '#f5f5f7' }}>
                        <CardMedia
                          component="img"
                          image={product.images?.[0] || '/api/placeholder/400/300'}
                          alt={product.name}
                          className="product-img"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            p: 2,
                            transition: 'transform 0.5s ease'
                          }}
                        />

                        {/* Hover Actions */}
                        <Box
                          className="product-actions"
                          sx={{
                            position: 'absolute',
                            bottom: 10,
                            left: '50%',
                            transform: { xs: 'translateX(-50%) translateY(0)', md: 'translateX(-50%) translateY(20px)' },
                            opacity: { xs: 1, md: 0 },
                            zIndex: 2,
                            transition: 'all 0.3s ease',
                            width: '90%',
                            display: 'flex',
                            gap: 1
                          }}
                        >
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<CartIcon />}
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={product.stock === 0}
                            sx={{
                              bgcolor: theme.palette.text.primary,
                              color: 'white',
                              '&:hover': { bgcolor: theme.palette.primary.main },
                              borderRadius: 2,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                          >
                            Add
                          </Button>
                        </Box>
                      </Box>

                      <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          {product.category}
                        </Typography>

                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.2, height: 48, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {product.name}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Rating value={product.averageRating} readOnly size="small" precision={0.5} />
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>({product.ratings?.length || 0})</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="h5" color="secondary" fontWeight="800">
                              ₹{product.price}
                            </Typography>
                            {product.originalPrice > product.price && (
                              <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                                ₹{product.originalPrice}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), px: 1, py: 0.5, borderRadius: 1 }}>
                            {product.unit}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, v) => setCurrentPage(v)}
                color="secondary"
                size="large"
                shape="rounded"
              />
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductsPage;
