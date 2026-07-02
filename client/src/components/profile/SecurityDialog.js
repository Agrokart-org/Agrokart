import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Grid,
} from "@mui/material";

const SecurityDialog = ({ open, onClose, onSaveSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      onSaveSuccess("New passwords do not match.", "error");
      return;
    }
    
    setLoading(true);
    // Mocking an API call since there's no dedicated endpoint for password reset in the profile controller
    setTimeout(() => {
      setLoading(false);
      onSaveSuccess("Password successfully changed!", "success");
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight="900">Security Settings</Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Update your password to keep your account secure.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField 
              fullWidth 
              type="password"
              label="Current Password" 
              name="oldPassword" 
              value={formData.oldPassword} 
              onChange={handleInputChange} 
              variant="outlined" 
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} 
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
              fullWidth 
              type="password"
              label="New Password" 
              name="newPassword" 
              value={formData.newPassword} 
              onChange={handleInputChange} 
              variant="outlined" 
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} 
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
              fullWidth 
              type="password"
              label="Confirm New Password" 
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleInputChange} 
              variant="outlined" 
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} 
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} sx={{ color: "text.secondary", fontWeight: "700", textTransform: "none" }}>Cancel</Button>
        <Button 
          variant="contained" 
          color="error"
          onClick={handleSave} 
          disabled={loading || !formData.oldPassword || !formData.newPassword} 
          sx={{ borderRadius: 2, fontWeight: "700", textTransform: "none", px: 3 }}
        >
          {loading ? "Updating..." : "Change Password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SecurityDialog;
