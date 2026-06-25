import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Paper,
  Skeleton,
  useTheme,
  useMediaQuery,
  Stack,
  alpha,
  keyframes,
  Fade,
  Slide,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  LocationOn,
  Search,
  LocalOffer,
  TrendingUp,
  Star,
  ShoppingCart,
  Favorite,
  Category,
  Refresh,
  Agriculture,
  RocketLaunch,
  AutoAwesome,
  Verified,
  FlashOn,
  LocalShipping,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/MobileLayout";
import MobileSearch from "../components/MobileSearch";
import MobileProductCard from "../components/MobileProductCard";
import { useMobile } from "../context/MobileContext";
import { useNotifications } from "../context/NotificationProvider";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { getProducts, getUserOrders } from "../services/api";

// Banner Images
import bannerSale from "../assets/banner_sale_field.png";
import bannerOrganic from "../assets/banner_organic_harvest.png";
import bannerBulk from "../assets/banner_bulk_supply.png";

// Modern animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const gradientShift = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
`;

const MobileHomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, logout } = useAuth();
  const { addToCart, cart, cartCount } = useCart();
  const { showNotification, getUnreadCount } = useNotifications();
  const { vibrate, getCurrentLocation, showToast, isNative } = useMobile();

  const [location, setLocation] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    loadHomeData();
    detectLocation();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      // 1. Fetch real products from MongoDB API
      let fetchedProducts = [];
      try {
        fetchedProducts = await getProducts({ limit: 100 });
        console.log("Loaded products from DB:", fetchedProducts?.length);
      } catch (e) {
        console.error("API failed, products empty:", e);
      }

      const processedProducts = (fetchedProducts || []).map((p) => ({
        id: p._id,
        name: p.name,
        price: p.price,
        originalPrice: p.price ? Math.round(p.price * 1.2) : 0,
        image: p.images?.[0] || p.image || "",
        vendorName: p.brand || "Agrokart",
        rating: p.averageRating || p.rating || 4.2,
        reviewCount: p.ratings?.length || p.numReviews || 0,
        stock: p.stock,
        category: p.category,
        brand: p.brand,
        unit: p.unit || "kg",
        description: p.description,
        discount: 0,
        isPopular: (p.averageRating || p.rating || 0) > 4,
        isOrganic: p.category === "organic",
      }));

      setProducts(processedProducts);

      // 2. Set categories — only the 7 real product folders (no Organic)
      const VALID_CATEGORIES = [
        "Bio-Fertilizers",
        "Micronutrients",
        "NPK Fertilizers",
        "Pesticides",
        "Seeds",
        "Tools",
        "Urea",
      ];

      const catMap = {
        "Bio-Fertilizers": "🦠",
        Micronutrients: "🔬",
        "NPK Fertilizers": "⚗️",
        Pesticides: "🛡️",
        Seeds: "🌱",
        Tools: "🛠️",
        Urea: "💧",
      };
      const catColors = {
        "Bio-Fertilizers": "#4CAF50",
        Micronutrients: "#9C27B0",
        "NPK Fertilizers": "#2E7D32",
        Pesticides: "#E53935",
        Seeds: "#8BC34A",
        Tools: "#607D8B",
        Urea: "#0288D1",
      };

      // Count products per valid category
      const catCounts = {};
      processedProducts.forEach((p) => {
        if (VALID_CATEGORIES.includes(p.category)) {
          catCounts[p.category] = (catCounts[p.category] || 0) + 1;
        }
      });

      // Always show all 7 categories even if count is 0
      const categoryList = VALID_CATEGORIES.map((name) => ({
        id: name,
        name,
        icon: catMap[name] || "📦",
        count: catCounts[name] || 0,
        color: catColors[name] || "#5D4037",
      }));

      setCategories(categoryList);


      // 3. Set Banners (using imported assets)
      setBanners([
        {
          id: 1,
          title: "Season Sale",
          subtitle: "Up to 50% Off on Fertilizers",
          image: bannerSale,
          action: "/products?category=Fertilizers",
          gradient: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
        },
        {
          id: 2,
          title: "Organic Harvest",
          subtitle: "100% Certified Organic",
          image: bannerOrganic,
          action: "/products?category=Organic",
          gradient: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
        },
        {
          id: 3,
          title: "Bulk Supply",
          subtitle: "Wholesale Rates for Farmers",
          image: bannerBulk,
          action: "/products?category=Bulk",
          gradient: "linear-gradient(135deg, #0288D1 0%, #29B6F6 100%)",
        },
      ]);
    } catch (error) {
      console.error("Failed to load home data:", error);
      await showToast("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = async () => {
    try {
      const position = await getCurrentLocation();
      if (position) {
        setLocation(
          `${position.latitude.toFixed(2)}, ${position.longitude.toFixed(2)}`,
        );
      }
    } catch (error) {
      console.error("Location detection error:", error);
      setLocation("Location not available");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await vibrate("light");
    await loadHomeData();
    setRefreshing(false);
    await showToast("Data refreshed");
  };

  const handleSearch = async (searchTerm, filters) => {
    await vibrate("light");
    console.log("Search:", searchTerm, filters);
  };

  const handleCategoryClick = async (category) => {
    await vibrate("light");
    console.log("Category clicked:", category);
    navigate(`/products?category=${encodeURIComponent(category.id)}`);
  };

  const handleAddToCart = async (product, quantity) => {
    await addToCart(product, quantity);
    await showNotification({
      title: "Added to Cart",
      body: `${quantity} ${product.name} added to cart`,
      type: "success",
    });
  };

  const handleToggleFavorite = async (product) => {
    await vibrate("light");
    await showToast("Added to favorites");
  };

  // Glassmorphism style
  const glassStyle = {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  };

  if (loading) {
    return (
      <MobileLayout>
        <Box sx={{ p: 2 }}>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={200}
            sx={{ my: 2, borderRadius: 3 }}
          />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={6} key={item}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={250}
                  sx={{ borderRadius: 3 }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      user={user}
      onLogout={logout}
      cartCount={cartCount}
      notificationCount={getUnreadCount()}
      showNavigation={true}
    >
      {/* Futuristic Header Section */}
      <Box
        sx={{
          px: 2,
          pt: 2,
          pb: 1,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          borderRadius: "0 0 24px 24px",
          mb: 2,
        }}
      >
        {/* Location and Refresh */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LocationOn
              sx={{
                mr: 1,
                color: theme.palette.primary.main,
                animation: `${pulse} 2s ease-in-out infinite`,
              }}
            />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {location || "Detecting location..."}
            </Typography>
          </Box>
          <IconButton
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                transform: "rotate(180deg)",
              },
              transition: "all 0.3s ease",
            }}
          >
            <Refresh />
          </IconButton>
        </Box>

        {/* Welcome Message with Gradient */}
        <Fade in={isVisible} timeout={800}>
          <Box>
            <Typography
              variant="h6"
              fontWeight="bold"
              gutterBottom
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Hello, {user?.name || "Guest"}! 👋
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              What premium fertilizers are you looking for today?
            </Typography>
          </Box>
        </Fade>

        {/* Search */}
        <MobileSearch
          onSearch={handleSearch}
          categories={categories}
          recentSearches={["Urea", "DAP", "NPK", "Organic"]}
          popularSearches={[
            "Premium fertilizers",
            "Organic compost",
            "NPK 20:20:20",
            "DAP fertilizer",
          ]}
        />
      </Box>

      {/* Futuristic Banners */}
      <Box sx={{ px: 2, py: 2 }}>
        <Grid container spacing={2}>
          {banners.map((banner, index) => (
            <Grid item xs={12} key={banner.id}>
              <Slide
                direction="right"
                in={isVisible}
                timeout={600 + index * 200}
              >
                <Card
                  sx={{
                    position: "relative",
                    height: 130,
                    overflow: "hidden",
                    borderRadius: 4,
                    background: banner.gradient,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      px: 2,
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    <Chip
                      icon={<AutoAwesome sx={{ fontSize: 16 }} />}
                      label="Featured"
                      sx={{
                        mb: 1,
                        bgcolor: alpha("#fff", 0.2),
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        backdropFilter: "blur(10px)",
                      }}
                    />
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color="white"
                      gutterBottom
                      sx={{ textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
                    >
                      {banner.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="white"
                      paragraph
                      sx={{ opacity: 0.95, mb: 1.5 }}
                    >
                      {banner.subtitle}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: "#fff",
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 2,
                        "&:hover": {
                          bgcolor: alpha("#fff", 0.9),
                          transform: "scale(1.05)",
                        },
                      }}
                    >
                      Shop Now
                    </Button>
                  </Box>

                  {/* Decorative Elements */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      bgcolor: alpha("#fff", 0.1),
                      animation: `${pulse} 3s ease-in-out infinite`,
                    }}
                  />
                </Card>
              </Slide>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Modern Categories */}
      <Box sx={{ px: 2, py: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Categories
          </Typography>
          <Button
            size="small"
            endIcon={<Category />}
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            View All
          </Button>
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            overflowX: "auto",
            pb: 1,
            "::-webkit-scrollbar": { display: "none" },
          }}
        >
          {categories.map((category, index) => (
            <Box key={category.id} sx={{ flexShrink: 0, width: 85 }}>
              <Fade in={isVisible} timeout={400 + index * 100}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    textAlign: "center",
                    cursor: "pointer",
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(category.color, 0.1)} 0%, ${alpha(category.color, 0.05)} 100%)`,
                    border: `2px solid ${alpha(category.color, 0.2)}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 8px 24px ${alpha(category.color, 0.2)}`,
                      borderColor: category.color,
                    },
                    "&:active": {
                      transform: "translateY(-2px)",
                    },
                  }}
                  onClick={() => handleCategoryClick(category)}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      mb: 1,
                      animation: `${float} 3s ease-in-out infinite ${index * 0.2}s`,
                    }}
                  >
                    {category.icon}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    display="block"
                    sx={{ color: category.color }}
                  >
                    {category.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "0.65rem" }}
                  >
                    {category.count} items
                  </Typography>
                </Paper>
              </Fade>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Featured Products */}
      <Box sx={{ px: 2, py: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Featured Products
          </Typography>
          <Button
            size="small"
            endIcon={<TrendingUp />}
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            View All
          </Button>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {products.map((product, index) => {
            const stockColor =
              product.stock > 20
                ? "#388E3C"
                : product.stock > 0
                  ? "#F57C00"
                  : "#D32F2F";
            const catIcons = {
              urea: "💧",
              dap: "💎",
              npk: "⚗️",
              organic: "🌿",
              other: "📦",
            };
            return (
              <Fade in={isVisible} timeout={400 + index * 60} key={product.id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                    border: "1px solid",
                    borderColor: "divider",
                    borderLeft: `3px solid ${stockColor}`,
                    transition: "box-shadow 0.2s, transform 0.2s",
                    "&:active": { transform: "scale(0.98)" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "stretch" }}>
                    {/* Left: Info */}
                    <Box sx={{ flex: 1, p: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            color: "text.disabled",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {catIcons[product.category] || "📦"}{" "}
                          {product.category}
                        </Typography>
                        {product.brand && (
                          <Chip
                            label={product.brand}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: "0.55rem",
                              fontWeight: 700,
                              bgcolor: "#E3F2FD",
                              color: "#1565C0",
                              borderRadius: 0.5,
                              ml: 0.5,
                            }}
                          />
                        )}
                      </Box>

                      <Typography
                        variant="subtitle2"
                        fontWeight="700"
                        sx={{
                          lineHeight: 1.3,
                          mb: 0.3,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {product.name}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight="900"
                          color="primary"
                        >
                          ₹{product.price}
                        </Typography>
                        {product.originalPrice > product.price && (
                          <Typography
                            variant="caption"
                            sx={{
                              textDecoration: "line-through",
                              color: "text.disabled",
                            }}
                          >
                            ₹{product.originalPrice}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled">
                          /{product.unit}
                        </Typography>
                      </Box>

                      {/* Rating + Stock */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          mt: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.3,
                          }}
                        >
                          <Star sx={{ fontSize: 13, color: "#FFC107" }} />
                          <Typography
                            variant="caption"
                            fontWeight="bold"
                            color="text.secondary"
                          >
                            {Number(product.rating).toFixed(1)}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: stockColor,
                            fontSize: "0.65rem",
                          }}
                        >
                          {product.stock > 20
                            ? "In Stock"
                            : product.stock > 0
                              ? `Only ${product.stock} left`
                              : "Out of Stock"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Right: Add to Cart */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        px: 1,
                        py: 1.5,
                        borderLeft: "1px solid",
                        borderColor: "divider",
                        minWidth: 60,
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                      }}
                    >
                      {product.stock > 0 ? (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleAddToCart(product, 1)}
                          sx={{
                            borderRadius: 1.5,
                            textTransform: "none",
                            fontWeight: 700,
                            px: 1,
                            py: 0.6,
                            fontSize: "0.7rem",
                            boxShadow: "none",
                            minWidth: "auto",
                            "&:active": { transform: "scale(0.95)" },
                          }}
                        >
                          + Add
                        </Button>
                      ) : (
                        <Typography
                          variant="caption"
                          color="error"
                          fontWeight={700}
                          textAlign="center"
                        >
                          Sold Out
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Fade>
            );
          })}
        </Box>
      </Box>

      {/* Quick Actions with Glassmorphism */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          gutterBottom
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Quick Actions
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card
              sx={{
                p: 2,
                textAlign: "center",
                cursor: "pointer",
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.2)}`,
                  borderColor: theme.palette.warning.main,
                },
              }}
            >
              <LocalOffer
                sx={{
                  fontSize: 28,
                  mb: 0.5,
                  color: theme.palette.warning.main,
                  animation: `${pulse} 2s ease-in-out infinite`,
                }}
              />
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ color: theme.palette.warning.main }}
              >
                Special Offers
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card
              sx={{
                p: 2,
                textAlign: "center",
                cursor: "pointer",
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <Star
                sx={{
                  fontSize: 28,
                  mb: 0.5,
                  color: theme.palette.primary.main,
                  animation: `${pulse} 2s ease-in-out infinite 0.5s`,
                }}
              />
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ color: theme.palette.primary.main }}
              >
                Top Rated
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Blinking Tracking FAB */}
      <TrackingFAB />

      {/* Bottom Spacing for Navigation */}
      <Box sx={{ height: 80 }} />
    </MobileLayout>
  );
};

// ═══════════════════════════════════════════════════════
// BLINKING TRACKING FAB COMPONENT
// ═══════════════════════════════════════════════════════
const blinkPulse = keyframes`
  0%, 100% { box-shadow: 0 4px 12px rgba(76,175,80,0.3); transform: scale(1); }
  50% { box-shadow: 0 4px 24px rgba(76,175,80,0.6); transform: scale(1.08); }
`;

const TrackingFAB = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState([]);
  const [showOrderSelect, setShowOrderSelect] = useState(false);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const res = await getUserOrders(token);
        const orders = res.data || res.orders || [];
        const active = orders.filter((o) =>
          ["confirmed", "processing", "out_for_delivery", "pending_vendor_approval"].includes(o.orderStatus)
        );
        setActiveOrders(active);
      } catch (e) { console.error("Active orders fetch error:", e); }
    };
    fetchActive();
    const interval = setInterval(fetchActive, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (activeOrders.length === 0) return null;

  const handleClick = () => {
    if (activeOrders.length === 1) {
      navigate(`/orders/${activeOrders[0]._id}`);
    } else {
      setShowOrderSelect(true);
    }
  };

  return (
    <>
      <Fab
        onClick={handleClick}
        sx={{
          position: "fixed",
          bottom: 80,
          right: 16,
          bgcolor: "#4CAF50",
          color: "white",
          width: 56,
          height: 56,
          zIndex: 1200,
          animation: `${blinkPulse} 2s ease-in-out infinite`,
          "&:hover": { bgcolor: "#388E3C" },
        }}
      >
        <LocalShipping sx={{ fontSize: 28 }} />
      </Fab>

      {/* Multi-order selector */}
      <Dialog open={showOrderSelect} onClose={() => setShowOrderSelect(false)}
        PaperProps={{ sx: { borderRadius: 3, width: "90%", maxWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Track Active Orders ({activeOrders.length})</DialogTitle>
        <DialogContent>
          <List disablePadding>
            {activeOrders.map((order) => (
              <ListItemButton
                key={order._id}
                onClick={() => {
                  setShowOrderSelect(false);
                  navigate(`/orders/${order._id}`);
                }}
                sx={{ borderRadius: 2, mb: 1, border: "1px solid #eee" }}
              >
                <ListItemIcon>
                  <LocalShipping color={order.orderStatus === "out_for_delivery" ? "success" : "primary"} />
                </ListItemIcon>
                <ListItemText
                  primary={`#${order.trackingNumber || order._id.slice(-6)}`}
                  secondary={`₹${order.totalAmount} • ${order.orderStatus.replace(/_/g, " ")}`}
                  secondaryTypographyProps={{ sx: { textTransform: "capitalize" } }}
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileHomePage;
