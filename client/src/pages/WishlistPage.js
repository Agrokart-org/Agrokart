import React, { useState, useEffect } from "react";
import { Container, Typography, Box, Grid, Button, Card, IconButton, Rating } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useCart } from "../context/CartContext";

const WishlistPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("agrokart_wishlist");
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {
        setWishlist([]);
      }
    }
  }, []);

  const removeFromWishlist = (productId) => {
    const updated = wishlist.filter((p) => (p._id || p.id) !== productId);
    setWishlist(updated);
    localStorage.setItem("agrokart_wishlist", JSON.stringify(updated));
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const getProductImage = (product) => {
    return product.image || (product.images && product.images[0]) || "/images/placeholder.jpg";
  };

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 }, mb: 4, minHeight: "70vh" }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3, textTransform: "none", fontWeight: 700 }}
      >
        Back to Shopping
      </Button>
      <Box
        sx={{
          p: { xs: 2, md: 4 },
          bgcolor: "white",
          borderRadius: 4,
          boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
        }}
      >
        <Typography variant="h4" fontWeight="900" gutterBottom sx={{ letterSpacing: "-0.5px" }}>
          My Wishlist
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {wishlist.length} item(s) saved for later.
        </Typography>

        {wishlist.length === 0 ? (
          <Box
            sx={{
              mt: 4,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: 300,
              bgcolor: "#F9FAFB",
              borderRadius: 3,
              border: "1px dashed rgba(0,0,0,0.1)",
            }}
          >
            <Typography variant="h6" fontWeight="700" color="text.primary" gutterBottom>
              Your wishlist is empty
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Explore products and tap the heart icon to save them here.
            </Typography>
            <Button variant="contained" color="primary" onClick={() => navigate("/customer/dashboard")} sx={{ borderRadius: 2, textTransform: "none", px: 4 }}>
              Explore Products
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {wishlist.map((product, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    position: "relative",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 24px rgba(0,0,0,0.08)" }
                  }}
                >
                  <IconButton
                    onClick={() => removeFromWishlist(product._id || product.id)}
                    sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(255,255,255,0.9)", zIndex: 2, "&:hover": { bgcolor: "#FEE2E2", color: "#DC2626" } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                  
                  <Box sx={{ height: 160, p: 2, bgcolor: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Box component="img" src={getProductImage(product)} alt={product.name} sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </Box>
                  
                  <Box sx={{ p: 2, display: "flex", flexDirection: "column", flex: 1 }}>
                    <Typography variant="body1" fontWeight="700" noWrap gutterBottom>
                      {product.name}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
                      <Typography variant="h6" fontWeight="900" color="primary.main">
                        ₹{product.price}
                      </Typography>
                      {product.originalPrice && (
                        <Typography variant="caption" sx={{ textDecoration: "line-through", color: "text.disabled" }}>
                          ₹{product.originalPrice}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ mt: "auto", pt: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ShoppingCartIcon />}
                        onClick={() => handleAddToCart(product)}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                      >
                        Add to Cart
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default WishlistPage;
