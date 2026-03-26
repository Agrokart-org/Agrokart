import React, { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Avatar,
  Slide,
  Chip,
  useTheme,
  IconButton,
} from "@mui/material";
import {
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  ShoppingBag as OrderIcon,
  AttachMoney,
  LocationOn,
  Close as CloseIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// Transition for the dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const OrderNotificationModal = ({ open, onClose, onAccept, order }) => {
  const theme = useTheme();
  // Use a ref to prevent audio playing multiple times if component re-renders
  const audioRef = useRef(
    new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    ),
  ); // Professional notification "ping"

  useEffect(() => {
    if (open) {
      // 1. Play Sound
      audioRef.current
        .play()
        .catch((err) =>
          console.log("Audio play failed (interaction needed):", err),
        );

      // 2. Vibrate (Mobile)
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [open]);

  if (!order) return null;

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      aria-describedby="new-order-dialog"
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)", // Subtle gradient
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          overflow: "visible", // For floating elements
          m: 2,
          minWidth: "300px",
        },
      }}
    >
      {/* Header with Close Button */}
      <Box
        sx={{
          position: "relative",
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "text.secondary",
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Avatar
            sx={{
              width: 70,
              height: 70,
              bgcolor: theme.palette.success.main,
              boxShadow: "0 4px 12px rgba(46, 125, 50, 0.4)",
            }}
          >
            <OrderIcon sx={{ fontSize: 35, color: "white" }} />
          </Avatar>
        </motion.div>
      </Box>

      <DialogContent sx={{ textAlign: "center", pb: 1, pt: 0 }}>
        <Typography
          variant="h5"
          fontWeight="800"
          gutterBottom
          sx={{ color: theme.palette.success.dark }}
        >
          New Order Received!
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          A customer nearby is requesting items.
        </Typography>

        {/* Order Details Card */}
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "white",
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            textAlign: "left",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Order ID
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold">
              {order.trackingNumber || order.orderId?.slice(-6) || "N/A"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Amount
            </Typography>
            <Chip
              icon={<AttachMoney sx={{ fontSize: "1rem !important" }} />}
              label={`₹${order.amount || 0}`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: "bold" }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <LocationOn sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {order.location || "Pune, Maharashtra"}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, flexDirection: "column", gap: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          color="success"
          size="large"
          startIcon={<AcceptIcon />}
          onClick={onAccept}
          sx={{
            borderRadius: 3,
            py: 1.5,
            fontWeight: "bold",
            fontSize: "1rem",
            boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
          }}
        >
          Accept Order
        </Button>
        <Button
          fullWidth
          variant="text"
          color="error"
          onClick={onClose}
          startIcon={<RejectIcon />}
          sx={{ borderRadius: 3 }}
        >
          Ignore
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderNotificationModal;
