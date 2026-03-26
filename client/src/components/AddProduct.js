import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  IconButton,
  Divider,
  Chip,
  InputAdornment,
  Snackbar,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Stack,
} from "@mui/material";
import {
  ArrowBack,
  CloudUpload,
  Inventory,
  Science,
  Agriculture,
  Save,
  Close,
  AddPhotoAlternate,
  Category,
  AttachMoney,
  Description,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { API_BASE_URL, safeFetch } from "../services/api";

const MotionCard = motion(Card);

const AddProduct = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    price: "",
    stock: "",
    unit: "kg",
    images: [""],
    specifications: {
      npk: {
        nitrogen: "",
        phosphorus: "",
        potassium: "",
      },
      composition: [""],
      usage: "",
      precautions: "",
    },
    recommendedCrops: [""],
  });

  const steps = [
    { label: "Basic Info", icon: <Description /> },
    { label: "Pricing & Stock", icon: <AttachMoney /> },
    { label: "Specifications", icon: <Science /> },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("specifications.npk.")) {
      const field = name.split(".")[2];
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          npk: {
            ...prev.specifications.npk,
            [field]: value,
          },
        },
      }));
    } else if (name.startsWith("specifications.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await safeFetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to add product");
      }

      setSuccess("Product added successfully! 🎉");
      setTimeout(() => navigate("/vendor/dashboard"), 2000);
    } catch (err) {
      setError(err.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "urea", label: "Urea", emoji: "🌱" },
    { value: "dap", label: "DAP", emoji: "🌾" },
    { value: "npk", label: "NPK", emoji: "🌿" },
    { value: "organic", label: "Organic", emoji: "🍃" },
    { value: "pesticide", label: "Pesticide", emoji: "🧪" },
    { value: "seeds", label: "Seeds", emoji: "🌻" },
    { value: "tools", label: "Tools", emoji: "🔧" },
    { value: "other", label: "Other", emoji: "📦" },
  ];

  const progressValue = ((activeStep + 1) / steps.length) * 100;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)",
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          bgcolor: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <IconButton
          onClick={() => navigate("/vendor/dashboard")}
          sx={{
            bgcolor: "#f0fdf4",
            color: "#15803d",
            "&:hover": { bgcolor: "#dcfce7" },
          }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight="800" sx={{ color: "#1f2937" }}>
            Add New Product
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Fill in the details to list a new product
          </Typography>
        </Box>
        <Chip
          label={`Step ${activeStep + 1}/${steps.length}`}
          sx={{
            bgcolor: "#dcfce7",
            color: "#15803d",
            fontWeight: "bold",
            borderRadius: 2,
          }}
        />
      </Box>

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={progressValue}
        sx={{
          height: 4,
          bgcolor: "#e5e7eb",
          "& .MuiLinearProgress-bar": {
            background: "linear-gradient(90deg, #22c55e, #16a34a)",
            borderRadius: 2,
          },
        }}
      />

      {/* Step Indicators */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: { xs: 2, md: 4 },
          py: 3,
          px: 2,
        }}
      >
        {steps.map((step, i) => (
          <Box
            key={i}
            onClick={() => setActiveStep(i)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              px: 2,
              py: 1,
              borderRadius: 3,
              bgcolor: activeStep === i ? "#dcfce7" : "transparent",
              border:
                activeStep === i
                  ? "1px solid #86efac"
                  : "1px solid transparent",
              transition: "all 0.3s ease",
              "&:hover": { bgcolor: "#f0fdf4" },
            }}
          >
            <Box
              sx={{
                color: activeStep === i ? "#15803d" : "#9ca3af",
                display: "flex",
              }}
            >
              {step.icon}
            </Box>
            <Typography
              variant="body2"
              fontWeight={activeStep === i ? 700 : 500}
              color={activeStep === i ? "#15803d" : "text.secondary"}
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {step.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 2, md: 4 }, pb: 6 }}>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 3 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {activeStep === 0 && (
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{
                borderRadius: 4,
                border: "none",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: "#dcfce7",
                      borderRadius: 2,
                      display: "flex",
                      color: "#15803d",
                    }}
                  >
                    <Category />
                  </Box>
                  <Typography variant="h6" fontWeight="700">
                    Basic Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Product Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Premium Urea 46-0-0"
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      multiline
                      rows={3}
                      required
                      placeholder="Describe your product..."
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        label="Category"
                        sx={{ borderRadius: 3 }}
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat.value} value={cat.value}>
                            {cat.emoji} {cat.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      required
                      placeholder="e.g., IFFCO"
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                    />
                  </Grid>
                </Grid>

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}
                >
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(1)}
                    sx={{
                      bgcolor: "#16a34a",
                      color: "white",
                      px: 4,
                      py: 1.2,
                      borderRadius: 3,
                      fontWeight: 700,
                      textTransform: "none",
                      boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
                      "&:hover": { bgcolor: "#15803d" },
                    }}
                  >
                    Next: Pricing & Stock →
                  </Button>
                </Box>
              </CardContent>
            </MotionCard>
          )}

          {/* Step 2: Pricing & Stock */}
          {activeStep === 1 && (
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{
                borderRadius: 4,
                border: "none",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: "#dbeafe",
                      borderRadius: 2,
                      display: "flex",
                      color: "#1d4ed8",
                    }}
                  >
                    <AttachMoney />
                  </Box>
                  <Typography variant="h6" fontWeight="700">
                    Pricing & Stock
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₹</InputAdornment>
                        ),
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Stock Quantity"
                      name="stock"
                      type="number"
                      value={formData.stock}
                      onChange={handleChange}
                      required
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        label="Unit"
                        sx={{ borderRadius: 3 }}
                      >
                        <MenuItem value="kg">Kilogram (kg)</MenuItem>
                        <MenuItem value="g">Gram (g)</MenuItem>
                        <MenuItem value="ton">Ton</MenuItem>
                        <MenuItem value="liter">Liter (L)</MenuItem>
                        <MenuItem value="ml">Milliliter (mL)</MenuItem>
                        <MenuItem value="piece">Piece</MenuItem>
                        <MenuItem value="packet">Packet</MenuItem>
                        <MenuItem value="bag">Bag</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 4,
                    gap: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => setActiveStep(0)}
                    sx={{
                      borderColor: "#d1d5db",
                      color: "#6b7280",
                      px: 3,
                      py: 1.2,
                      borderRadius: 3,
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
                    }}
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(2)}
                    sx={{
                      bgcolor: "#16a34a",
                      color: "white",
                      px: 4,
                      py: 1.2,
                      borderRadius: 3,
                      fontWeight: 700,
                      textTransform: "none",
                      boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
                      "&:hover": { bgcolor: "#15803d" },
                    }}
                  >
                    Next: Specifications →
                  </Button>
                </Box>
              </CardContent>
            </MotionCard>
          )}

          {/* Step 3: Specifications */}
          {activeStep === 2 && (
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{
                borderRadius: 4,
                border: "none",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: "#fef3c7",
                      borderRadius: 2,
                      display: "flex",
                      color: "#b45309",
                    }}
                  >
                    <Science />
                  </Box>
                  <Typography variant="h6" fontWeight="700">
                    Specifications
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                {/* NPK Values */}
                <Typography
                  variant="subtitle2"
                  fontWeight="700"
                  sx={{ mb: 2, color: "#374151" }}
                >
                  NPK Composition
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="N (%)"
                      name="specifications.npk.nitrogen"
                      type="number"
                      value={formData.specifications.npk.nitrogen}
                      onChange={handleChange}
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 3 },
                        "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="P (%)"
                      name="specifications.npk.phosphorus"
                      type="number"
                      value={formData.specifications.npk.phosphorus}
                      onChange={handleChange}
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 3 },
                        "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="K (%)"
                      name="specifications.npk.potassium"
                      type="number"
                      value={formData.specifications.npk.potassium}
                      onChange={handleChange}
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 3 },
                        "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                      }}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Usage Instructions"
                      name="specifications.usage"
                      value={formData.specifications.usage}
                      onChange={handleChange}
                      multiline
                      rows={2}
                      placeholder="How to use this product..."
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Precautions"
                      name="specifications.precautions"
                      value={formData.specifications.precautions}
                      onChange={handleChange}
                      multiline
                      rows={2}
                      placeholder="Safety precautions..."
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                    />
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 4,
                    gap: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => setActiveStep(1)}
                    sx={{
                      borderColor: "#d1d5db",
                      color: "#6b7280",
                      px: 3,
                      py: 1.2,
                      borderRadius: 3,
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
                    }}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? null : <Save />}
                    sx={{
                      bgcolor: "#16a34a",
                      color: "white",
                      px: 5,
                      py: 1.2,
                      borderRadius: 3,
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: "1rem",
                      boxShadow: "0 4px 16px rgba(22, 163, 74, 0.3)",
                      "&:hover": { bgcolor: "#15803d" },
                      "&:disabled": { bgcolor: "#86efac" },
                    }}
                  >
                    {loading ? "Publishing..." : "Publish Product"}
                  </Button>
                </Box>
              </CardContent>
            </MotionCard>
          )}
        </form>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="success"
          sx={{ width: "100%", borderRadius: 3, boxShadow: 3 }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddProduct;
