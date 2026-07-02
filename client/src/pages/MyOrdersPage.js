import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { ShoppingCart as OrderIcon } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { getUserOrders } from "../services/api";
import OrderCard from "../components/OrderCard";

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All Orders");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getUserOrders(token);

        if (Array.isArray(response)) {
          setOrders(response);
          // Auto-select 'All Orders'
        } else {
          setError(response.message || "Failed to fetch orders");
          setOrders([]); // Fallback to empty
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to fetch orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "All Orders") return true;
    // Map tab names to API status values
    const s = (order.orderStatus || "").toLowerCase();
    if (filterStatus === "Processing")
      return ["pending", "processing", "confirmed"].includes(s);
    if (filterStatus === "Shipped")
      return ["shipped", "out_for_delivery"].includes(s);
    if (filterStatus === "Delivered") return s === "delivered";
    return true;
  });

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/customer/dashboard")}
        >
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, minHeight: "80vh", bgcolor: "#F9FAFB" }}>
      <Box sx={{ mb: 4, display: "flex", alignItems: "baseline", gap: 2 }}>
        <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: "-1px" }}>
          My Orders
        </Typography>
        <Typography variant="subtitle1" fontWeight="600" color="text.secondary">
          Track & Manage
        </Typography>
      </Box>

      {/* Modern Pill Tabs */}
      <Tabs
        value={filterStatus}
        onChange={(e, val) => setFilterStatus(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 4,
          minHeight: 44,
          "& .MuiTabs-indicator": { display: "none" },
          "& .MuiTab-root": {
            py: 1,
            px: 2.5,
            minHeight: 44,
            fontSize: "0.875rem",
            textTransform: "none",
            fontWeight: "700",
            borderRadius: "12px",
            mr: 1.5,
            transition: "all 0.3s ease",
            border: "1px solid rgba(0,0,0,0.04)",
            bgcolor: "white",
            color: "text.secondary",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            "&.Mui-selected": {
              bgcolor: "black",
              color: "white",
              borderColor: "black",
              boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
              transform: "translateY(-2px)",
            },
            "&:hover:not(.Mui-selected)": {
              bgcolor: "rgba(0,0,0,0.02)",
              transform: "translateY(-1px)",
            },
          },
        }}
      >
        <Tab value="All Orders" label="All Orders" />
        <Tab value="Processing" label="Processing" />
        <Tab value="Shipped" label="Shipped" />
        <Tab value="Delivered" label="Delivered" />
      </Tabs>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 1,
            bgcolor: "background.paper",
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <OrderIcon
            sx={{ fontSize: 64, color: "text.secondary", mb: 2, opacity: 0.5 }}
          />
          <Typography variant="h6" gutterBottom color="text.secondary">
            No orders found
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/products")}
            sx={{ mt: 2, borderRadius: 2 }}
          >
            Start Shopping
          </Button>
        </Paper>
      ) : (
        <LayoutGroup>
          <motion.div layout>
            <AnimatePresence mode="popLayout">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    align="center"
                    sx={{ py: 4 }}
                  >
                    No orders found in this category.
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      )}
    </Container>
  );
};

export default MyOrdersPage;
