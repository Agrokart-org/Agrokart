import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProductImage } from "../data/productImages";

import {
  Box,
  Grid,
  Typography,
  Card,
  Button,
  IconButton,
  Chip,
  Rating,
  alpha,
  Snackbar,
  Alert,
  Stack,
} from "@mui/material";
import {
  FavoriteBorder as FavoriteIcon,
  Favorite as FavoriteFilled,
  ShoppingCart as CartIcon,
  ChevronLeft,
  ChevronRight,
  Verified,
  TrendingUp,
  ArrowForward,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";
import { getProducts } from "../services/api";

// Banner Assets
import bannerSale from "../assets/banner_sale_field.png";
import bannerOrganic from "../assets/banner_organic_harvest.png";
import bannerBulk from "../assets/banner_bulk_supply.png";

const CustomerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [currentBanner, setCurrentBanner] = useState(0);
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("agrokart_wishlist");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Curated Banner Slider
  const banners = [
    {
      id: 1,
      badge: "ICAR Certified Quality",
      title: "AgroKart — Essential Farm Supplies Delivered to Your Doorstep",
      subtitle: "Genuine fertilizers, high-yield seeds, and crop protection solutions sourced directly from top suppliers.",
      image: bannerSale,
      cta: "Explore Marketplace",
    },
    {
      id: 2,
      badge: "Organic Soil Health",
      title: "100% Certified Bio-Fertilizers & Organic Composts",
      subtitle: "Restore soil micro-fauna and increase crop yield naturally with neem-coated formulas.",
      image: bannerOrganic,
      cta: "Shop Bio-Fertilizers",
    },
    {
      id: 3,
      badge: "Wholesale & Co-Op Pricing",
      title: "Bulk Agricultural Supplies at Direct Supplier Rates",
      subtitle: "Special pricing for farmer producer organizations (FPOs) and large-scale landholders.",
      image: bannerBulk,
      cta: "Order Bulk Supply",
    },
  ];

  // Agricultural Categories (Matches backend Product model)
  const categories = [
    { id: 1, name: "NPK Complex", dbCategory: "npk", image: "/images/products/npk.jpg" },
    { id: 2, name: "Organic Bio", dbCategory: "organic", image: "/images/categories/organic.jpg" },
    { id: 3, name: "Urea Nitrogen", dbCategory: "urea", image: "/images/products/urea.jpg" },
    { id: 4, name: "Crop Seeds", searchTerm: "seeds", image: "/images/products/Seeds/cucumber seeds.jpeg" },
    { id: 5, name: "Pesticides", searchTerm: "pesticides", image: "/images/products/Pesticides/Confidor (Bayer).jpg" },
    { id: 6, name: "Farm Tools", searchTerm: "tools", image: "/images/products/Tools/Khurpi (Hand Hoe).jpg" },
    { id: 7, name: "Micronutrients", searchTerm: "micronutrients", image: "/images/products/Micronutrients/Zinc Sulphate 21%.jpg" },
    { id: 8, name: "Compost & Manure", dbCategory: "organic", image: "/images/categories/bio.jpg" },
  ];

  // Load database products
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        const fetched = await getProducts({ limit: 100 });
        const mapped = (fetched || []).map((p) => ({
          id: p._id,
          _id: p._id,
          name: p.name,
          weight: p.unit || "kg",
          image: p.images?.[0] || p.image || "",
          price: p.price,
          originalPrice: p.price ? Math.round(p.price * 1.25) : 0,
          discount: p.price ? Math.round(((p.price * 1.25 - p.price) / (p.price * 1.25)) * 100) : 20,
          rating: p.averageRating || 4.5,
          reviews: p.ratings?.length || 24,
          category: p.category,
          brand: p.brand || (p.category === "urea" ? "IFFCO" : p.category === "npk" ? "Mahadhan" : "Bayer Agri"),
          unit: p.unit || "kg",
          stock: p.stock || 50,
          inStock: (p.stock || 50) > 0,
          description: p.description,
        }));
        setProducts(mapped);
      } catch (e) {
        console.error("Failed to load products:", e);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Banner rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleWishlist = (e, product) => {
    e.stopPropagation();
    setWishlist((prev) => {
      const exists = prev.find((p) => (p._id || p.id) === (product._id || product.id));
      const next = exists
        ? prev.filter((p) => (p._id || p.id) !== (product._id || product.id))
        : [...prev, product];
      localStorage.setItem("agrokart_wishlist", JSON.stringify(next));
      return next;
    });
    setSnackbar({
      open: true,
      message: wishlist.find((p) => (p._id || p.id) === (product._id || product.id))
        ? "Removed from wishlist"
        : "Added to wishlist!",
      severity: "success",
    });
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart({
      _id: product.id || product._id,
      id: product.id || product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      images: [product.image],
    }, 1);
    setSnackbar({ open: true, message: `${product.name} added to cart!`, severity: "success" });
  };

  const handleProductClick = (productId) => navigate(`/product/${productId}`);
  const handleViewAll = () => navigate("/products");
  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);

  // Reusable Section Header Component
  const SectionHeader = ({ title, subtitle, onViewAll }) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 2.5 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ color: "#111827", fontSize: { xs: "1.15rem", md: "1.35rem" }, letterSpacing: "-0.3px" }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.84rem", mt: 0.3 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Button
        onClick={onViewAll || handleViewAll}
        endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
        sx={{
          color: "#1B5E20",
          fontWeight: 600,
          fontSize: "0.88rem",
          textTransform: "none",
          p: 0,
          "&:hover": { bgcolor: "transparent", color: "#14532D" },
        }}
      >
        View All
      </Button>
    </Box>
  );

  // Production E-Commerce Product Card System
  const ProductCard = ({ product }) => {
    const isWishlisted = wishlist.some((p) => (p._id || p.id) === (product._id || product.id));

    return (
      <Card
        component={motion.div}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
        onClick={() => handleProductClick(product.id)}
        sx={{
          cursor: "pointer",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: "#FFFFFF",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            borderColor: "#2E7D32",
          },
        }}
      >
        {/* Fixed Image Container */}
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            height: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            flexShrink: 0,
            borderBottom: "1px solid #F3F4F6",
            p: 1.5,
          }}
        >
          <Box
            component="img"
            src={getProductImage(
              product.name,
              product.category,
              product.image || product.images?.[0]
            )}
            alt={product.name}
            sx={{
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain",
            }}
          />

          {/* Wishlist Button */}
          <IconButton
            onClick={(e) => handleWishlist(e, product)}
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "white",
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              p: 0.6,
              "&:hover": { bgcolor: "#F9FAFB" },
            }}
          >
            {isWishlisted ? (
              <FavoriteFilled sx={{ color: "#EF4444", fontSize: 16 }} />
            ) : (
              <FavoriteIcon sx={{ color: "#9CA3AF", fontSize: 16 }} />
            )}
          </IconButton>

          {/* Discount Tag */}
          {product.discount > 0 && (
            <Chip
              label={`${product.discount}% OFF`}
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                bgcolor: "#DC2626",
                color: "white",
                fontWeight: 700,
                fontSize: "0.64rem",
                height: 18,
                borderRadius: "4px",
              }}
            />
          )}
        </Box>

        {/* Card Body */}
        <Box sx={{ p: 1.8, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <Box>
            {/* Brand & Category */}
            <Typography
              variant="caption"
              fontWeight={600}
              sx={{ color: "#6B7280", fontSize: "0.72rem", display: "block", mb: 0.3 }}
            >
              {product.brand}
            </Typography>

            {/* Product Title (Clamped 2 lines) */}
            <Typography
              variant="subtitle2"
              fontWeight={600}
              sx={{
                color: "#111827",
                fontSize: "0.92rem",
                lineHeight: 1.3,
                height: 38,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                mb: 0.8,
              }}
            >
              {product.name}
            </Typography>

            {/* Rating */}
            <Stack direction="row" spacing={0.6} alignItems="center" mb={1.2}>
              <Rating value={Number(product.rating || 4.5)} readOnly size="small" precision={0.5} sx={{ fontSize: "0.85rem" }} />
              <Typography variant="caption" sx={{ color: "#6B7280", fontSize: "0.75rem", fontWeight: 500 }}>
                ({product.reviews || 24})
              </Typography>
            </Stack>
          </Box>

          {/* Price & Add to Cart */}
          <Box>
            <Stack direction="row" alignItems="baseline" spacing={0.8} mb={1.5}>
              <Typography variant="h6" fontWeight={800} sx={{ color: "#111827", fontSize: "1.1rem" }}>
                ₹{product.price}
              </Typography>
              {product.originalPrice > product.price && (
                <Typography variant="caption" sx={{ textDecoration: "line-through", color: "#9CA3AF", fontSize: "0.8rem" }}>
                  ₹{product.originalPrice}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "#4B5563", fontSize: "0.75rem", ml: "auto" }}>
                / {product.unit || "kg"}
              </Typography>
            </Stack>

            <Button
              fullWidth
              variant="contained"
              size="small"
              onClick={(e) => handleAddToCart(e, product)}
              sx={{
                bgcolor: "#1B5E20",
                color: "white",
                fontWeight: 600,
                borderRadius: "6px",
                py: 0.7,
                fontSize: "0.82rem",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": { bgcolor: "#14532D", boxShadow: "none" },
              }}
            >
              Add to Cart
            </Button>
          </Box>
        </Box>
      </Card>
    );
  };

  return (
    <Box sx={{ width: "100%", bgcolor: "#F9FAFB", minHeight: "100vh", pb: 6, px: { xs: 2, sm: 3, md: 4 }, py: 3, boxSizing: "border-box" }}>
      {/* Hero Section Banner (280-320px Desktop Height) */}
      <Box
        sx={{
          position: "relative",
          height: { xs: 220, sm: 280, md: 320 },
          borderRadius: "12px",
          overflow: "hidden",
          mb: 4,
          border: "1px solid #E5E7EB",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ height: "100%", width: "100%", position: "absolute" }}
          >
            {/* Background Image */}
            <Box
              sx={{
                height: "100%",
                width: "100%",
                backgroundImage: `url(${banners[currentBanner].image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

            {/* Contrast Gradient Overlay */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, rgba(17,24,39,0.85) 0%, rgba(17,24,39,0.5) 60%, rgba(17,24,39,0.15) 100%)",
              }}
            />

            {/* Hero Content */}
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: { xs: "5%", md: "5%" },
                transform: "translateY(-50%)",
                width: { xs: "90%", sm: "70%", md: "540px" },
                zIndex: 3,
              }}
            >
              <Chip
                icon={<Verified sx={{ color: "#81C784 !important", fontSize: "16px !important" }} />}
                label={banners[currentBanner].badge}
                sx={{
                  mb: 1.5,
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.74rem",
                  height: 22,
                  backdropFilter: "blur(4px)",
                }}
              />

              <Typography
                variant="h3"
                sx={{
                  mb: 1,
                  fontSize: { xs: "1.4rem", sm: "1.9rem", md: "2.3rem" },
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1.2,
                  letterSpacing: "-0.5px",
                }}
              >
                {banners[currentBanner].title}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mb: 2.5,
                  color: "#E5E7EB",
                  fontSize: { xs: "0.84rem", md: "0.95rem" },
                  lineHeight: 1.5,
                  display: { xs: "none", sm: "-webkit-box" },
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {banners[currentBanner].subtitle}
              </Typography>

              <Button
                variant="contained"
                onClick={() => navigate("/products")}
                endIcon={<TrendingUp sx={{ fontSize: 18 }} />}
                sx={{
                  bgcolor: "#1B5E20",
                  color: "white",
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#14532D", boxShadow: "none" },
                }}
              >
                {banners[currentBanner].cta}
              </Button>
            </Box>
          </motion.div>
        </AnimatePresence>

        {/* Banner Arrow Controls */}
        <IconButton
          onClick={prevBanner}
          size="small"
          sx={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "rgba(255,255,255,0.85)",
            color: "#111827",
            zIndex: 4,
            "&:hover": { bgcolor: "white" },
          }}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>

        <IconButton
          onClick={nextBanner}
          size="small"
          sx={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "rgba(255,255,255,0.85)",
            color: "#111827",
            zIndex: 4,
            "&:hover": { bgcolor: "white" },
          }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>

      {/* Category Section (Clean Marketplace Navigation) */}
      <Box sx={{ mb: 4.5 }}>
        <SectionHeader title="Shop Agricultural Categories" subtitle="Select a category to browse certified suppliers" />

        {/* 8 Categories across 1 row on Desktop (lg=1.5) */}
        <Grid container spacing={1.5}>
          {categories.map((cat) => (
            <Grid item xs={6} sm={4} md={3} lg={1.5} key={cat.id}>
              <Card
                component={motion.div}
                whileHover={{ y: -2 }}
                onClick={() => {
                  if (cat.dbCategory) navigate(`/products?category=${encodeURIComponent(cat.dbCategory)}`);
                  else if (cat.searchTerm) navigate(`/products?search=${encodeURIComponent(cat.searchTerm)}`);
                  else navigate("/products");
                }}
                sx={{
                  cursor: "pointer",
                  p: 1.5,
                  textAlign: "center",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  bgcolor: "white",
                  boxShadow: "none",
                  transition: "all 0.15s ease",
                  height: 90,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": { borderColor: "#2E7D32", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    mb: 0.8,
                    backgroundImage: `url("${cat.image}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: "1px solid #E5E7EB",
                  }}
                />
                <Typography variant="caption" fontWeight={600} sx={{ fontSize: "0.8rem", color: "#111827", lineHeight: 1.1 }}>
                  {cat.name}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Popular Agri Products Grid (Breakpoints: xl=2.4 -> 5/row, lg=3 -> 4/row, md=4 -> 3/row, xs=6 -> 2/row) */}
      <Box sx={{ mb: 4.5 }}>
        <SectionHeader title="Popular Agri Products" subtitle="High demand fertilizers, hybrid seeds, and plant nutrients" />

        <Grid container spacing={2}>
          {productsLoading ? (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Loading marketplace products...</Typography>
            </Grid>
          ) : (
            products.slice(0, 15).map((product) => (
              <Grid item xs={6} sm={4} md={4} lg={3} xl={2.4} key={product.id}>
                <ProductCard product={product} />
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Top Rated Section */}
      <Box sx={{ mb: 5 }}>
        <SectionHeader title="Top Rated & Highest Yield Formulas" subtitle="Consistently top-rated solutions by Indian farmers" />

        <Grid container spacing={2}>
          {products.filter((p) => p.rating >= 4.4).slice(0, 10).map((product) => (
            <Grid item xs={6} sm={4} md={4} lg={3} xl={2.4} key={product.id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Snackbar feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerDashboard;
