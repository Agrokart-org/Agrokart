import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Radio,
  Paper,
  Box,
} from "@mui/material";
import {
  LocalShipping as CodIcon,
  QrCode as UpiIcon,
} from "@mui/icons-material";

const PaymentDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight="900">Saved Payment Methods</Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select your default payment method for faster checkout.
        </Typography>
        <List>
          <Paper elevation={0} sx={{ border: "2px solid", borderColor: "primary.main", borderRadius: 3, mb: 2 }}>
            <ListItem>
              <ListItemIcon>
                <CodIcon sx={{ color: "primary.main" }} />
              </ListItemIcon>
              <ListItemText 
                primary="Cash on Delivery (COD)" 
                secondary="Pay when your order arrives" 
                primaryTypographyProps={{ fontWeight: "700" }} 
              />
              <Radio checked={true} color="primary" />
            </ListItem>
          </Paper>
          <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 3 }}>
            <ListItem>
              <ListItemIcon>
                <UpiIcon sx={{ color: "text.secondary" }} />
              </ListItemIcon>
              <ListItemText 
                primary="UPI (GPay / PhonePe)" 
                secondary="Requires confirmation during checkout" 
                primaryTypographyProps={{ fontWeight: "700" }} 
              />
              <Radio checked={false} />
            </ListItem>
          </Paper>
        </List>
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button variant="outlined" sx={{ borderRadius: 2, textTransform: "none", fontWeight: "700" }}>
            + Add New Card
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} sx={{ color: "text.secondary", fontWeight: "700", textTransform: "none" }}>Close</Button>
        <Button variant="contained" onClick={onClose} sx={{ borderRadius: 2, fontWeight: "700", textTransform: "none", px: 3 }}>
          Save Default
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;
