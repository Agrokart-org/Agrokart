import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import { useTranslation } from "react-i18next";
import { useCart } from "../../context/CartContext";
import { safeFetch, API_BASE_URL } from "../../services/api";
import fertilizersData from "../../data/knowledgeBase/fertilizers.json"; // Local Knowledge Base

const RecommendationCard = ({ recommendation }) => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const searchQuery = recommendation.product.toLowerCase();

      // 1. Try Local Knowledge Base Lookup First (Offline Mode)
      const localProduct = fertilizersData.fertilizers.find(
        (f) =>
          f.name.toLowerCase().includes(searchQuery) ||
          f.id === searchQuery ||
          (f.type && f.type.toLowerCase() === searchQuery),
      );

      if (localProduct) {
        // Use local data
        const product = {
          _id: localProduct.id,
          name: localProduct.name,
          price: localProduct.price || 500, // Fallback price
          description: localProduct.description,
          category: "fertilizer",
          imageUrl:
            localProduct.imageUrl ||
            "/images/products/fertilizer-placeholder.jpg",
          inStock: true,
        };
        addToCart(product, 1);
        setSnackbar({
          open: true,
          message: `Added ${product.name} to cart! (Offline Mode)`,
          severity: "success",
        });
        setLoading(false);
        return;
      }

      // 2. Fallback to API if not found locally
      const response = await safeFetch(
        `${API_BASE_URL}/products?category=fertilizer&search=${encodeURIComponent(searchQuery)}`,
      );

      if (response && response.products && response.products.length > 0) {
        // Found matching product in DB
        const product = response.products[0];
        addToCart(product, 1);
        setSnackbar({
          open: true,
          message: `Added ${product.name} to cart!`,
          severity: "success",
        });
      } else {
        // Product not found - create a placeholder item
        const placeholderProduct = {
          _id: `fertilizer-${recommendation.product.toLowerCase().replace(/\s+/g, "-")}`,
          name: recommendation.product,
          description: `Recommended dosage: ${recommendation.dosage}`,
          price: 0,
          category: "fertilizer",
          imageUrl: "/images/products/fertilizer-placeholder.jpg",
          inStock: false,
        };
        addToCart(placeholderProduct, 1);
        setSnackbar({
          open: true,
          message: `Added ${recommendation.product} to cart. Please check availability.`,
          severity: "info",
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setSnackbar({
        open: true,
        message: "Failed to add to cart. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isCorrection = recommendation.type === "Correction";

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          mb: 2,
          borderColor: isCorrection ? "secondary.main" : "primary.main",
          borderWidth: 1,
        }}
      >
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display="flex" alignItems="center" gap={1}>
              {isCorrection ? (
                <WarningIcon color="secondary" />
              ) : (
                <CheckCircleIcon color="success" />
              )}
              <Typography variant="h6" component="div">
                {recommendation.product}
              </Typography>
            </Box>
            {recommendation.type && (
              <Chip
                label={recommendation.type}
                color={isCorrection ? "secondary" : "primary"}
                size="small"
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {recommendation.reason}
          </Typography>

          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="primary.dark">
                {t("drAgro.dosage")}: {recommendation.dosage}
              </Typography>
              {recommendation.totalQuantity && (
                <Typography
                  variant="body2"
                  color="success.main"
                  fontWeight="bold"
                  mt={0.5}
                >
                  Total Required: {recommendation.totalQuantity}
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              size="small"
              startIcon={<ShoppingCartIcon />}
              onClick={handleAddToCart}
              disabled={loading || recommendation.type === "Advisory"}
            >
              {loading ? "Adding..." : t("drAgro.addToCart")}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RecommendationCard;
