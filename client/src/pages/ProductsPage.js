import React, { useState, useEffect } from "react";
import {
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
  Select,
  MenuItem,
  useTheme,
  Drawer,
  Checkbox,
  FormControlLabel,
  Paper,
  Divider,
  Stack,
  useMediaQuery,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  FilterList as FilterIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { mockProducts } from "../data/mockProducts";

const FilterContent = ({
  categories,
  categoryFilter,
  setCategoryFilter,
  clearFilters,
}) => {
  return (
    <Box sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="700" sx={{ color: "#111827" }}>
          Filters
        </Typography>
        <Button size="small" onClick={clearFilters} sx={{ color: "#DC2626", textTransform: "none", fontWeight: 600 }}>
          Clear All
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Typography variant="caption" fontWeight="700" sx={{ color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, display: "block", mb: 1 }}>
        Categories
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {categories.map((category) => (
          <FormControlLabel
            key={category}
            control={
              <Checkbox
                checked={categoryFilter.includes(category)}
                onChange={(e) => {
                  if (e.target.checked) setCategoryFilter([...categoryFilter, category]);
                  else setCategoryFilter(categoryFilter.filter((c) => c !== category));
                }}
                size="small"
                sx={{
                  color: "#6B7280",
                  "&.Mui-checked": { color: "#1B5E20" },
                }}
              />
            }
            label={<Typography variant="body2" fontWeight={500} sx={{ fontSize: "0.88rem" }}>{category}</Typography>}
          />
        ))}
      </Box>
    </Box>
  );
};

const ProductsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [products, setProducts] = useState(mockProducts);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  const categories = [
    "Fertilizers",
    "Pesticides",
    "Seeds",
    "Organic",
    "Micronutrients",
    "Tools",
  ];

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && categories.includes(cat)) {
      setCategoryFilter([cat]);
    }
  }, [location.search]);

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setCategoryFilter([]);
    setSortBy("name");
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter.length > 0 && !categoryFilter.includes(p.category)) {
      return false;
    }
    const search = searchParams.get("search");
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") return (b.averageRating || 0) - (a.averageRating || 0);
    return a.name.localeCompare(b.name);
  });

  return (
    <Box sx={{ width: "100%", bgcolor: "#F9FAFB", minHeight: "100vh", py: 3, px: { xs: 2, sm: 3, md: 4 }, boxSizing: "border-box" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" onClick={() => navigate("/")} sx={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "0.85rem" }}>
          <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} /> Home
        </Link>
        <Typography color="text.primary" fontWeight={600} sx={{ fontSize: "0.85rem" }}>Products</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: "#111827" }}>
            Agricultural Marketplace ({filteredProducts.length})
          </Typography>
          <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.85rem" }}>
            Certified fertilizers, seeds, and farm protection supplies delivered to your farm
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          {isMobile && (
            <Button variant="outlined" startIcon={<FilterIcon />} onClick={() => setMobileOpen(true)} sx={{ borderColor: "#1B5E20", color: "#1B5E20" }}>
              Filters
            </Button>
          )}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ borderRadius: "6px", bgcolor: "white", fontSize: "0.85rem" }}>
              <MenuItem value="name">Sort by: Name</MenuItem>
              <MenuItem value="price-low">Price: Low to High</MenuItem>
              <MenuItem value="price-high">Price: High to Low</MenuItem>
              <MenuItem value="rating">Top Rated</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Desktop Sidebar Filter */}
        <Grid item md={3} lg={2.5} sx={{ display: { xs: "none", md: "block" } }}>
          <Paper elevation={0} sx={{ border: "1px solid #E5E7EB", borderRadius: "8px", bgcolor: "white", position: "sticky", top: 90 }}>
            <FilterContent categories={categories} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} clearFilters={clearFilters} />
          </Paper>
        </Grid>

        {/* Mobile Filter Drawer */}
        <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: 280 } }}>
          <FilterContent categories={categories} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} clearFilters={clearFilters} />
        </Drawer>

        {/* Products Grid */}
        <Grid item xs={12} md={9} lg={9.5}>
          {filteredProducts.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: "center", borderRadius: "8px", bgcolor: "white", border: "1px solid #E5E7EB" }}>
              <Typography variant="h6" color="text.secondary">No products found matching your filter.</Typography>
              <Button onClick={clearFilters} sx={{ mt: 2 }} variant="contained" sx={{ bgcolor: "#1B5E20" }}>Clear Filters</Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <Grid item xs={6} sm={4} md={4} lg={3} key={product._id || product.id} component={motion.div} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                      boxShadow: "none",
                      bgcolor: "white",
                      transition: "all 0.15s ease",
                      "&:hover": { borderColor: "#2E7D32", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" },
                    }}>
                      <Box sx={{ position: "relative", pt: "75%", bgcolor: "#FFFFFF", overflow: "hidden", borderBottom: "1px solid #F3F4F6" }}>
                        <CardMedia
                          component="img"
                          image={product.images?.[0] || product.image || "/api/placeholder/400/300"}
                          alt={product.name}
                          sx={{
                            position: "absolute",
                            top: 0, left: 0,
                            width: "100%", height: "100%",
                            objectFit: "contain",
                            p: 1.5,
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => toggleFavorite(e, product._id || product.id)}
                          sx={{ position: "absolute", top: 8, right: 8, bgcolor: "white", border: "1px solid #E5E7EB", p: 0.5 }}
                        >
                          {favorites.has(product._id || product.id) ? <FavoriteIcon fontSize="small" color="error" /> : <FavoriteBorderIcon fontSize="small" />}
                        </IconButton>
                      </Box>

                      <CardContent sx={{ p: 1.8, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <Box>
                          <Typography variant="caption" fontWeight={600} sx={{ color: "#6B7280", textTransform: "uppercase", fontSize: "0.68rem" }}>
                            {product.category}
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={600} sx={{
                            mt: 0.3, mb: 0.8,
                            lineHeight: 1.3,
                            height: 38,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            fontSize: "0.9rem",
                          }}>
                            {product.name}
                          </Typography>

                          <Stack direction="row" spacing={0.5} alignItems="center" mb={1.2}>
                            <Rating value={product.averageRating || 4.5} readOnly size="small" precision={0.5} sx={{ fontSize: "0.85rem" }} />
                            <Typography variant="caption" color="text.secondary">({product.ratings?.length || 12})</Typography>
                          </Stack>
                        </Box>

                        <Box>
                          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1.2 }}>
                            <Typography variant="h6" fontWeight={800} sx={{ color: "#111827", fontSize: "1.05rem" }}>
                              ₹{product.price}
                            </Typography>
                            {product.originalPrice > product.price && (
                              <Typography variant="caption" sx={{ textDecoration: "line-through", color: "#9CA3AF" }}>
                                ₹{product.originalPrice}
                              </Typography>
                            )}
                          </Box>

                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<CartIcon fontSize="small" />}
                            onClick={() => addToCart(product)}
                            sx={{
                              bgcolor: "#1B5E20",
                              color: "white",
                              fontWeight: 600,
                              borderRadius: "6px",
                              py: 0.7,
                              textTransform: "none",
                              fontSize: "0.82rem",
                              "&:hover": { bgcolor: "#14532D" },
                            }}
                          >
                            Add to Cart
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductsPage;
