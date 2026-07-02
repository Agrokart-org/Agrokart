import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProductImage } from "../data/productImages";

import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Chip,
  Rating,
  alpha,
  Snackbar,
  Alert,
  keyframes,
  useTheme,
} from "@mui/material";
import {
  FavoriteBorder as FavoriteIcon,
  Favorite as FavoriteFilled,
  ShoppingCart as CartIcon,
  ChevronLeft,
  ChevronRight,
  LocalOffer as OfferIcon,
  Spa,
  InvertColors,
  Grain,
  BugReport,
  Build,
  Science,
  EmojiNature,
  Agriculture,
  Add as AddIcon,
  Visibility as ViewIcon,
  LocalShipping,
  Verified,
  TrendingUp,
  AutoAwesome,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";

import { getProducts } from "../services/api";

// Banner Images
import bannerSale from "../assets/banner_sale_field.png";
import bannerOrganic from "../assets/banner_organic_harvest.png";
import bannerBulk from "../assets/banner_bulk_supply.png";

// Keyframe animations
const float = keyframes`
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(2deg); }
`;

const pulse = keyframes`
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
`;

const shimmer = keyframes`
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

const glow = keyframes`
    0%, 100% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.3); }
    50% { box-shadow: 0 0 40px rgba(76, 175, 80, 0.6); }
