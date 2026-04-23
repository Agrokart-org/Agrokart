import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
} from "@mui/material";
import { AddPhotoAlternate, Close, ArrowBack } from "@mui/icons-material";
import { API_BASE_URL } from "../../services/api";

const CATEGORIES = [
  { value: "Bio-Fertilizers", label: "Bio-Fertilizers" },
  { value: "Micronutrients", label: "Micronutrients" },
  { value: "NPK Fertilizers", label: "NPK Fertilizers" },
  { value: "Pesticides", label: "Pesticides" },
  { value: "Seeds", label: "Seeds" },
  { value: "Tools", label: "Tools" },
  { value: "Urea", label: "Urea" },
];

const AddProduct = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    price: "",
    stock: "",
    unit: "kg",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken");

      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (imageFile) {
        data.append("productImage", imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "x-auth-token": token,
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add product");
      }

      setSuccess("✅ Product added successfully!");
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      setError(err.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 2, mb: 8, px: 1.5 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3, pt: 1 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "grey.100" }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight="800">Add Product</Typography>
          <Typography variant="caption" color="text.secondary">
            Fill in product details & upload an image
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Image Upload Section */}
        <Paper
          elevation={0}
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: 3,
            border: "2px dashed",
            borderColor: imagePreview ? "primary.main" : "divider",
            textAlign: "center",
            bgcolor: imagePreview ? "rgba(46,125,50,0.04)" : "grey.50",
            transition: "all 0.2s",
          }}
        >
          {imagePreview ? (
            <Box sx={{ position: "relative", display: "inline-block" }}>
              <Box
                component="img"
                src={imagePreview}
                alt="Preview"
                sx={{ width: 160, height: 160, objectFit: "contain", borderRadius: 2 }}
              />
              <IconButton
                onClick={handleRemoveImage}
                size="small"
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  bgcolor: "error.main",
                  color: "white",
                  width: 24,
                  height: 24,
                  "&:hover": { bgcolor: "error.dark" },
                }}
              >
                <Close sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ) : (
            <Box>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "rgba(46,125,50,0.1)",
                  mx: "auto",
                  mb: 1.5,
                }}
              >
                <AddPhotoAlternate sx={{ fontSize: 32, color: "primary.main" }} />
              </Avatar>
              <Typography variant="body2" fontWeight={600} color="text.primary" mb={0.5}>
                Upload Product Image
              </Typography>
              <Typography variant="caption" color="text.secondary">
                JPG, PNG, WEBP up to 5MB
              </Typography>
            </Box>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: "none" }}
            id="product-image-input"
          />
          <Box sx={{ mt: 1.5 }}>
            <label htmlFor="product-image-input">
              <Button
                variant={imagePreview ? "outlined" : "contained"}
                component="span"
                size="small"
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                {imagePreview ? "Change Image" : "Choose Image"}
              </Button>
            </label>
          </Box>
        </Paper>

        {/* Form Fields */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                size="small"
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
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
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
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price (₹)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                required
                size="small"
                inputProps={{ min: 0 }}
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
                size="small"
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required size="small">
                <InputLabel>Unit</InputLabel>
                <Select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  label="Unit"
                >
                  <MenuItem value="kg">Kilogram (kg)</MenuItem>
                  <MenuItem value="g">Gram (g)</MenuItem>
                  <MenuItem value="ton">Ton</MenuItem>
                  <MenuItem value="L">Litre (L)</MenuItem>
                  <MenuItem value="mL">Millilitre (mL)</MenuItem>
                  <MenuItem value="packet">Packet</MenuItem>
                  <MenuItem value="piece">Piece</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{ borderRadius: 2, textTransform: "none", py: 1.5 }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              py: 1.5,
              fontWeight: 700,
              background: "linear-gradient(135deg, #2E7D32, #43A047)",
              boxShadow: "0 4px 14px rgba(46,125,50,0.3)",
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Add Product"
            )}
          </Button>
        </Box>
      </form>
    </Container>
  );
};

export default AddProduct;
