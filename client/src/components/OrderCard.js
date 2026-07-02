import React from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Box, Typography, Chip, Divider, Button, Avatar } from "@mui/material";
import { motion } from "framer-motion";
import { ChevronRight as ChevronRightIcon, Inventory2 as PackageIcon } from "@mui/icons-material";

const OrderCard = ({ order }) => {
  const navigate = useNavigate();

  const isApiData = !!order._id;
  const orderId = isApiData ? order._id?.slice(-6).toUpperCase() : order.id;

  const rawStatus = isApiData ? order.orderStatus || "pending" : order.status;
  const statusLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

  const getStatusStyles = (s) => {
    const status = s.toLowerCase();
    if (status === "delivered") return { color: "#059669", bg: "#D1FAE5", border: "#34D399" };
    if (status === "shipped" || status === "out_for_delivery") return { color: "#2563EB", bg: "#DBEAFE", border: "#93C5FD" };
    if (status === "processing" || status === "confirmed") return { color: "#7C3AED", bg: "#EDE9FE", border: "#C4B5FD" };
    if (status === "cancelled") return { color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5" };
    return { color: "#D97706", bg: "#FEF3C7", border: "#FCD34D" }; // pending
  };

  const statusStyles = getStatusStyles(rawStatus);

  const dateStr = isApiData
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : order.date;

  const items = order.items || [];
  const displayItems = items.map((item) => ({
    name: isApiData ? item.product?.name || item.name || "Product" : item.name,
    quantity: item.quantity,
    price: item.price,
    image: isApiData ? item.product?.imageUrl || item.product?.image || "/images/placeholder.jpg" : item.image || "/images/placeholder.jpg"
  }));

  const totalAmount = isApiData ? `₹${order.totalAmount}` : order.total;

  const handleViewDetails = () => {
    const targetId = isApiData ? order._id : order.id;
    navigate(`/order-details/${targetId}`);
  };

  return (
    <Paper
      elevation={0}
      component={motion.div}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
      transition={{ duration: 0.3 }}
      sx={{
        mb: 3,
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.04)",
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        position: "relative",
      }}
    >
      {/* Top Gradient Highlight */}
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(90deg, ${statusStyles.border}, ${statusStyles.color})`, opacity: 0.8 }} />

      <Box sx={{ p: { xs: 2.5, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Order Placed
            </Typography>
            <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mt: 0.5 }}>
              {dateStr}
            </Typography>
          </Box>
          <Chip
            label={statusLabel}
            size="small"
            sx={{
              fontWeight: "700",
              fontSize: "0.7rem",
              borderRadius: "8px",
              bgcolor: statusStyles.bg,
              color: statusStyles.color,
              border: `1px solid ${statusStyles.border}`,
              height: 24,
            }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <PackageIcon sx={{ color: "text.secondary", fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight="900" sx={{ letterSpacing: "-0.5px" }}>
            #{orderId}
          </Typography>
        </Box>

        {/* Image Thumbnails & Items */}
        <Box sx={{ mb: 3 }}>
          {displayItems.slice(0, 3).map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 1.5,
                p: 1.5,
                borderRadius: 3,
                bgcolor: "rgba(0,0,0,0.02)",
                border: "1px solid rgba(0,0,0,0.03)",
                transition: "all 0.2s",
                "&:hover": { bgcolor: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }
              }}
            >
              <Avatar
                src={item.image}
                variant="rounded"
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: "white",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}
              >
                <PackageIcon sx={{ color: "#E0E0E0" }} />
              </Avatar>
              <Box sx={{ flex: 1, overflow: "hidden" }}>
                <Typography variant="body2" fontWeight="700" color="text.primary" noWrap>
                  {item.name}
                </Typography>
                <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  Qty: {item.quantity}
                </Typography>
              </Box>
              <Typography variant="subtitle2" fontWeight="800" color="text.primary">
                ₹{item.price}
              </Typography>
            </Box>
          ))}
          {displayItems.length > 3 && (
            <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 1 }}>
              + {displayItems.length - 3} more item(s)
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderStyle: "dashed", borderColor: "rgba(0,0,0,0.1)", my: 2 }} />

        {/* Footer */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="caption" fontWeight="600" color="text.secondary" display="block">
              Total Amount
            </Typography>
            <Typography variant="h6" fontWeight="900" color="text.primary" sx={{ lineHeight: 1.2, mt: 0.5 }}>
              {totalAmount}
            </Typography>
          </Box>
          <Button
            variant="contained"
            disableElevation
            endIcon={<ChevronRightIcon />}
            onClick={handleViewDetails}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: "700",
              px: 3,
              bgcolor: "text.primary",
              color: "white",
              "&:hover": { bgcolor: "black", boxShadow: "0 8px 16px rgba(0,0,0,0.2)" },
            }}
          >
            Details
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default OrderCard;