`;

const gradientMove = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const CustomerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("agrokart_wishlist");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Banner data
  const banners = [
    {
      id: 1,
      title: t("dashboard.banners.sale.title"),
      subtitle: t("dashboard.banners.sale.subtitle"),
      image: bannerSale,
      cta: t("dashboard.banners.sale.cta"),
      color: "#ffffff",
    },
    {
      id: 2,
      title: t("dashboard.banners.organic.title"),
      subtitle: t("dashboard.banners.organic.subtitle"),
      image: bannerOrganic,
      cta: t("dashboard.banners.organic.cta"),
      color: "#ffffff",
    },
    {
      id: 3,
      title: t("dashboard.banners.bulk.title"),
      subtitle: t("dashboard.banners.bulk.subtitle"),
      image: bannerBulk,
      cta: t("dashboard.banners.bulk.cta"),
      color: "#ffffff",
    },
  ];

  // Categories - dbCategory must match backend Product model enum: ['urea','dap','npk','organic','other']
  // Categories without a direct DB match use search instead of category filter
  const categories = [
    {
      id: 1,
      name: t("dashboard.categories.npk"),
      dbCategory: "npk",
      image: "/images/products/npk.jpg",
      color: "#2E7D32",
    },
    {
      id: 2,
      name: t("dashboard.categories.organic"),
      dbCategory: "organic",
      image: "/images/categories/organic.jpg",
      color: "#388E3C",
    },
    {
      id: 3,
      name: t("dashboard.categories.urea"),
      dbCategory: "urea",
      image: "/images/products/urea.jpg",
      color: "#0288D1",
    },
    {
      id: 4,
      name: t("dashboard.categories.seeds"),
      dbCategory: null,
      searchTerm: "seeds",
      image: "/images/products/Seeds/cucumber seeds.jpeg",
      color: "#F57F17",
    },
    {
      id: 5,
      name: t("dashboard.categories.pesticides"),
      dbCategory: null,
      searchTerm: "pesticides",
      image: "/images/products/Pesticides/Confidor (Bayer).jpg",
      color: "#D32F2F",
    },
    {
      id: 6,
      name: t("dashboard.categories.tools"),
      dbCategory: null,
      searchTerm: "tools",
      image: "/images/products/Tools/Khurpi (Hand Hoe).jpg",
      color: "#5D4037",
    },
    {
      id: 7,
      name: t("dashboard.categories.micro"),
      dbCategory: null,
      searchTerm: "micronutrients",
      image: "/images/products/Micronutrients/Zinc Sulphate 21%.jpg",
      color: "#7B1FA2",
    },
    {
      id: 8,
      name: t("dashboard.categories.bio"),
      dbCategory: "organic",
      image: "/images/categories/bio.jpg",
      color: "#388E3C",
    },
  ];

  // Products from real database
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
          originalPrice: p.price ? Math.round(p.price * 1.2) : 0,
          discount: 0,
          rating: p.averageRating || 4.2,
          reviews: p.ratings?.length || 0,
          category: p.category,
          brand: p.brand || "",
          unit: p.unit || "kg",
          stock: p.stock || 0,
          inStock: (p.stock || 0) > 0,
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  // Auto-rotate banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleWishlist = (e, product) => {
    e.stopPropagation();
    setWishlist((prev) => {
      const exists = prev.find((p) => p._id === product._id || p.id === product.id);
      const newWishlist = exists
        ? prev.filter((p) => (p._id || p.id) !== (product._id || product.id))
        : [...prev, product];
      localStorage.setItem("agrokart_wishlist", JSON.stringify(newWishlist));
      return newWishlist;
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
    addToCart(
      {
        _id: product.id || product._id,
        id: product.id || product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        images: [product.image],
      },
      1,
    );
    setSnackbar({
      open: true,
      message: `${product.name} added to cart!`,
      severity: "success",
    });
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleViewAll = () => {
    navigate("/products");
  };

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Modern Product Card Component
  const catIcons = {
    urea: "💧",
    dap: "💎",
    npk: "⚗️",
    organic: "🌿",
    other: "📦",
  };
  const catColors = {
    urea: "#E3F2FD",
    dap: "#EDE7F6",
    npk: "#E8F5E9",
    organic: "#F1F8E9",
    other: "#FFF8E1",
  };
  const catTextColors = {
    urea: "#1565C0",
    dap: "#6A1B9A",
    npk: "#2E7D32",
    organic: "#33691E",
    other: "#E65100",
  };
  const getStockColor = (s) =>
    s > 20 ? "#388E3C" : s > 0 ? "#F57C00" : "#D32F2F";

  const ProductCard = ({ product, index }) => {
    const sc = getStockColor(product.stock || 0);
    const bgColor = catColors[product.category] || "#F5F5F5";
    const iconColor = catTextColors[product.category] || "#5D4037";
    return (
      <Card
        component={motion.div}
        variants={itemVariants}
        whileTap={{ scale: 0.97 }}
        onClick={() => handleProductClick(product.id)}
        sx={{
          cursor: "pointer",
          borderRadius: 0.5,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          border: "1px solid rgba(0,0,0,0.06)",
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
            sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1 }}
          />
          {/* Wishlist Button */}
          <IconButton
            onClick={(e) => handleWishlist(e, product)}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              bgcolor: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(4px)",
              width: 32,
              height: 32,
              "&:hover": { bgcolor: "white", transform: "scale(1.1)" },
              zIndex: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {wishlist.find((p) => (p._id || p.id) === (product._id || product.id)) ? (
              <FavoriteFilled sx={{ color: "#E91E63", fontSize: 18 }} />
            ) : (
              <FavoriteIcon sx={{ color: "#757575", fontSize: 18 }} />
            )}
          </IconButton>

          {/* Fallback emoji */}
          <Box
            sx={{
              display: "none",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: bgColor,
              fontSize: 42,
            }}
          >
            {catIcons[product.category] || "📦"}
          </Box>

          <Box
            sx={{
              position: "absolute",
              bottom: 10,
              left: 10,
              bgcolor: sc,
              color: "#fff",
              px: 0.8,
              py: 0.2,
              borderRadius: 1,
              fontSize: "0.58rem",
              fontWeight: 800,
              lineHeight: 1.4,
            }}
          >
            {(product.stock || 0) > 20
              ? "IN STOCK"
              : (product.stock || 0) > 0
                ? "LOW"
                : "OUT"}
          </Box>

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
        <Box sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column" }}>
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
            sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.4 }}
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
                mb: 0.4,
                display: "block",
              }}
            >
              ₹{product.originalPrice}
            </Typography>
          )}

          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 1.5 }}
          >
            <Rating
              value={1}
              max={1}
              readOnly
              size="small"
              sx={{ fontSize: "0.82rem" }}
            />
            <Typography
              variant="caption"
              fontWeight="700"
              sx={{ color: "#2E7D32", fontSize: "0.72rem" }}
            >
              {Number(product.rating || 4.0).toFixed(1)}
            </Typography>
          </Box>

          <Box sx={{ mt: "auto" }}>
            {product.inStock ? (
              <Button
                fullWidth
                variant="contained"
                size="small"
                onClick={(e) => handleAddToCart(e, product)}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  py: 0.9,
                  boxShadow: "none",
                  background: "linear-gradient(135deg, #2E7D32, #43A047)",
                  "&:hover": { boxShadow: "0 4px 12px rgba(46,125,50,0.3)" },
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
                sx={{ borderRadius: 2, fontSize: "0.72rem", py: 0.9 }}
              >
                Out of Stock
              </Button>
            )}
          </Box>
        </Box>
      </Card>
    );
  };

  // Log products for debugging
  useEffect(() => {
    console.log("CustomerDashboard loaded. Product count:", products.length);
    console.log("Sample product:", products[0]);
  }, [products]);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 4 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
        {/* Hero Banner Carousel */}
        <Box
          sx={{
            position: "relative",
            height: { xs: 320, sm: 420, md: 520 },
            borderRadius: { xs: 3, md: 5 },
            overflow: "hidden",
            mb: 4,
            mt: 2,
            boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(45deg, rgba(46, 125, 50, 0.1) 0%, transparent 50%)",
              zIndex: 1,
              pointerEvents: "none",
            },
          }}
        >
          {/* Floating Particles */}
          <Box
            sx={{
              position: "absolute",
              top: "15%",
              left: "10%",
              width: 60,
              height: 60,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(76, 175, 80, 0.3) 0%, transparent 70%)",
              animation: `${float} 6s ease-in-out infinite`,
              zIndex: 2,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: "60%",
              right: "15%",
              width: 40,
              height: 40,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255, 193, 7, 0.4) 0%, transparent 70%)",
              animation: `${float} 8s ease-in-out infinite 2s`,
              zIndex: 2,
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{ height: "100%", width: "100%", position: "absolute" }}
            >
              {/* Background Image with Ken Burns Effect */}
              <Box
                component={motion.div}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                sx={{
                  height: "100%",
                  width: "100%",
                  backgroundImage: `url(${banners[currentBanner].image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              {/* Overlay Gradient */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)",
                }}
              />

              {/* Content - Modern Glassmorphism Card */}
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: { xs: "50%", md: "5%" },
                  transform: {
                    xs: "translate(-50%, -50%)",
                    md: "translate(0, -50%)",
                  },
                  width: { xs: "90%", md: "520px" },
                  textAlign: { xs: "center", md: "left" },
                  zIndex: 3,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <Box
                    sx={{
                      background: "rgba(255, 255, 255, 0.12)",
                      backdropFilter: "blur(20px)",
                      borderRadius: 5,
                      p: { xs: 3, md: 5 },
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      boxShadow: "0 15px 50px 0 rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    {/* Badge */}
                    <Chip
                      icon={<Verified sx={{ color: "#4CAF50 !important" }} />}
                      label="Premium Quality"
                      sx={{
                        mb: 2,
                        bgcolor: "rgba(255,255,255,0.9)",
                        color: "#2E7D32",
                        fontWeight: 600,
                        "& .MuiChip-icon": { color: "#4CAF50" },
                      }}
                    />

                    <Typography
                      variant="h2"
                      sx={{
                        mb: 2,
                        fontSize: { xs: "2rem", md: "3.2rem" },
                        fontWeight: 800,
                        background:
                          "linear-gradient(135deg, #FFFFFF 0%, #E8F5E9 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        lineHeight: 1.1,
                        letterSpacing: -1,
                      }}
                    >
                      {banners[currentBanner].title}
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{
                        mb: 4,
                        color: "rgba(255,255,255,0.9)",
                        fontSize: { xs: "1rem", md: "1.15rem" },
                        fontWeight: 400,
                        lineHeight: 1.6,
                      }}
                    >
                      {banners[currentBanner].subtitle}
                    </Typography>

                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate("/products")}
                      endIcon={<TrendingUp />}
                      sx={{
                        background:
                          "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                        color: "white",
                        fontWeight: 700,
                        px: 5,
                        py: 1.8,
                        borderRadius: 50,
                        fontSize: "1.1rem",
                        textTransform: "none",
                        boxShadow: "0 8px 25px rgba(76, 175, 80, 0.4)",
                        animation: `${glow} 2s ease-in-out infinite`,
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
                          transform: "translateY(-3px) scale(1.02)",
                          boxShadow: "0 12px 35px rgba(76, 175, 80, 0.5)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      {banners[currentBanner].cta}
                    </Button>
                  </Box>
                </motion.div>
              </Box>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <IconButton
            onClick={prevBanner}
            sx={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.9)",
              color: "#2E7D32",
              backdropFilter: "blur(10px)",
              width: 48,
              height: 48,
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              "&:hover": {
                bgcolor: "#fff",
                transform: "translateY(-50%) scale(1.1)",
              },
              transition: "all 0.3s ease",
              zIndex: 4,
            }}
          >
            <ChevronLeft sx={{ fontSize: 28 }} />
          </IconButton>
          <IconButton
            onClick={nextBanner}
            sx={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.9)",
              color: "#2E7D32",
              backdropFilter: "blur(10px)",
              width: 48,
              height: 48,
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              "&:hover": {
                bgcolor: "#fff",
                transform: "translateY(-50%) scale(1.1)",
              },
              transition: "all 0.3s ease",
              zIndex: 4,
            }}
          >
            <ChevronRight sx={{ fontSize: 28 }} />
          </IconButton>

          {/* Progress Dots */}
          <Box
            sx={{
              position: "absolute",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 1.5,
              zIndex: 4,
            }}
          >
            {banners.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentBanner(index)}
                sx={{
                  width: index === currentBanner ? 32 : 10,
                  height: 10,
                  borderRadius: 5,
                  bgcolor:
                    index === currentBanner
                      ? "#4CAF50"
                      : "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow:
                    index === currentBanner
                      ? "0 2px 10px rgba(76, 175, 80, 0.5)"
                      : "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Categories Section */}
        <Box sx={{ mb: 5, p: 2, position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <AutoAwesome sx={{ color: "#4CAF50", mr: 1 }} />
            <Typography variant="h5" fontWeight="700" color="#1a1a1a">
              Shop by Category
            </Typography>
          </Box>

          <Grid
            container
            spacing={2}
            justifyContent="center"
            component={motion.div}
            variants={containerVariants}
            initial="visible"
            animate="visible"
          >
            {categories.map((category) => (
              <Grid
                item
                xs={3}
                sm={3}
                md={2}
                lg={1.5}
                key={category.id}
                component={motion.div}
                variants={itemVariants}
              >
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.08, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (category.dbCategory) {
                      navigate(
                        `/products?category=${encodeURIComponent(category.dbCategory)}`,
                      );
                    } else if (category.searchTerm) {
                      navigate(
                        `/products?search=${encodeURIComponent(category.searchTerm)}`,
                      );
                    } else {
                      navigate(
                        `/products?search=${encodeURIComponent(category.name)}`,
                      );
                    }
                  }}
                  sx={{
                    textAlign: "center",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 55,
                      height: 55,
                      borderRadius: "16px",
                      bgcolor: alpha(category.color, 0.08),
                      color: category.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.5,
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: `2px solid ${alpha(category.color, 0.2)}`,
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(circle at center, ${alpha(category.color, 0.3)} 0%, transparent 70%)`,
                        opacity: 0,
                        transition: "opacity 0.3s ease",
                      },
                      "&:hover": {
                        bgcolor: category.color,
                        color: "white",
                        boxShadow: `0 8px 30px ${alpha(category.color, 0.5)}`,
                        border: `2px solid ${category.color}`,
                        "&::before": {
                          opacity: 1,
                        },
                      },
                      backgroundImage: category.image ? `url("${category.image}")` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {!category.image && category.icon}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#374151",
                      display: "block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "100%",
                      lineHeight: 1.2,
                    }}
                  >
                    {category.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Best Deals Section */}
        <Box sx={{ mb: 5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 4,
                  height: 28,
                  borderRadius: 2,
                  background:
                    "linear-gradient(180deg, #4CAF50 0%, #2E7D32 100%)",
                  mr: 2,
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  background:
                    "linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t("dashboard.sections.bestDeals")}
              </Typography>
            </Box>
            <Button
              onClick={handleViewAll}
              endIcon={<ChevronRight />}
              sx={{
                color: "#2E7D32",
                fontWeight: 700,
                "&:hover": {
                  bgcolor: alpha("#4CAF50", 0.1),
                  transform: "translateX(4px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {t("dashboard.sections.viewAll")}
            </Button>
          </Box>

          <Grid
            container
            spacing={0.5}
            component={motion.div}
            variants={containerVariants}
            initial="visible"
            animate="visible"
          >
            {productsLoading ? (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <Typography color="text.secondary">
                    Loading products...
                  </Typography>
                </Box>
              </Grid>
            ) : (
              products.slice(0, 20).map((product, index) => (
                <Grid item xs={4} sm={4} md={3} key={product.id}>
                  <ProductCard product={product} index={index} />
                </Grid>
              ))
            )}
          </Grid>
        </Box>

        {/* Top Rated Section */}
        <Box sx={{ mb: 5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 4,
                  height: 28,
                  borderRadius: 2,
                  background:
                    "linear-gradient(180deg, #FFD700 0%, #FFA000 100%)",
                  mr: 2,
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  background:
                    "linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t("dashboard.sections.topRated")}
              </Typography>
            </Box>
            <Button
              onClick={handleViewAll}
              endIcon={<ChevronRight />}
              sx={{
                color: "#2E7D32",
                fontWeight: 700,
                "&:hover": {
                  bgcolor: alpha("#4CAF50", 0.1),
                  transform: "translateX(4px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {t("dashboard.sections.viewAll")}
            </Button>
          </Box>

          <Grid
            container
            spacing={0.5}
            component={motion.div}
            variants={containerVariants}
            initial="visible"
            animate="visible"
          >
            {products
              .filter((p) => p.rating >= 4.5)
              .slice(0, 12)
              .map((product, index) => (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={product.id}>
                  <ProductCard product={product} index={index} />
                </Grid>
              ))}
          </Grid>
        </Box>
      </Container>

      {/* Snackbar for Cart Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: 3,
            boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
            fontWeight: 600,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerDashboard;
