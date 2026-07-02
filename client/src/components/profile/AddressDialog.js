import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Grid,
  Box,
  Paper,
  IconButton
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Add as AddIcon
} from "@mui/icons-material";
import { safeFetch, API_BASE_URL } from "../../services/api";

const AddressDialog = ({ open, onClose, user, onSaveSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Check if user has a valid saved address
  const hasSavedAddress = user?.address && (user.address.street || user.address.city);

  useEffect(() => {
    if (user?.address && open) {
      setFormData({
        street: user.address.street || "",
        city: user.address.city || "",
        state: user.address.state || "",
        pincode: user.address.pincode || "",
      });
      // If they have an address, show the saved list first. Otherwise, go straight to edit mode.
      setIsEditing(!hasSavedAddress);
    } else if (open) {
      setIsEditing(true);
    }
  }, [user, open, hasSavedAddress]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setLoading(true);
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
            street: formData.street,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
        }),
      });

      if (res.ok) {
        onSaveSuccess("Address updated successfully!", "success");
        setIsEditing(false); // Go back to view mode on success
        onClose(); // Optional: close dialog completely, or we could just show the new list.
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error(error);
      onSaveSuccess("Failed to update address.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
      <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5" fontWeight="900">
          {isEditing ? "Edit Delivery Address" : "Saved Addresses"}
        </Typography>
        {isEditing && hasSavedAddress && (
           <Button size="small" onClick={() => setIsEditing(false)} sx={{ textTransform: "none", fontWeight: "700" }}>
             Back to Saved
           </Button>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        {!isEditing ? (
          // View Mode: Show Saved Addresses
          <Box>
            {hasSavedAddress ? (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  border: "2px solid", 
                  borderColor: "primary.main", 
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2
                }}
              >
                <LocationIcon color="primary" sx={{ mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="800" gutterBottom>
                    Primary Address
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.address.street}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.address.city}, {user.address.state} {user.address.pincode}
                  </Typography>
                </Box>
                <IconButton onClick={() => setIsEditing(true)} color="primary" size="small" sx={{ bgcolor: "primary.50" }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Paper>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                No addresses saved yet.
              </Typography>
            )}
            
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />} 
                onClick={() => {
                  setFormData({ street: "", city: "", state: "", pincode: "" });
                  setIsEditing(true);
                }} 
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: "700" }}
              >
                Add New Address
              </Button>
            </Box>
          </Box>
        ) : (
          // Edit Mode: Show Form
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Street / House No." name="street" value={formData.street} onChange={handleInputChange} variant="outlined" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="City" name="city" value={formData.city} onChange={handleInputChange} variant="outlined" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="State" name="state" value={formData.state} onChange={handleInputChange} variant="outlined" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} variant="outlined" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} sx={{ color: "text.secondary", fontWeight: "700", textTransform: "none" }}>
          Close
        </Button>
        {isEditing && (
          <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ borderRadius: 2, fontWeight: "700", textTransform: "none", px: 3 }}>
            {loading ? "Saving..." : "Save Address"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddressDialog;
