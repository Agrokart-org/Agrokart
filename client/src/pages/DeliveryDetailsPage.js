import React, { useState } from "react";
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
  Alert,
  IconButton,
  Divider,
  Card,
  CardContent,
  CardActionArea,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Radio,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  LocalShipping as LocalShippingIcon,
  Home as HomeIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  MyLocation as MyLocationIcon,
  Business as BusinessIcon,
  Place as PlaceIcon,
} from "@mui/icons-material";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { hierarchicalLocationData } from "../data/hierarchicalLocationData";

const DeliveryDetailsPage = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal } = useCart();
  const { user } = useAuth();
  
  // State for View Management
  const [view, setView] = useState("select"); // "select" or "form"
  
  const [selectedAddressId, setSelectedAddressId] = useState(1);
  
  // City coordinates lookup for fallback when geolocation is unavailable
  const cityCoordinates = {
    Mumbai: [72.8777, 19.076],
    Pune: [73.8567, 18.5204],
    Nashik: [73.7898, 19.9975],
    // ... add more if needed
  };

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

  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    address: getAddressString(user?.address) || "",
    landmark: "",
    district: getAddressComponent(user?.address, "district") || "",
    taluka: getAddressComponent(user?.address, "taluka") || "",
    village: getAddressComponent(user?.address, "village") || "",
    city: getAddressComponent(user?.address, "city") || "",
    state: getAddressComponent(user?.address, "state") || "",
    pincode: getAddressComponent(user?.address, "pincode") || "",
    deliveryInstructions: "",
    addressType: "Home",
    isDefault: false
  });
  const [errors, setErrors] = useState({});
  const [deliverySlot, setDeliverySlot] = useState("today");

  const states = Object.keys(hierarchicalLocationData);
  const getDistricts = (state) => state && hierarchicalLocationData[state] ? Object.keys(hierarchicalLocationData[state]) : [];
  const getTalukas = (state, district) => state && district && hierarchicalLocationData[state] && hierarchicalLocationData[state][district] ? Object.keys(hierarchicalLocationData[state][district]) : [];
  const getVillages = (state, district, taluka) => state && district && taluka && hierarchicalLocationData[state] && hierarchicalLocationData[state][district] && hierarchicalLocationData[state][district][taluka] ? hierarchicalLocationData[state][district][taluka] : [];

  // Local state for addresses
  const [userAddresses, setUserAddresses] = useState([
    {
      id: 1,
      type: "Home",
      address: "123 Farm Road, Green Valley",
      district: "Pune",
      taluka: "Pune City",
      village: "Pune",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      phone: "9876543210",
      fullName: user?.name || "John Doe",
      isDefault: true
    },
    {
      id: 2,
      type: "Farm House",
      address: "Plot 45, Agro Zone, Near River",
      district: "Nashik",
      taluka: "Nashik",
      village: "Nashik",
      city: "Nashik",
      state: "Maharashtra",
      pincode: "422001",
      phone: "9876543210",
      fullName: user?.name || "John Doe",
      isDefault: false
    },
  ]);

  const handleEditAddress = (addr) => {
    setFormData({
      fullName: addr.fullName || user?.name || "",
      phone: addr.phone || user?.phone || "",
      address: addr.address || "",
      landmark: addr.landmark || "",
      district: addr.district || "",
      taluka: addr.taluka || "",
      village: addr.village || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      deliveryInstructions: addr.deliveryInstructions || "",
      addressType: addr.type || "Home",
      isDefault: addr.isDefault || false,
      id: addr.id
    });
    setErrors({});
    setView("form");
  };

  const handleAddNewAddress = () => {
    setFormData({
      fullName: user?.name || "",
      phone: user?.phone || "",
      address: "",
      landmark: "",
      district: "",
      taluka: "",
      village: "",
      city: "",
      state: "",
      pincode: "",
      deliveryInstructions: "",
      addressType: "Home",
      isDefault: false,
      id: null
    });
    setErrors({});
    setView("form");
  };

  const handleUseCurrentLocation = async () => {
    setIsReverseGeocoding(true);
    
    const getLocation = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          const { Geolocation } = await import("@capacitor/geolocation");
          const perm = await Geolocation.checkPermissions();
          if (perm.location !== "granted") {
            await Geolocation.requestPermissions();
          }
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
          });
          return { lat: position.coords.latitude, lon: position.coords.longitude };
        }
      } catch (e) {
        console.warn("Capacitor geolocation failed, trying browser:", e);
      }
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
            (error) => reject(error),
            { timeout: 5000, enableHighAccuracy: true },
          );
        } else {
          reject(new Error("Geolocation not supported"));
        }
      });
    };

    try {
      const coords = await getLocation();
      
      // Use OpenStreetMap Nominatim for free reverse geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}&zoom=18&addressdetails=1`);
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        
        // Try to map OSM data to our form fields
        let newState = addr.state || "";
        let newDistrict = addr.state_district || addr.county || "";
        let newCity = addr.city || addr.town || addr.village || "";
        let newPincode = addr.postcode || "";
        let newStreet = [addr.house_number, addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(", ");
        
        // Update form data with whatever we found
        setFormData(prev => ({
          ...prev,
          state: newState,
          district: newDistrict,
          city: newCity,
          pincode: newPincode,
          address: newStreet || prev.address
        }));
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      alert("Could not determine your location. Please check permissions or enter manually.");
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleSaveAddress = () => {
    if (!validateForm()) return;
    
    const newAddress = {
      id: formData.id || Date.now(),
      type: formData.addressType,
      address: formData.address,
      landmark: formData.landmark,
      district: formData.district,
      taluka: formData.taluka,
      village: formData.village,
      city: formData.city || formData.village,
      state: formData.state,
      pincode: formData.pincode,
      phone: formData.phone,
      fullName: formData.fullName,
      isDefault: formData.isDefault
    };

    let updatedAddresses = [...userAddresses];
    
    // If setting as default, remove default from others
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map(a => ({...a, isDefault: false}));
    }

    if (formData.id) {
      // Update existing
      updatedAddresses = updatedAddresses.map(a => a.id === formData.id ? newAddress : a);
    } else {
      // Add new
      updatedAddresses.push(newAddress);
    }

    setUserAddresses(updatedAddresses);
    setSelectedAddressId(newAddress.id);
    setView("select");
  };

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 5000 ? 0 : 200;
  const total = subtotal + deliveryFee;

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });

    if (field === "state") {
      setFormData((prev) => ({ ...prev, state: event.target.value, district: "", taluka: "", village: "", city: "" }));
    } else if (field === "district") {
      setFormData((prev) => ({ ...prev, district: event.target.value, taluka: "", village: "", city: "" }));
    } else if (field === "taluka") {
      setFormData((prev) => ({ ...prev, taluka: event.target.value, village: "", city: "" }));
    } else if (field === "village") {
      setFormData((prev) => ({ ...prev, village: event.target.value, city: event.target.value }));
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
    if (!formData.fullName?.trim()) newErrors.fullName = "Name is required";
    if (!formData.phone?.trim()) newErrors.phone = "Phone number is required";
    if (!formData.address?.trim()) newErrors.address = "Address is required";
    if (!formData.state?.trim()) newErrors.state = "State is required";
    if (!formData.pincode?.trim()) newErrors.pincode = "Pincode is required";
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitWithData = async (dataToSubmit) => {
    const getCityCoordinates = () => {
      const cityInput = (dataToSubmit.city || "").trim().toLowerCase();
      const cityKey = Object.keys(cityCoordinates).find(
        (key) => key.toLowerCase() === cityInput
      );
      const coords = cityKey ? cityCoordinates[cityKey] : null;
      if (coords) return { longitude: coords[0], latitude: coords[1] };
      return { longitude: 78.9629, latitude: 20.5937 };
    };

    const getLocation = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          const { Geolocation } = await import("@capacitor/geolocation");
          const perm = await Geolocation.checkPermissions();
          if (perm.location !== "granted") {
            await Geolocation.requestPermissions();
          }
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
          });
          return { longitude: position.coords.longitude, latitude: position.coords.latitude };
        }
      } catch (e) {
        console.warn("Capacitor geolocation failed, trying browser:", e);
      }
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => resolve({ longitude: position.coords.longitude, latitude: position.coords.latitude }),
            (error) => resolve(getCityCoordinates()),
            { timeout: 5000, enableHighAccuracy: true },
          );
        } else {
          resolve(getCityCoordinates());
        }
      });
    };

    try {
      const coords = await getLocation();
      const deliveryDetailsWithCoords = {
        ...dataToSubmit,
        coordinates: { type: "Point", coordinates: [coords.longitude, coords.latitude] },
      };
      localStorage.setItem("deliveryDetails", JSON.stringify(deliveryDetailsWithCoords));
      navigate("/payment");
    } catch (error) {
      const fallbackCoords = getCityCoordinates();
      const deliveryDetailsWithCoords = {
        ...dataToSubmit,
        coordinates: { type: "Point", coordinates: [fallbackCoords.longitude, fallbackCoords.latitude] },
      };
      localStorage.setItem("deliveryDetails", JSON.stringify(deliveryDetailsWithCoords));
      navigate("/payment");
    }
  };

  const handleContinueToPayment = () => {
    if (!selectedAddressId) {
      alert("Please select an address");
      return;
    }
    const selectedAddress = userAddresses.find(a => a.id === selectedAddressId);
    submitWithData(selectedAddress);
  };

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", pb: { xs: 20, md: 12 } }}>
      {/* Stepper only in select view */}
      {view === "select" && (
        <Container maxWidth="lg" sx={{ pt: 4 }}>
          <Box sx={{ mb: 4, width: "100%", mt: 2 }}>
            <Stepper activeStep={1} alternativeLabel>
              {["Cart", "Delivery Details", "Payment"].map((label) => (
                <Step key={label}>
                  <StepLabel
                    StepIconProps={{
                      sx: { "&.Mui-active": { color: "#2E7D32" }, "&.Mui-completed": { color: "#2E7D32" } },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", "&:hover": { bgcolor: "#f5f5f5" } }}>
              <ArrowBackIcon sx={{ color: "#2E7D32" }} />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.5px" }}>
              Delivery Details
            </Typography>
          </Box>
        </Container>
      )}

      {/* Form View Header */}
      {view === "form" && (
        <Box sx={{ bgcolor: "white", p: 2, display: "flex", alignItems: "center", gap: 2, borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 10 }}>
          <IconButton onClick={() => setView("select")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="700">
            {formData.id ? "Edit address" : "Add new address"}
          </Typography>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ pt: view === "form" ? 0 : 2 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            
            {/* VIEW: SELECT ADDRESS */}
            {view === "select" && (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" fontWeight="700" sx={{ color: "#1a1a1a" }}>
                    Choose an address
                  </Typography>
                  <Button startIcon={<AddIcon />} sx={{ color: "#2E7D32", textTransform: "none", fontWeight: 700 }} onClick={handleAddNewAddress}>
                    Add new
                  </Button>
                </Box>

                <Stack spacing={2}>
                  {userAddresses.map((addr) => (
                    <Card
                      key={addr.id}
                      variant="outlined"
                      sx={{
                        borderColor: selectedAddressId === addr.id ? "#2E7D32" : "#e0e0e0",
                        borderWidth: selectedAddressId === addr.id ? 2 : 1,
                        bgcolor: selectedAddressId === addr.id ? "#f9fbe7" : "white",
                        borderRadius: 3,
                        transition: "all 0.2s",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                          <Box sx={{ mt: 0.5 }}>
                            {addr.type === "Home" ? <HomeIcon sx={{ color: "text.secondary" }} /> : 
                             addr.type === "Farm" ? <PlaceIcon sx={{ color: "text.secondary" }} /> : 
                             <BusinessIcon sx={{ color: "text.secondary" }} />}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" fontWeight="700">
                                {addr.type}
                              </Typography>
                              {addr.isDefault && (
                                <Box sx={{ bgcolor: "#e3f2fd", color: "#1976d2", px: 1, py: 0.2, borderRadius: 1, fontSize: "0.7rem", fontWeight: 600 }}>
                                  Default
                                </Box>
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {addr.address}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {addr.city}, {addr.state} - {addr.pincode}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <Radio 
                              checked={selectedAddressId === addr.id}
                              sx={{ color: "#2E7D32", "&.Mui-checked": { color: "#2E7D32" }, p: 0.5 }}
                            />
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }} sx={{ mt: 1 }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}

                  <Card
                    variant="outlined"
                    sx={{
                      borderStyle: "dashed",
                      borderColor: "#bdbdbd",
                      borderRadius: 3,
                      bgcolor: "transparent",
                      cursor: "pointer",
                      "&:hover": { borderColor: "#2E7D32", bgcolor: "rgba(46, 125, 50, 0.04)" }
                    }}
                    onClick={handleAddNewAddress}
                  >
                    <CardActionArea sx={{ p: 2, display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
                      <AddIcon sx={{ color: "#2E7D32" }} />
                      <Typography fontWeight="700" color="primary">Add new address</Typography>
                    </CardActionArea>
                  </Card>
                </Stack>
              </Box>
            )}

            {/* VIEW: FORM */}
            {view === "form" && (
              <Box>
                {/* Map Placeholder */}
                <Box sx={{ height: 200, bgcolor: "#e0e0e0", backgroundImage: "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px", position: "relative", mb: 3 }}>
                  <Button 
                    variant="contained" 
                    startIcon={<MyLocationIcon />} 
                    onClick={handleUseCurrentLocation}
                    disabled={isReverseGeocoding}
                    sx={{ position: "absolute", bottom: 16, right: 16, bgcolor: "#333", "&:hover": { bgcolor: "#111" }, borderRadius: 8, textTransform: "none", px: 3 }}
                  >
                    {isReverseGeocoding ? "Locating..." : "Use current location"}
                  </Button>
                </Box>

                <Stack spacing={3}>
                  <Box>
                    <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 1, display: "block" }}>Search area, street or landmark</Typography>
                    <TextField
                      fullWidth
                      placeholder="Search for a location"
                      variant="outlined"
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                        sx: { borderRadius: 2, bgcolor: "white" }
                      }}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 1, display: "block" }}>State</Typography>
                      <TextField
                        select
                        fullWidth
                        value={formData.state}
                        onChange={handleChange("state")}
                        error={!!errors.state}
                        SelectProps={{ native: true }}
                        variant="outlined"
                        InputProps={{ sx: { borderRadius: 2, bgcolor: "white" } }}
                      >
                        <option value=""></option>
                        {states.map((state) => <option key={state} value={state}>{state}</option>)}
                      </TextField>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 1, display: "block" }}>District</Typography>
                      <TextField
                        select
                        fullWidth
                        value={formData.district}
                        onChange={handleChange("district")}
                        disabled={!formData.state}
                        SelectProps={{ native: true }}
                        variant="outlined"
                        InputProps={{ sx: { borderRadius: 2, bgcolor: "white" } }}
                      >
                        <option value=""></option>
                        {getDistricts(formData.state).map((district) => <option key={district} value={district}>{district}</option>)}
                      </TextField>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 1, display: "block" }}>Taluka</Typography>
                      <TextField
                        select
                        fullWidth
                        value={formData.taluka}
                        onChange={handleChange("taluka")}
                        disabled={!formData.district}
                        SelectProps={{ native: true }}
                        variant="outlined"
                        InputProps={{ sx: { borderRadius: 2, bgcolor: "white" } }}
                      >
                        <option value=""></option>
                        {getTalukas(formData.state, formData.district).map((taluka) => <option key={taluka} value={taluka}>{taluka}</option>)}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 1, display: "block" }}>Village / City</Typography>
                      <TextField
                        select
                        fullWidth
                        value={formData.village}
                        onChange={handleChange("village")}
                        disabled={!formData.taluka}
                        SelectProps={{ native: true }}
                        variant="outlined"
                        InputProps={{ sx: { borderRadius: 2, bgcolor: "white" } }}
                      >
                        <option value=""></option>
                        {getVillages(formData.state, formData.district, formData.taluka).map((village) => <option key={village} value={village}>{village}</option>)}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 1, display: "block" }}>Pincode</Typography>
                      <TextField
                        fullWidth
                        value={formData.pincode}
                        onChange={handleChange("pincode")}
                        error={!!errors.pincode}
                        variant="outlined"
                        InputProps={{ sx: { borderRadius: 2, bgcolor: "white" } }}
                      />
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 1, display: "block" }}>House / flat / farm no.</Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g. Plot 12, Green Fields Farm"
                      value={formData.address}
                      onChange={handleChange("address")}
                      error={!!errors.address}
                      variant="outlined"
                      InputProps={{ sx: { borderRadius: 2, bgcolor: "white" } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 1, display: "block" }}>Landmark (optional)</Typography>
                    <TextField
                      fullWidth
                      placeholder="Near the water tower"
                      value={formData.landmark}
                      onChange={handleChange("landmark")}
                      variant="outlined"
                      InputProps={{ sx: { borderRadius: 2, bgcolor: "white" } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 1, display: "block" }}>Save address as</Typography>
                    <Grid container spacing={2}>
                      {["Home", "Farm", "Other"].map((type) => (
                        <Grid item xs={4} key={type}>
                          <Button
                            fullWidth
                            variant={formData.addressType === type ? "contained" : "outlined"}
                            onClick={() => setFormData({...formData, addressType: type})}
                            sx={{
                              borderRadius: 2,
                              color: formData.addressType === type ? "white" : "text.primary",
                              borderColor: formData.addressType === type ? "primary.main" : "#e0e0e0",
                              bgcolor: formData.addressType === type ? "#2E7D32" : "white",
                              "&:hover": { bgcolor: formData.addressType === type ? "#1B5E20" : "#f5f5f5" },
                              textTransform: "none",
                              fontWeight: 700,
                              py: 1
                            }}
                            startIcon={type === "Home" ? <HomeIcon /> : type === "Farm" ? <PlaceIcon /> : <BusinessIcon />}
                          >
                            {type}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Box>
                    <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 1, display: "block" }}>Receiver's name</Typography>
                    <TextField
                      fullWidth
                      placeholder="Full name"
                      value={formData.fullName}
                      onChange={handleChange("fullName")}
                      error={!!errors.fullName}
                      variant="outlined"
                      InputProps={{ sx: { borderRadius: 2, bgcolor: "white" } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 1, display: "block" }}>Phone number</Typography>
                    <TextField
                      fullWidth
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange("phone")}
                      error={!!errors.phone}
                      variant="outlined"
                      InputProps={{ sx: { borderRadius: 2, bgcolor: "white" } }}
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                        sx={{ color: "#2E7D32", "&.Mui-checked": { color: "#2E7D32" } }}
                      />
                    }
                    label={<Typography fontWeight="600">Set as default delivery address</Typography>}
                  />

                </Stack>
              </Box>
            )}

          </Grid>

          {/* Order Summary (Only in select view to match usual checkout flow, or keep sticky) */}
          {view === "select" && (
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
                <Typography variant="h6" gutterBottom fontWeight="700" sx={{ color: "#1a1a1a", mb: 2 }}>
                  Order Summary
                </Typography>
                <Stack spacing={2}>
                  {cart.map((item) => (
                    <Box key={item.cartItemId} sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="500" color="text.primary">{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">Qty: {item.quantity}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="600">₹{item.price * item.quantity}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ borderStyle: "dashed", borderColor: "#e0e0e0" }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography color="text.secondary">Subtotal</Typography>
                    <Typography fontWeight="500">₹{subtotal}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography color="text.secondary">Delivery</Typography>
                    <Typography fontWeight="500" color={deliveryFee === 0 ? "success.main" : "inherit"}>
                      {deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: "#000" }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" fontWeight="800" color="#1a1a1a">Total</Typography>
                    <Typography variant="h5" fontWeight="800" color="#2E7D32">₹{total}</Typography>
                  </Box>
                  {deliveryFee > 0 && (
                    <Alert severity="info" icon={<LocalShippingIcon fontSize="inherit" />} sx={{ borderRadius: 2, bgcolor: "#e3f2fd", "& .MuiAlert-icon": { color: "#1976d2" } }}>
                      Add <Box component="span" fontWeight="bold">₹{5000 - subtotal}</Box> more for free delivery!
                    </Alert>
                  )}
                  <Box sx={{ mt: 2, bgcolor: "#f9f9f9", p: 1.5, borderRadius: 2, display: "flex", gap: 1, alignItems: "center" }}>
                    <SecurityIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">Safe & Secure Payment</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* Sticky Bottom Actions */}
      <Paper 
        elevation={8} 
        sx={{ 
          position: "fixed", 
          bottom: { xs: 56, md: 0 }, 
          left: 0, 
          right: 0, 
          p: 2, 
          bgcolor: "white", 
          zIndex: 1000,
          borderTop: "1px solid #e0e0e0"
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            {view === "select" ? (
              <Button
                variant="contained"
                onClick={handleContinueToPayment}
                disabled={!selectedAddressId}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  bgcolor: "#2E7D32",
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#1B5E20" }
                }}
              >
                Continue to payment →
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSaveAddress}
                fullWidth
                sx={{
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  bgcolor: "#2E7D32",
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#1B5E20" }
                }}
              >
                Save address
              </Button>
            )}
          </Box>
        </Container>
      </Paper>
    </Box>
  );
};

export default DeliveryDetailsPage;
