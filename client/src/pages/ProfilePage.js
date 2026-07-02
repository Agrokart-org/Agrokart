import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Paper,
  Chip,
  LinearProgress,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Tooltip,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  ListItemButton
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  Payment as PaymentIcon,
  Favorite as FavoriteIcon,
  Edit as EditIcon,
  ArrowForward as ArrowForwardIcon,
  ShoppingBag as OrderIcon,
  Notifications as NotificationsIcon,
  Star as StarIcon,
  Agriculture as AgricultureIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  CameraAlt as CameraIcon,
  VerifiedUser as VerifiedIcon,
  Logout as LogoutIcon,
  GpsFixed as GpsIcon
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { safeFetch, API_BASE_URL } from "../services/api";
import bannerOrganic from "../assets/banner_organic_harvest.png";

import AddressDialog from "../components/profile/AddressDialog";
import PaymentDialog from "../components/profile/PaymentDialog";
import LanguageDialog from "../components/profile/LanguageDialog";
import SecurityDialog from "../components/profile/SecurityDialog";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, updateUserProfile } = useAuth();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  
  // Dialog states
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB.");
      return;
    }

    setUploading(true);

    const userId = user?.id || user?.uid || user?._id;
    if (!userId) {
      setSnackbar({ open: true, message: "User ID not found. Please log in again.", severity: "error" });
      setUploading(false);
      return;
    }

    const storageRef = ref(storage, `profile_images/${userId}_${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const uploadPromise = new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        null,
        (error) => reject(error),
        async () => {
          try {
            if (uploadTask.snapshot.ref) {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } else {
              reject(new Error("Upload failed: No ref found"));
            }
          } catch (err) {
            reject(err);
          }
        },
      );
    });

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Upload timed out.")), 15000),
      );
      const photoURL = await Promise.race([uploadPromise, timeoutPromise]);
      await updateUserProfile({ photoURL });
      setSnackbar({ open: true, message: "Profile picture updated!", severity: "success" });
    } catch (error) {
      console.error("Error uploading image:", error);
      setSnackbar({ open: true, message: "Failed to upload image. " + error.message, severity: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [updatingLocation, setUpdatingLocation] = useState(false);

  const handleUpdateLocation = () => {
    if (navigator.geolocation) {
      setUpdatingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const token = localStorage.getItem("authToken");
            const res = await safeFetch(`${API_BASE_URL}/users/profile`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "x-auth-token": token,
              },
              body: JSON.stringify({
                address: {
                  coordinates: [position.coords.longitude, position.coords.latitude]
                }
              })
            });
            if (res.ok) {
              setSnackbar({ open: true, message: "Location updated successfully!", severity: "success" });
            } else {
              setSnackbar({ open: true, message: "Failed to update location.", severity: "error" });
            }
          } catch (e) {
            setSnackbar({ open: true, message: "Network error updating location.", severity: "error" });
          } finally {
            setUpdatingLocation(false);
          }
        },
        (error) => {
          console.error("GPS Error", error);
          setSnackbar({ open: true, message: "GPS access denied or unavailable.", severity: "error" });
          setUpdatingLocation(false);
        }
      );
    } else {
      setSnackbar({ open: true, message: "Geolocation not supported by browser.", severity: "error" });
    }
  };

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      await updateUserProfile({
        name: formData.name,
      });
      setEditDialogOpen(false);
      setSnackbar({ open: true, message: "Profile updated successfully!", severity: "success" });
    } catch (error) {
      console.error("Failed to update profile:", error);
      setSnackbar({ open: true, message: "Failed to update profile.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 }, minHeight: "100vh", bgcolor: "#F9FAFB" }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        
        {/* Profile Header Card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
            mb: 4,
            boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.04)"
          }}
        >
          {/* Cover Image */}
          <Box
            sx={{
              height: 180,
              backgroundImage: `url(${bannerOrganic})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7))",
              }}
            />
          </Box>

          <CardContent sx={{ pt: 0, position: "relative", textAlign: "center", pb: 4 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              badgeContent={
                <IconButton
                  size="small"
                  onClick={() => setEditDialogOpen(true)}
                  sx={{
                    bgcolor: "black",
                    color: "white",
                    border: "3px solid white",
                    "&:hover": { bgcolor: "#333" },
                    width: 36, height: 36
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              }
            >
              <Avatar
                src={user?.avatar || user?.photoURL}
                sx={{
                  width: 120,
                  height: 120,
                  border: "5px solid white",
                  mt: -7,
                  fontSize: "3rem",
                  bgcolor: "primary.main",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}
              >
                {user?.name?.charAt(0) || "U"}
              </Avatar>
            </Badge>

            <Typography variant="h4" fontWeight="900" sx={{ mt: 2, letterSpacing: "-0.5px" }}>
              {user?.name || "Agro User"}
            </Typography>
            <Typography variant="subtitle1" fontWeight="600" color="text.secondary" gutterBottom>
              {user?.role === "customer" ? "Premium Farmer" : "User"}
            </Typography>


            {/* Top Navigation Stats */}
            <Grid container spacing={2} sx={{ mt: 2, px: { xs: 1, sm: 4 } }}>
              <Grid item xs={4}>
                <Box
                  onClick={() => navigate("/my-orders")}
                  sx={{
                    p: 2, borderRadius: 3, bgcolor: "white", border: "1px solid rgba(0,0,0,0.06)",
                    cursor: "pointer", transition: "all 0.2s",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 20px rgba(0,0,0,0.08)", borderColor: "primary.main" }
                  }}
                >
                  <OrderIcon sx={{ color: "primary.main", fontSize: 28, mb: 1 }} />
                  <Typography variant="h6" fontWeight="900">Orders</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box
                  onClick={() => navigate("/wishlist")}
                  sx={{
                    p: 2, borderRadius: 3, bgcolor: "white", border: "1px solid rgba(0,0,0,0.06)",
                    cursor: "pointer", transition: "all 0.2s",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 20px rgba(0,0,0,0.08)", borderColor: "#E91E63" }
                  }}
                >
                  <FavoriteIcon sx={{ color: "#E91E63", fontSize: 28, mb: 1 }} />
                  <Typography variant="h6" fontWeight="900">Saved</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box
                  onClick={() => showToast("Rewards program coming soon!")}
                  sx={{
                    p: 2, borderRadius: 3, bgcolor: "white", border: "1px solid rgba(0,0,0,0.06)",
                    cursor: "pointer", transition: "all 0.2s",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 20px rgba(0,0,0,0.08)", borderColor: "#F59E0B" }
                  }}
                >
                  <StarIcon sx={{ color: "#F59E0B", fontSize: 28, mb: 1 }} />
                  <Typography variant="h6" fontWeight="900">Points</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>


        {/* Settings List */}
        <Typography variant="h6" fontWeight="900" sx={{ mb: 2, ml: 1 }}>Account Settings</Typography>
        <Paper elevation={0} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", mb: 4 }}>
          <List disablePadding>
            <ListItem button onClick={() => setAddressDialogOpen(true)} sx={{ py: 2, borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <ListItemIcon><LocationIcon sx={{ color: "#3B82F6" }} /></ListItemIcon>
              <ListItemText primary="Addresses" secondary="Manage delivery locations" primaryTypographyProps={{ fontWeight: "700" }} />
              <ArrowForwardIcon sx={{ color: "text.disabled", fontSize: 18 }} />
            </ListItem>
            <ListItem button onClick={() => setPaymentDialogOpen(true)} sx={{ py: 2, borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <ListItemIcon><PaymentIcon sx={{ color: "#8B5CF6" }} /></ListItemIcon>
              <ListItemText primary="Payment Methods" secondary="Cards & UPI" primaryTypographyProps={{ fontWeight: "700" }} />
              <ArrowForwardIcon sx={{ color: "text.disabled", fontSize: 18 }} />
            </ListItem>
            <ListItem sx={{ py: 2, borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <ListItemIcon><NotificationsIcon sx={{ color: "#F59E0B" }} /></ListItemIcon>
              <ListItemText primary="Notifications" secondary="Manage alerts" primaryTypographyProps={{ fontWeight: "700" }} />
              <Switch defaultChecked color="primary" />
            </ListItem>
            <ListItem button onClick={() => setLanguageDialogOpen(true)} sx={{ py: 2, borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <ListItemIcon><LanguageIcon sx={{ color: "#10B981" }} /></ListItemIcon>
              <ListItemText primary="Language" secondary="English (US)" primaryTypographyProps={{ fontWeight: "700" }} />
              <ArrowForwardIcon sx={{ color: "text.disabled", fontSize: 18 }} />
            </ListItem>
            <ListItem button onClick={() => setSecurityDialogOpen(true)} sx={{ py: 2, borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <ListItemIcon><SecurityIcon sx={{ color: "#EF4444" }} /></ListItemIcon>
              <ListItemText primary="Security" secondary="Password & 2FA" primaryTypographyProps={{ fontWeight: "700" }} />
              <ArrowForwardIcon sx={{ color: "text.disabled", fontSize: 18 }} />
            </ListItem>
            <ListItemButton onClick={handleUpdateLocation} disabled={updatingLocation} sx={{ py: 2 }}>
              <ListItemIcon><GpsIcon sx={{ color: "#3B82F6" }} /></ListItemIcon>
              <ListItemText
                primary={updatingLocation ? "Detecting..." : "Update Live GPS Location"}
                secondary="Sync your exact location to the server"
                primaryTypographyProps={{ fontWeight: 600, color: "primary.main" }}
              />
            </ListItemButton>
          </List>
        </Paper>

        <Button
          fullWidth
          variant="contained"
          color="error"
          size="large"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ borderRadius: 3, py: 1.5, fontWeight: "800", textTransform: "none", boxShadow: "0 8px 16px rgba(239, 68, 68, 0.2)" }}
        >
          Log Out
        </Button>

      </motion.div>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5" fontWeight="900">Edit Profile</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleImageChange} />
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                badgeContent={
                  <IconButton
                    size="small"
                    disabled={uploading}
                    onClick={handleImageClick}
                    sx={{ bgcolor: "black", color: "white", border: "3px solid white", "&:hover": { bgcolor: "#333" }, "&:disabled": { bgcolor: "grey.400" }, width: 36, height: 36 }}
                  >
                    {uploading ? <CircularProgress size={16} color="inherit" /> : <CameraIcon fontSize="small" />}
                  </IconButton>
                }
              >
                <Avatar src={user?.avatar || user?.photoURL} sx={{ width: 100, height: 100, fontSize: "2.5rem", border: "4px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                  {formData.name?.charAt(0) || "U"}
                </Avatar>
              </Badge>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Full Name" name="name" value={formData.name} onChange={handleInputChange} variant="outlined" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" name="email" value={formData.email} disabled variant="filled" helperText="Email cannot be changed" sx={{ "& .MuiFilledInput-root": { borderRadius: 3 } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone Number" name="phone" value={formData.phone} disabled variant="filled" helperText="Verified phone number" sx={{ "& .MuiFilledInput-root": { borderRadius: 3 } }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" fontWeight="600">
                To update your email or phone number, please contact customer support.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: "text.secondary", fontWeight: "700", textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveChanges} disabled={loading} sx={{ borderRadius: 2, fontWeight: "700", textTransform: "none", px: 3 }}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%", borderRadius: 3, fontWeight: "700" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* New Settings Dialogs */}
      <AddressDialog 
        open={addressDialogOpen} 
        onClose={() => setAddressDialogOpen(false)} 
        user={user} 
        onSaveSuccess={showToast} 
      />
      <PaymentDialog 
        open={paymentDialogOpen} 
        onClose={() => setPaymentDialogOpen(false)} 
      />
      <LanguageDialog 
        open={languageDialogOpen} 
        onClose={() => setLanguageDialogOpen(false)} 
      />
      <SecurityDialog 
        open={securityDialogOpen} 
        onClose={() => setSecurityDialogOpen(false)} 
        onSaveSuccess={showToast}
      />

    </Container>
  );
};

export default ProfilePage;
