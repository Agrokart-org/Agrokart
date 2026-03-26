import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Tab,
  Tabs,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  IconButton,
} from "@mui/material";
import {
  LocalShipping as ShippingIcon,
  CheckCircle as DeliveredIcon,
  Cancel as CancelledIcon,
  Schedule as PendingIcon,
  Receipt as ReceiptIcon,
  ArrowBack,
  ChevronRight,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { cancelOrder } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const MotionCard = motion(Card);

const MobileOrdersPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [orders, setOrders] = useState([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setCancelLoading(true);
        const data = await import("../services/api").then((module) =>
          module.getUserOrders(token),
        );

        // Transform backend data to match component structure if needed
        const formattedOrders = data.map((order) => ({
          id: order._id || order.trackingNumber,
          date: order.createdAt,
          status: order.orderStatus,
          total: order.totalAmount,
          items: order.items.map((item) => ({
            name: item.product?.name || "Product",
            quantity: item.quantity,
            price: item.price,
          })),
          // Add estimated delivery if available, or calculate generic date
          expectedDelivery:
            order.estimatedDeliveryTime ||
            new Date(
              new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
        }));

        setOrders(formattedOrders);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders");
        setLoading(false);
        // Fallback to empty list or keep loading false
      } finally {
        setCancelLoading(false);
      }
    };

    if (token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [token]);

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return theme.palette.success.main;
      case "shipped":
        return theme.palette.info.main;
      case "pending":
        return theme.palette.warning.main;
      case "cancelled":
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filterOrdersByStatus = (status) => {
    if (status === "all") return orders;
    return orders.filter((order) => order.status === status);
  };

  const getFilteredOrders = () => {
    switch (tabValue) {
      case 0:
        return orders; // All
      case 1:
        return filterOrdersByStatus("pending"); // Processing
      case 2:
        return filterOrdersByStatus("shipped"); // Shipped
      case 3:
        return filterOrdersByStatus("delivered"); // Delivered
      default:
        return orders;
    }
  };

  return (
    <Box sx={{ bgcolor: "#F9FAFB", minHeight: "100vh", pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          ...theme.glass(0.9),
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" fontWeight="800">
          My Orders
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ bgcolor: "white", borderBottom: "1px solid #f0f0f0" }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minWidth: "auto",
              px: 2.5,
              py: 2,
              borderRadius: 2,
            },
            "& .Mui-selected": {
              color: theme.palette.primary.main,
            },
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: 3,
            },
          }}
        >
          <Tab label="All" />
          <Tab label="Processing" />
          <Tab label="Shipped" />
          <Tab label="Delivered" />
        </Tabs>
      </Box>

      {/* Orders List */}
      <Box sx={{ px: 2, py: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Loading your orders...
            </Typography>
          </Box>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tabValue}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {getFilteredOrders().length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8, opacity: 0.6 }}>
                  <ReceiptIcon
                    sx={{ fontSize: 64, mb: 2, color: "text.secondary" }}
                  />
                  <Typography variant="h6" fontWeight="600">
                    No orders found
                  </Typography>
                </Box>
              ) : (
                getFilteredOrders().map((order, index) => (
                  <MotionCard
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      border: "1px solid #F0F0F0",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                      overflow: "visible",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/order-details/${order.id}`)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2.5,
                              bgcolor: `${getStatusColor(order.status)}15`,
                              color: getStatusColor(order.status),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {order.status === "delivered" ? (
                              <DeliveredIcon />
                            ) : order.status === "shipped" ? (
                              <ShippingIcon />
                            ) : (
                              <PendingIcon />
                            )}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="700">
                              Order #{order.id}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(order.date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Chip
                            label={getStatusLabel(order.status)}
                            size="small"
                            sx={{
                              bgcolor: `${getStatusColor(order.status)}15`,
                              color: getStatusColor(order.status),
                              fontWeight: 700,
                              borderRadius: 1.5,
                              mb: 0.5,
                            }}
                          />
                          <Typography variant="body2" fontWeight="700">
                            ₹{order.total}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {order.items.length} Items • View Details
                        </Typography>
                        <ChevronRight fontSize="small" color="action" />
                      </Box>
                    </CardContent>
                  </MotionCard>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </Box>
    </Box>
  );
};

export default MobileOrdersPage;
