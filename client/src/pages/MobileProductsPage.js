import React, { useState, useEffect } from "react";
import { getProductImage } from "../data/productImages";

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
  Alert,
} from "@mui/material";
import {
  FilterList as FilterIcon,
  Star as StarIcon,
  Add as AddIcon,
  Sort as SortIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  ArrowBack,
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import productsService from "../services/productsService";
import ProductImage from "../components/ProductImage";
import { motion, AnimatePresence } from "framer-motion";

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
    category: searchParams.get("category") || "",
    searchTerm: searchParams.get("search") || searchParams.get("q") || "",
    priceRange: [0, 5000],
    rating: 0,
    inStock: false,
  });
  const [sortBy, setSortBy] = useState("relevance");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Update filters when search params change (e.g. from Home page click)
  useEffect(() => {
    const cat = searchParams.get("category");
    const search = searchParams.get("search") || searchParams.get("q");
    setFilters((prev) => ({
      ...prev,
      category: cat || "",
      searchTerm: search || "",
    }));
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const allProducts = await productsService.fetchProducts();
        setProducts(allProducts);
      } catch (error) {
        console.error("Error loading products:", error);
        // Clean fallback
        setProducts([]);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, sortBy, products]);

  const applyFilters = () => {
    let filtered = [...products];
    console.log("applyFilters - Initial products count:", filtered.length);
    console.log("applyFilters - Current filters:", filters);

    if (filters.searchTerm) {
      const q = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          (product.category && product.category.toLowerCase().includes(q)),
      );
    }

    if (filters.category) {
      filtered = filtered.filter((product) => {
        const match =
          product.category &&
          product.category
            .toLowerCase()
            .includes(filters.category.toLowerCase());
        return match;
      });
      console.log(
        "applyFilters - Count after category filter:",
        filtered.length,
      );
    }

    filtered = filtered.filter((product) => {
      const price =
        typeof product.price === "string"
          ? parseFloat(product.price.replace(/[₹,]/g, ""))
          : product.price;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    if (filters.rating > 0) {
      filtered = filtered.filter((product) => product.rating >= filters.rating);
    }

    if (filters.inStock) {
      filtered = filtered.filter(
        (product) => product.inStock || product.availability === "In Stock",
      );
    }

    switch (sortBy) {
      case "price_low":
        filtered.sort(
          (a, b) =>
            (typeof a.price === "string"
              ? parseFloat(a.price.replace(/[₹,]/g, ""))
              : a.price) -
            (typeof b.price === "string"
              ? parseFloat(b.price.replace(/[₹,]/g, ""))
              : b.price),
        );
        break;
      case "price_high":
        filtered.sort(
          (a, b) =>
            (typeof b.price === "string"
              ? parseFloat(b.price.replace(/[₹,]/g, ""))
              : b.price) -
            (typeof a.price === "string"
              ? parseFloat(a.price.replace(/[₹,]/g, ""))
              : a.price),
        );
        break;
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "discount":
        filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      default:
        break;
    }
    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product) => {
    addToCart({ ...product, quantity: 1 });
    setSnackbar({
      open: true,
      message: `${product.name} added to cart!`,
      severity: "success",
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const categories = [
    "Bio-Fertilizers",
    "Micronutrients",
    "NPK Fertilizers",
    "Organic",
    "Pesticides",
    "Seeds",
    "Tools",
    "Urea",
  ];
  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "rating", label: "Customer Rating" },
    { value: "discount", label: "Discount" },
  ];

  return (
    <Box sx={{ bgcolor: "#F9FAFB", minHeight: "100vh", pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          ...theme.glass(0.95),
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          px: 2,
          py: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{ bgcolor: "rgba(0,0,0,0.05)" }}
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              placeholder="Search products..."
              variant="outlined"
              size="small"
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 3,
                  bgcolor: "rgba(0,0,0,0.03)",
                  "& fieldset": { border: "none" },
                },
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" fontWeight="600" color="text.secondary">
            {filteredProducts.length} Results
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SortIcon />}
              onClick={() => setSortOpen(true)}
              sx={{
                borderRadius: 2,
                borderColor: "#E0E0E0",
                color: "text.primary",
                textTransform: "none",
              }}
            >
              Sort
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterIcon />}
              onClick={() => setFilterOpen(true)}
              sx={{
                borderRadius: 2,
                borderColor: "#E0E0E0",
                color: "text.primary",
                textTransform: "none",
                bgcolor:
                  filters.category || filters.rating > 0
                    ? "#E8F5E9"
                    : "transparent",
              }}
            >
              Filter
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Active Filters Chips */}
      {(filters.category || filters.rating > 0 || filters.inStock) && (
        <Box sx={{ px: 2, py: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {filters.category && (
            <Chip
              label={filters.category}
              size="small"
              onDelete={() => setFilters((prev) => ({ ...prev, category: "" }))}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 600,
              }}
            />
          )}
          {filters.rating > 0 && (
            <Chip
              label={`${filters.rating}+ Rating`}
              size="small"
              onDelete={() => setFilters((prev) => ({ ...prev, rating: 0 }))}
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                fontWeight: 600,
              }}
            />
          )}
          {filters.inStock && (
            <Chip
              label="In Stock"
              size="small"
              onDelete={() =>
                setFilters((prev) => ({ ...prev, inStock: false }))
              }
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                fontWeight: 600,
              }}
            />
          )}
        </Box>
      )}

      {/* Products Grid */}
      <Box sx={{ px: 2, py: 1 }}>
        <Grid container spacing={2}>
          <AnimatePresence>
            {filteredProducts.map((product, index) => {
              const stockVal = product.stock || product.countInStock || 0;
              const stockColor =
                stockVal > 20
                  ? "#388E3C"
                  : stockVal > 0
                    ? "#F57C00"
                    : "#D32F2F";
              const catIcons = {
                urea: "💧",
                dap: "💎",
                npk: "⚗️",
                organic: "🌿",
                other: "📦",
                "Bio-Fertilizers": "🦠",
                Micronutrients: "🔬",
                "NPK Fertilizers": "⚗️",
                Organic: "🌿",
                Pesticides: "🛡️",
                Seeds: "🌱",
                Tools: "🛠️",
                Urea: "💧",
              };
              const catColors = {
                urea: "#E3F2FD",
                dap: "#EDE7F6",
                npk: "#E8F5E9",
                organic: "#F1F8E9",
                other: "#FFF8E1",
                "Bio-Fertilizers": "#E8F5E9",
                Micronutrients: "#F3E5F5",
                "NPK Fertilizers": "#E8F5E9",
                Organic: "#F1F8E9",
                Pesticides: "#FFEBEE",
                Seeds: "#F1F8E9",
                Tools: "#ECEFF1",
                Urea: "#E3F2FD",
              };
              const catTextColors = {
                urea: "#1565C0",
                dap: "#6A1B9A",
                npk: "#2E7D32",
                organic: "#33691E",
                other: "#E65100",
                "Bio-Fertilizers": "#2E7D32",
                Micronutrients: "#7B1FA2",
                "NPK Fertilizers": "#2E7D32",
                Organic: "#33691E",
                Pesticides: "#C62828",
                Seeds: "#558B2F",
                Tools: "#455A64",
                Urea: "#1565C0",
              };
              const bgColor = catColors[product.category] || "#F5F5F5";
              const iconColor = catTextColors[product.category] || "#5D4037";
              return (
                <Grid
                  item
                  xs={6}
                  key={product.id || product._id}
                  component={motion.div}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                >
                  <MotionCard
                    whileTap={{ scale: 0.97 }}
                    onClick={() =>
                      navigate(`/product/${product.id || product._id}`)
                    }
                    sx={{
                      borderRadius: 2.5,
                      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                      border: "1px solid rgba(0,0,0,0.06)",
                      overflow: "hidden",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      bgcolor: "background.paper",
                      transition: "box-shadow 0.2s ease",
                      "&:hover": { boxShadow: "0 6px 24px rgba(0,0,0,0.12)" },
                    }}
                  >
                    {/* Product Visual Area — Real Image */}
                    <Box
                      sx={{
                        bgcolor: "#fff",
                        height: 110,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        flexShrink: 0,
                        borderBottom: `2px solid ${bgColor}`,
                      }}
                    >
                      <Box
                        component="img"
                        src={getProductImage(
                          product.name,
                          product.category,
                          product.image || product.images?.[0],
                        )}
                        alt={product.name}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          p: 0.8,
                        }}
                      />
                      {/* Fallback emoji */}
                      <Box
                        sx={{
                          display: "none",
                          width: "100%",
                          height: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: bgColor,
                          fontSize: 44,
                        }}
                      >
                        {catIcons[product.category] || "📦"}
                      </Box>
                      {/* Stock badge */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          bgcolor: stockColor,
                          color: "#fff",
                          px: 0.8,
                          py: 0.2,
                          borderRadius: 1,
                          fontSize: "0.6rem",
                          fontWeight: 800,
                          lineHeight: 1.4,
                        }}
                      >
                        {stockVal > 20
                          ? "IN STOCK"
                          : stockVal > 0
                            ? "LOW"
                            : "OUT"}
                      </Box>
                      {/* Brand badge */}
                      {product.brand && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            bgcolor: "rgba(255,255,255,0.9)",
                            px: 0.7,
                            py: 0.2,
                            borderRadius: 0.8,
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            color: iconColor,
                            lineHeight: 1.4,
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          {product.brand}
                        </Box>
                      )}
                    </Box>

                    {/* Product Info */}
                    <Box
                      sx={{
                        p: 1.5,
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: iconColor,
                          fontWeight: 700,
                          fontSize: "0.6rem",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          mb: 0.3,
                          display: "block",
                        }}
                      >
                        {product.category}
                      </Typography>

                      <Typography
                        variant="body2"
                        fontWeight="700"
                        sx={{
                          lineHeight: 1.25,
                          mb: 0.8,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          fontSize: "0.82rem",
                        }}
                      >
                        {product.name}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 0.5,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          fontWeight="900"
                          sx={{ color: "#1B5E20", fontSize: "1rem" }}
                        >
                          ₹{product.price}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          /{product.unit || "kg"}
                        </Typography>
                      </Box>

                      {product.originalPrice > product.price && (
                        <Typography
                          variant="caption"
                          sx={{
                            textDecoration: "line-through",
                            color: "text.disabled",
                            mb: 0.5,
                            display: "block",
                          }}
                        >
                          ₹{product.originalPrice}
                        </Typography>
                      )}

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.4,
                          mb: 1.5,
                        }}
                      >
                        <StarIcon sx={{ fontSize: 12, color: "#FFC107" }} />
                        <Typography
                          variant="caption"
                          fontWeight="700"
                          color="text.secondary"
                          sx={{ fontSize: "0.72rem" }}
                        >
                          {Number(
                            product.rating || product.averageRating || 4.0,
                          ).toFixed(1)}
                        </Typography>
                      </Box>

                      {/* Add to Cart Button */}
                      <Box sx={{ mt: "auto" }}>
                        {stockVal > 0 ? (
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              py: 0.9,
                              boxShadow: "none",
                              background:
                                "linear-gradient(135deg, #2E7D32, #43A047)",
                              "&:hover": {
                                boxShadow: "0 4px 12px rgba(46,125,50,0.3)",
                              },
                              "&:active": { transform: "scale(0.97)" },
                            }}
                          >
                            + Add to Cart
                          </Button>
                        ) : (
                          <Button
                            fullWidth
                            variant="outlined"
                            disabled
                            size="small"
                            sx={{
                              borderRadius: 2,
                              fontSize: "0.72rem",
                              py: 0.9,
                            }}
                          >
                            Out of Stock
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </MotionCard>
                </Grid>
              );
            })}
          </AnimatePresence>
        </Grid>
      </Box>

      {/* Filter Drawer */}
      <Drawer
        anchor="bottom"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        PaperProps={{
          sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6" fontWeight="800">
              Filters
            </Typography>
            <IconButton
              onClick={() => setFilterOpen(false)}
              size="small"
              sx={{ bgcolor: "#F5F5F5" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography variant="subtitle2" fontWeight="700" gutterBottom>
            Category
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                clickable
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    category: prev.category === cat ? "" : cat,
                  }))
                }
                sx={{
                  bgcolor:
                    filters.category === cat ? "primary.main" : "#F5F5F5",
                  color: filters.category === cat ? "white" : "text.primary",
                  fontWeight: 600,
                }}
              />
            ))}
          </Box>

          <Typography variant="subtitle2" fontWeight="700" gutterBottom>
            Price Range (₹0 - ₹5000)
          </Typography>
          <Box sx={{ px: 1, mb: 3 }}>
            <Slider
              value={filters.priceRange}
              onChange={(e, val) =>
                setFilters((prev) => ({ ...prev, priceRange: val }))
              }
              min={0}
              max={5000}
              valueLabelDisplay="auto"
              sx={{ color: "primary.main" }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => setFilterOpen(false)}
            sx={{ borderRadius: 3, fontWeight: "bold" }}
          >
            Apply Filters
          </Button>
        </Box>
      </Drawer>

      {/* Sort Drawer */}
      <Drawer
        anchor="bottom"
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        PaperProps={{
          sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="800" sx={{ mb: 2 }}>
            Sort By
          </Typography>
          <List>
            {sortOptions.map((opt) => (
              <ListItem
                button
                key={opt.value}
                onClick={() => {
                  setSortBy(opt.value);
                  setSortOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: sortBy === opt.value ? "#E8F5E9" : "transparent",
                  color: sortBy === opt.value ? "primary.main" : "text.primary",
                }}
              >
                <ListItemText
                  primary={opt.label}
                  primaryTypographyProps={{
                    fontWeight: sortBy === opt.value ? 700 : 500,
                  }}
                />
                {sortBy === opt.value && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                    }}
                  />
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 70, md: 24 } }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MobileProductsPage;
