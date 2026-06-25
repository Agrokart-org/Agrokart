import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Stack,
  useTheme,
  alpha,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Card,
  CardContent,
  CardActionArea,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  LocalShipping as ShippingIcon,
  LocalShipping as LocalShippingIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const DeliveryDetailsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { cart, getCartTotal } = useCart();
  const { user } = useAuth();
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [capturedCoords, setCapturedCoords] = useState(null);

  // City coordinates lookup for fallback when geolocation is unavailable
  const cityCoordinates = {
    // Maharashtra
    Mumbai: [72.8777, 19.076],
    Pune: [73.8567, 18.5204],
    Nagpur: [79.0882, 21.1458],
    Nashik: [73.7898, 19.9975],
    Aurangabad: [75.3433, 19.8762],
    Solapur: [75.9064, 17.6599],
    Kolhapur: [74.2433, 16.705],
    Amravati: [77.7523, 20.9374],
    Nanded: [77.321, 19.1383],
    Sangli: [74.5815, 16.8524],
    // Gujarat
    Ahmedabad: [72.5714, 23.0225],
    Surat: [72.8311, 21.1702],
    Vadodara: [73.1812, 22.3072],
    Rajkot: [70.8022, 22.3039],
    Bhavnagar: [72.1519, 21.7645],
    Jamnagar: [70.0577, 22.4707],
    Junagadh: [70.4579, 21.5222],
    Gandhinagar: [72.6369, 23.2156],
    // Karnataka
    Bangalore: [77.5946, 12.9716],
    Mysore: [76.6394, 12.2958],
    Hubli: [75.124, 15.3647],
    Mangalore: [74.856, 12.9141],
    Belgaum: [74.4977, 15.8497],
    Gulbarga: [76.8343, 17.3297],
    Davangere: [75.9218, 14.4644],
    // Madhya Pradesh
    Indore: [75.8577, 22.7196],
    Bhopal: [77.4126, 23.2599],
    Jabalpur: [79.9864, 23.1815],
    Gwalior: [78.1828, 26.2183],
    Ujjain: [75.7885, 23.1765],
    Sagar: [78.7378, 23.8388],
    // Telangana
    Hyderabad: [78.4867, 17.385],
    Warangal: [79.5941, 17.9784],
    Nizamabad: [78.0941, 18.6725],
    Karimnagar: [79.1288, 18.4386],
    // Andhra Pradesh
    Visakhapatnam: [83.2185, 17.6868],
    Vijayawada: [80.648, 16.5062],
    Guntur: [80.4365, 16.3067],
    Nellore: [79.9865, 14.4426],
    Kurnool: [78.0373, 15.8281],
    // Tamil Nadu
    Chennai: [80.2707, 13.0827],
    Coimbatore: [76.9558, 11.0168],
    Madurai: [78.1198, 9.9252],
    Tiruchirappalli: [78.7047, 10.7905],
    Salem: [78.146, 11.6643],
    // Punjab
    Ludhiana: [75.8573, 30.901],
    Amritsar: [74.8723, 31.634],
    Jalandhar: [75.5762, 31.326],
    Patiala: [76.3869, 30.3398],
    Bathinda: [74.9455, 30.211],
  };

  // Helper function to extract address string from user object
  const getAddressString = (userAddress) => {
    if (!userAddress) return "";
    if (typeof userAddress === "string") return userAddress;
    if (typeof userAddress === "object") {
      const parts = [];
      if (userAddress.street) parts.push(userAddress.street);
      if (userAddress.city) parts.push(userAddress.city);
      if (userAddress.state) parts.push(userAddress.state);
      if (userAddress.pincode) parts.push(userAddress.pincode);
      return parts.join(", ");
    }
    return "";
  };

  // Helper function to extract individual address components
  const getAddressComponent = (userAddress, component) => {
    if (!userAddress) return "";
    if (typeof userAddress === "string") {
      if (component === "street") return userAddress;
      return "";
    }
    if (typeof userAddress === "object") {
      return userAddress[component] || "";
    }
    return "";
  };

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    address: getAddressString(user?.address) || "",
    landmark: "",
    city: getAddressComponent(user?.address, "city") || "",
    state: getAddressComponent(user?.address, "state") || "",
    pincode: getAddressComponent(user?.address, "pincode") || "",
    deliveryInstructions: "",
  });
  const [errors, setErrors] = useState({});

  // Data for States and Cities
  const stateCityData = {
    Maharashtra: [
      "Mumbai",
      "Pune",
      "Nagpur",
      "Nashik",
      "Aurangabad",
      "Solapur",
      "Kolhapur",
      "Amravati",
      "Nanded",
      "Sangli",
    ],
    Gujarat: [
      "Ahmedabad",
      "Surat",
      "Vadodara",
      "Rajkot",
      "Bhavnagar",
      "Jamnagar",
      "Junagadh",
      "Gandhinagar",
    ],
    Karnataka: [
      "Bangalore",
      "Mysore",
      "Hubli",
      "Mangalore",
      "Belgaum",
      "Gulbarga",
      "Davangere",
    ],
    "Madhya Pradesh": [
      "Indore",
      "Bhopal",
      "Jabalpur",
      "Gwalior",
      "Ujjain",
      "Sagar",
    ],
    Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
    "Andhra Pradesh": [
      "Visakhapatnam",
      "Vijayawada",
      "Guntur",
      "Nellore",
      "Kurnool",
    ],
    "Tamil Nadu": [
      "Chennai",
      "Coimbatore",
      "Madurai",
      "Tiruchirappalli",
      "Salem",
    ],
    Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  };

  const states = Object.keys(stateCityData);

  // Mock saved addresses
  const savedAddresses = [
    {
      id: 1,
      type: "Home",
      address: "123 Farm Road, Green Valley",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      phone: "9876543210",
    },
    {
      id: 2,
      type: "Farm House",
      address: "Plot 45, Agro Zone, Near River",
      city: "Nashik",
      state: "Maharashtra",
      pincode: "422001",
      phone: "9876543210",
    },
  ];

  const handleUseSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setFormData({
      ...formData,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      phone: addr.phone || formData.phone, // Use saved phone if available, else keep existing
    });
    setErrors({}); // Clear errors
  };

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 5000 ? 0 : 200;
  const total = subtotal + deliveryFee;

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });

    // Reset selected address if user manually edits fields
    if (["address", "city", "state", "pincode"].includes(field)) {
      setSelectedAddressId(null);
    }

    // Reset city if state changes
    if (field === "state") {
      setFormData((prev) => ({ ...prev, state: event.target.value, city: "" }));
    }

    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsCapturingLocation(true);

    // Function to get coordinates from city lookup as fallback
    const getCityCoordinates = () => {
      const cityInput = (formData.city || "").trim().toLowerCase();
      const cityKey = Object.keys(cityCoordinates).find(
        (key) => key.toLowerCase() === cityInput
      );
      const coords = cityKey ? cityCoordinates[cityKey] : null;
      
      if (coords) {
        return { longitude: coords[0], latitude: coords[1] };
      }
      // Default fallback if city not in lookup (use a central India location)
      return { longitude: 78.9629, latitude: 20.5937 };
    };

    // Try to get user's actual location — prefer Capacitor native GPS on mobile
    const getLocation = async () => {
      // Try Capacitor Geolocation first (native GPS — much more accurate)
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          const { Geolocation } = await import("@capacitor/geolocation");

          // Request permission
          const perm = await Geolocation.checkPermissions();
          if (perm.location !== "granted") {
            await Geolocation.requestPermissions();
          }

          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });

          console.log("📍 Got native GPS location:", position.coords);
          return {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
          };
        }
      } catch (e) {
        console.warn("Capacitor geolocation failed, trying browser:", e);
      }

      // Fallback: browser navigator.geolocation
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                longitude: position.coords.longitude,
                latitude: position.coords.latitude,
              });
            },
            (error) => {
              console.log(
                "Geolocation error, using city coordinates:",
                error.message,
              );
              resolve(getCityCoordinates());
            },
            { timeout: 5000, enableHighAccuracy: true },
          );
        } else {
          console.log("Geolocation not available, using city coordinates");
          resolve(getCityCoordinates());
        }
      });
    };

    try {
      const coords = await getLocation();
      console.log("Captured coordinates for delivery:", coords);

      // Save delivery details WITH coordinates
      const deliveryDetailsWithCoords = {
        ...formData,
        coordinates: {
          type: "Point",
          coordinates: [coords.longitude, coords.latitude],
        },
      };

      localStorage.setItem(
        "deliveryDetails",
        JSON.stringify(deliveryDetailsWithCoords),
      );
      setIsCapturingLocation(false);
      navigate("/payment");
    } catch (error) {
      console.error("Error capturing location:", error);
      // Still save with fallback coordinates
      const fallbackCoords = getCityCoordinates();
      const deliveryDetailsWithCoords = {
        ...formData,
        coordinates: {
          type: "Point",
          coordinates: [fallbackCoords.longitude, fallbackCoords.latitude],
        },
      };
      localStorage.setItem(
        "deliveryDetails",
        JSON.stringify(deliveryDetailsWithCoords),
      );
      setIsCapturingLocation(false);
      navigate("/payment");
    }
  };

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
        {/* Checkout Stepper */}
        <Box sx={{ mb: 4, width: "100%", mt: 2 }}>
          <Stepper activeStep={1} alternativeLabel>
            {["Cart", "Delivery Details", "Payment"].map((label) => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      "&.Mui-active": { color: "#2E7D32" },
                      "&.Mui-completed": { color: "#2E7D32" },
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Page Header */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              "&:hover": { bgcolor: "#f5f5f5" },
            }}
          >
            <ArrowBackIcon sx={{ color: "#2E7D32" }} />
          </IconButton>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#1a1a1a",
              letterSpacing: "-0.5px",
            }}
          >
            Delivery Details
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Delivery Form */}
          <Grid item xs={12} md={8}>
            {/* Saved Addresses Section */}
            {savedAddresses.length > 0 && (
              <Box sx={{ mb: 4 }}>
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
                    fontWeight="700"
                    sx={{ color: "#333" }}
                  >
                    Quick Select Address
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={() => {
                      setSelectedAddressId(null);
                      setFormData({
                        fullName: "",
                        phone: "",
                        address: "",
                        landmark: "",
                        city: "",
                        state: "",
                        pincode: "",
                        deliveryInstructions: "",
                      });
                    }}
                    sx={{ color: "#2E7D32" }}
                  >
                    Add New
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  {savedAddresses.map((addr) => (
                    <Grid item xs={12} sm={6} key={addr.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: "pointer",
                          borderColor:
                            selectedAddressId === addr.id
                              ? "#2E7D32"
                              : "transparent",
                          borderWidth: selectedAddressId === addr.id ? 2 : 1,
                          bgcolor: "white",
                          boxShadow:
                            selectedAddressId === addr.id
                              ? "0 4px 12px rgba(46, 125, 50, 0.15)"
                              : "0 2px 8px rgba(0,0,0,0.04)",
                          transition: "all 0.2s ease-in-out",
                          position: "relative",
                          overflow: "visible",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                          },
                        }}
                        onClick={() => handleUseSavedAddress(addr)}
                      >
                        {selectedAddressId === addr.id && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: -10,
                              right: -10,
                              bgcolor: "#2E7D32",
                              borderRadius: "50%",
                              width: 24,
                              height: 24,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              zIndex: 1,
                            }}
                          >
                            <CheckCircleIcon sx={{ fontSize: 16 }} />
                          </Box>
                        )}
                        <CardActionArea sx={{ p: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 1,
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <HomeIcon
                                sx={{
                                  color:
                                    selectedAddressId === addr.id
                                      ? "#2E7D32"
                                      : "text.secondary",
                                  fontSize: 20,
                                }}
                              />
                              <Typography
                                variant="subtitle1"
                                fontWeight="700"
                                color={
                                  selectedAddressId === addr.id
                                    ? "#2E7D32"
                                    : "text.primary"
                                }
                              >
                                {addr.type}
                              </Typography>
                            </Stack>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUseSavedAddress(addr);
                              }}
                              sx={{
                                opacity: 0.6,
                                "&:hover": {
                                  opacity: 1,
                                  color: "#2E7D32",
                                  bgcolor: "#e8f5e9",
                                },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5, lineHeight: 1.6 }}
                          >
                            {addr.address}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="500"
                          >
                            {addr.city}, {addr.state} - {addr.pincode}
                          </Typography>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                  {/* Explicit Add New Card */}
                  <Grid item xs={12} sm={6}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        borderStyle: "dashed",
                        borderColor: "#bdbdbd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        "&:hover": {
                          borderColor: "#2E7D32",
                          bgcolor: "#f9fbe7",
                        },
                      }}
                      onClick={() => {
                        setSelectedAddressId(null);
                        setFormData({
                          fullName: "",
                          phone: "",
                          address: "",
                          landmark: "",
                          city: "",
                          state: "",
                          pincode: "",
                          deliveryInstructions: "",
                        });
                      }}
                    >
                      <CardActionArea
                        sx={{
                          height: "100%",
                          p: 3,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <AddIcon
                          sx={{ fontSize: 32, color: "#2E7D32", opacity: 0.8 }}
                        />
                        <Typography fontWeight="600" color="primary">
                          Add New Address
                        </Typography>
                      </CardActionArea>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Form Section */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: "white",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              }}
            >
              <Typography
                variant="h6"
                fontWeight="700"
                mb={3}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <LocationIcon color="primary" /> Shipping Address
              </Typography>
              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.fullName}
                        onChange={handleChange("fullName")}
                        error={!!errors.fullName}
                        helperText={errors.fullName}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={formData.phone}
                        onChange={handleChange("phone")}
                        error={!!errors.phone}
                        helperText={errors.phone}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    label="Address (House No, Building, Street)"
                    value={formData.address}
                    onChange={handleChange("address")}
                    error={!!errors.address}
                    helperText={errors.address}
                    multiline
                    rows={3}
                  />

                  <TextField
                    fullWidth
                    label="Landmark (Optional)"
                    value={formData.landmark}
                    onChange={handleChange("landmark")}
                    placeholder="Near temple, school, etc."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <HomeIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.state}>
                        <InputLabel>State</InputLabel>
                        <Select
                          value={formData.state}
                          label="State"
                          onChange={handleChange("state")}
                        >
                          <MenuItem value="">
                            <em>Select State</em>
                          </MenuItem>
                          {states.map((state) => (
                            <MenuItem key={state} value={state}>
                              {state}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl
                        fullWidth
                        error={!!errors.city}
                        disabled={!formData.state}
                      >
                        <InputLabel>City</InputLabel>
                        <Select
                          value={formData.city}
                          label="City"
                          onChange={handleChange("city")}
                        >
                          <MenuItem value="">
                            <em>Select City</em>
                          </MenuItem>
                          {formData.state && stateCityData[formData.state]
                            ? stateCityData[formData.state].map((city) => (
                                <MenuItem key={city} value={city}>
                                  {city}
                                </MenuItem>
                              ))
                            : null}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    label="Pincode"
                    value={formData.pincode}
                    onChange={handleChange("pincode")}
                    error={!!errors.pincode}
                    helperText={errors.pincode}
                  />

                  <TextField
                    fullWidth
                    label="Delivery Instructions (Optional)"
                    value={formData.deliveryInstructions}
                    onChange={handleChange("deliveryInstructions")}
                    multiline
                    rows={2}
                    placeholder="Any specific instructions for delivery"
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{
                      py: 2,
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      bgcolor: "#2E7D32",
                      boxShadow: "0 8px 16px rgba(46, 125, 50, 0.2)",
                      transition: "transform 0.2s",
                      "&:hover": {
                        bgcolor: "#1B5E20",
                        transform: "translateY(-2px)",
                      },
                      mt: 2,
                    }}
                  >
                    Proceed to Payment
                  </Button>
                </Stack>
              </form>
            </Paper>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                position: "sticky",
                top: 24,
                bgcolor: "white",
                borderRadius: 4,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "1px solid #f0f0f0",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                fontWeight="700"
                sx={{ color: "#1a1a1a", mb: 2 }}
              >
                Order Summary
              </Typography>
              <Stack spacing={2}>
                {cart.map((item) => (
                  <Box
                    key={item.cartItemId}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight="500"
                        color="text.primary"
                      >
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Qty: {item.quantity}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="600">
                      ₹{item.price * item.quantity}
                    </Typography>
                  </Box>
                ))}

                <Divider
                  sx={{ borderStyle: "dashed", borderColor: "#e0e0e0" }}
                />

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography fontWeight="500">₹{subtotal}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Delivery</Typography>
                  <Typography
                    fontWeight="500"
                    color={deliveryFee === 0 ? "success.main" : "inherit"}
                  >
                    {deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: "#000" }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6" fontWeight="800" color="#1a1a1a">
                    Total
                  </Typography>
                  <Typography variant="h5" fontWeight="800" color="#2E7D32">
                    ₹{total}
                  </Typography>
                </Box>

                {deliveryFee > 0 && (
                  <Alert
                    severity="info"
                    icon={<LocalShippingIcon fontSize="inherit" />}
                    sx={{
                      borderRadius: 2,
                      bgcolor: "#e3f2fd",
                      "& .MuiAlert-icon": { color: "#1976d2" },
                    }}
                  >
                    Add{" "}
                    <Box component="span" fontWeight="bold">
                      ₹{5000 - subtotal}
                    </Box>{" "}
                    more for free delivery!
                  </Alert>
                )}

                <Box
                  sx={{
                    mt: 2,
                    bgcolor: "#f9f9f9",
                    p: 1.5,
                    borderRadius: 2,
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  <SecurityIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Safe & Secure Payment
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DeliveryDetailsPage;
