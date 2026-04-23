import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Button,
  Chip,
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Avatar,
  Fab,
  List,
  ListItem,
  ListItemButton,
  DialogContent,
  TextField,
  Snackbar,
  Alert,
  Toolbar,
  Stack,
  AppBar,
  Slide,
  Drawer,
  InputBase,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogActions,
  Badge,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Inventory as ProductsIcon,
  ShoppingCart as OrdersIcon,
  Person as ProfileIcon,
  Add as AddIcon,
  TrendingUp,
  AttachMoney,
  LocalShipping,
  ArrowForward,
  Notifications,
  Settings,
  ExitToApp,
  Menu as MenuIcon,
  Search as SearchIcon,
  Home,
  LightMode,
  DarkMode,
  LocalOffer,
  CheckCircle,
  Receipt,
  Person,
  Dashboard,
  Inventory,
  BarChart as StockIcon,
  AddPhotoAlternate,
  Remove,
  AddCircleOutline,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  getVendorOrders,
  verifyPickup,
  getVendorInventory,
  claimVendorOrder,
} from "../services/api";
import { getProductImage } from "../data/productImages";

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MobileVendorDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  console.log("--- DEBUG AUTH ---");
  console.log("User Context:", user);
  console.log("Token in LocalStorage:", localStorage.getItem("authToken"));
  console.log("--- END DEBUG ---");
  const [value, setValue] = useState(0);

  // Orders State (declared early - used in renderDashboard and effects above)
  const [orderTab, setOrderTab] = useState(0); // 0: Active, 1: History
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch Orders
  const fetchMyOrders = async () => {
    try {
      setLoadingOrders(true);
      const token = localStorage.getItem("authToken");
      if (token) {
        console.log("Fetching vendor orders...");
        const data = await getVendorOrders({}, token);
        console.log("Vendor orders response:", data);

        if (data.orders) {
          console.log(`Fetched ${data.orders.length} orders`);
          data.orders.forEach((o) =>
            console.log(`Order ${o._id}: ${o.orderStatus}`),
          );
        } else {
          console.warn("No orders array in response:", data);
        }

        setMyOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setNotification({
        open: true,
        message: error.message || "Failed to fetch orders",
        severity: "error",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleClaimOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("authToken");
      await claimVendorOrder(orderId, token);
      setNotification({
        open: true,
        message: "Order Claimed Successfully!",
        severity: "success",
      });
      fetchMyOrders();
      setOrderTab(0);
    } catch (error) {
      setNotification({
        open: true,
        message: error.message || "Failed to claim order",
        severity: "error",
      });
    }
  };

  const [mode, setMode] = useState(localStorage.getItem("theme") || "light");
  const isDark = mode === "dark";
  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("theme", newMode);
    // Dispatch custom event to let App.js know
    window.dispatchEvent(new Event("themeChanged"));
  };

  // Socket & Notification State
  const socket = useSocket();
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [orderAlert, setOrderAlert] = useState(null); // Holds data for the new order modal

  const handleIgnoreOrder = () => {
    setOrderAlert(null);
  };

  const stats = [
    {
      label: "Revenue",
      value: "₹45k",
      icon: AttachMoney,
      color: "#1B5E20",
      bg: "#E8F5E9",
    },
    {
      label: "Orders",
      value: "12",
      icon: OrdersIcon,
      color: "#1565C0",
      bg: "#E3F2FD",
    },
    {
      label: "Products",
      value: "24",
      icon: ProductsIcon,
      color: "#E65100",
      bg: "#FFF3E0",
    },
    {
      label: "Visits",
      value: "156",
      icon: TrendingUp,
      color: "#6A1B9A",
      bg: "#F3E5F5",
    },
  ];

  const recentOrders = [
    {
      id: "#101",
      customer: "Ram Kumar",
      amount: "₹450",
      status: "Pending",
      color: "warning",
    },
    {
      id: "#102",
      customer: "Priya S",
      amount: "₹1200",
      status: "Delivered",
      color: "success",
    },
    {
      id: "#103",
      customer: "Rahul D",
      amount: "₹375",
      status: "Processing",
      color: "info",
    },
  ];

  // Mobile UI State
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notificationsList, setNotificationsList] = useState([]); // Real notifications

  // Setup Polling as fallback
  useEffect(() => {
    // Initial fetch
    fetchMyOrders();

    // Setup 10-second polling for robustness
    const pollInterval = setInterval(() => {
        fetchMyOrders();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, []);

  // Socket Effect
  React.useEffect(() => {
    if (!socket || !user) return;

    // Join room
    socket.emit("join_vendor_room", user.id || user._id);

    // Listen for orders
    socket.on("new_order_available", (data) => {
      console.log("📱 Mobile: New order!", data);
      setOrderAlert(data);
      fetchMyOrders();
      // Add to notifications list
      setNotificationsList((prev) => [
        {
          id: Date.now(),
          message: `New Order #${data.orderId?.slice(-4) || "..."} Received!`,
          time: new Date(),
          read: false,
        },
        ...prev,
      ]);
    });

    // Listen for order status updates
    socket.on("order_status_updated", (data) => {
      fetchMyOrders();
      setNotificationsList((prev) => [
        {
          id: Date.now(),
          message: `Order #${data.orderId?.slice(-4) || "..."} updated to ${data.status}`,
          time: new Date(),
          read: false,
        },
        ...prev,
      ]);
    });

    return () => {
      socket.off("new_order_available");
      socket.off("order_status_updated");
    };
  }, [socket, user]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNotifClick = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        bgcolor: "background.paper",
        color: "text.primary",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Avatar
          src={user?.avatar}
          sx={{ width: 50, height: 50, bgcolor: theme.palette.primary.main }}
        >
          {user?.name?.[0]}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Vendor Account
          </Typography>
        </Box>
      </Box>
      <List sx={{ pt: 0 }}>
        <ListItemButton
          onClick={() => { setValue(0); setMobileOpen(false); }}
          selected={value === 0}
          sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
        >
          <ListItemIcon>
            <DashboardIcon color={value === 0 ? "primary" : "inherit"} />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton
          onClick={() => { setValue(1); setMobileOpen(false); }}
          selected={value === 1}
          sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
        >
          <ListItemIcon>
            <ProductsIcon color={value === 1 ? "primary" : "inherit"} />
          </ListItemIcon>
          <ListItemText primary="Products" />
        </ListItemButton>
        <ListItemButton
          onClick={() => { setValue(4); setMobileOpen(false); }}
          selected={value === 4}
          sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
        >
          <ListItemIcon>
            <StockIcon color={value === 4 ? "primary" : "inherit"} />
          </ListItemIcon>
          <ListItemText primary="Daily Stock" />
        </ListItemButton>
        <ListItemButton
          onClick={() => { setValue(2); setMobileOpen(false); }}
          selected={value === 2}
          sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
        >
          <ListItemIcon>
            <OrdersIcon color={value === 2 ? "primary" : "inherit"} />
          </ListItemIcon>
          <ListItemText primary="Orders" />
        </ListItemButton>
        <ListItemButton
          onClick={() => { setValue(3); setMobileOpen(false); }}
          selected={value === 3}
          sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
        >
          <ListItemIcon>
            <ProfileIcon color={value === 3 ? "primary" : "inherit"} />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItemButton>
        <Divider sx={{ my: 1 }} />
        <ListItemButton onClick={logout} sx={{ borderRadius: 2, mx: 1 }}>
          <ListItemIcon>
            <ExitToApp color="error" />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: "error.main" }} />
        </ListItemButton>
      </List>
    </Box>
  );

  const renderDashboard = () => (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header with Sidebar Toggle & Search */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <IconButton onClick={handleDrawerToggle} edge="start">
          <MenuIcon />
        </IconButton>
        <Box
          sx={{
            flex: 1,
            bgcolor: "grey.100",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 0.5,
          }}
        >
          <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
          <InputBase
            placeholder="Search..."
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>
        <IconButton
          onClick={handleNotifClick}
          sx={{ bgcolor: "rgba(0,0,0,0.05)" }}
        >
          <Badge
            badgeContent={notificationsList.filter((n) => !n.read).length}
            color="error"
          >
            <Notifications />
          </Badge>
        </IconButton>
        {/* Notification Menu */}
        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleNotifClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              maxHeight: 300,
              width: 300,
            },
          }}
        >
          {notificationsList.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2">No new notifications</Typography>
            </MenuItem>
          ) : (
            notificationsList.map((notif) => (
              <MenuItem key={notif.id} onClick={handleNotifClose}>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {notif.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notif.time.toLocaleTimeString()}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>
      </Box>

      {/* Welcome Section */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight="800"
          sx={{ color: theme.palette.text.primary }}
        >
          Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Good Morning, {user?.name?.split(" ")[0] || "Vendor"}!
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat, i) => (
          <Grid item xs={6} key={i}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              sx={{
                bgcolor: stat.bg,
                color: stat.color,
                borderRadius: 4,
                boxShadow: "none",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <stat.icon />
                  {i === 0 && (
                    <Chip
                      label="+15%"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.6rem",
                        bgcolor: "white",
                        color: stat.color,
                        fontWeight: "bold",
                      }}
                    />
                  )}
                </Box>
                <Typography variant="h5" fontWeight="800">
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight="600"
                  sx={{ opacity: 0.8 }}
                >
                  {stat.label}
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 1,
          scrollbarWidth: "none",
        }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            borderRadius: 3,
            textTransform: "none",
            whiteSpace: "nowrap",
            minWidth: "auto",
            px: 3,
          }}
          onClick={() => navigate("/vendor/add-product")}
        >
          Add Product
        </Button>
        <Button
          variant="outlined"
          startIcon={<LocalShipping />}
          sx={{
            borderRadius: 3,
            textTransform: "none",
            whiteSpace: "nowrap",
            minWidth: "auto",
            px: 3,
          }}
        >
          Manage Delivery
        </Button>
      </Box>

      {/* Recent Orders */}
      <Box sx={{ mt: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Recent Actions
          </Typography>
          <Button size="small" endIcon={<ArrowForward />}>
            View All
          </Button>
        </Box>
        {/* Use real myOrders for recent actions */}
        {myOrders.slice(0, 5).map((order, i) => (
          <MotionCard
            key={order._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            sx={{
              mb: 2,
              borderRadius: 3,
              border: "1px solid #f0f0f0",
              boxShadow: "none",
            }}
            onClick={() => {
              setValue(2);
            }} // Go to Orders tab on click
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.grey[100],
                      color: theme.palette.text.secondary,
                      width: 40,
                      height: 40,
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                    }}
                  >
                    {order.user?.name?.[0] || "C"}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="700">
                      {order.user?.name || "Customer"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="subtitle2" fontWeight="700">
                    ₹{order.totalAmount}
                  </Typography>
                  <Chip
                    label={order.orderStatus}
                    size="small"
                    color={
                      order.orderStatus === "delivered"
                        ? "success"
                        : order.orderStatus === "cancelled"
                          ? "error"
                          : "warning"
                    }
                    sx={{ height: 20, fontSize: "0.65rem", fontWeight: "bold" }}
                  />
                </Box>
              </Box>
            </CardContent>
          </MotionCard>
        ))}
      </Box>
    </Box>
  );

  // ── Inventory State ──
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // ── Daily Stock State ──
  const [dailyStockEdits, setDailyStockEdits] = useState({}); // { inventoryId: qty }
  const [savingStock, setSavingStock] = useState(false);
  const [todayDelivered, setTodayDelivered] = useState({}); // { productName: qty }

  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const token = localStorage.getItem("authToken");
      const data = await getVendorInventory({}, token);
      const items = data.inventory || data || [];
      setInventoryItems(items);
      // Seed daily stock edits from current stock
      const edits = {};
      const todayDate = new Date().toDateString();
      items.forEach((item) => {
        const isToday = item.dailyStockDate === todayDate;
        const currentStock = item.availableStock ?? item.stock ?? 0;
        edits[item._id] = isToday ? (item.dailyAllocatedStock ?? currentStock) : currentStock;
      });
      setDailyStockEdits(edits);
    } catch (err) {
      console.error("Fetch inventory error:", err);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Calculate how many units of each product were delivered today (from orders)
  const calcTodayDelivered = (orders) => {
    const today = new Date().toDateString();
    const result = {};
    orders.forEach((order) => {
      if (
        order.orderStatus === "delivered" &&
        new Date(order.updatedAt || order.createdAt).toDateString() === today
      ) {
        (order.items || []).forEach((item) => {
          const name = item.product?.name || item.productName || "";
          if (name) result[name] = (result[name] || 0) + (item.quantity || 0);
        });
      }
    });
    setTodayDelivered(result);
  };

  const handleDailyStockChange = (itemId, delta) => {
    setDailyStockEdits((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }));
  };

  const saveDailyStock = async () => {
    setSavingStock(true);
    try {
      const token = localStorage.getItem("authToken");
      const API_BASE = process.env.REACT_APP_API_URL
        ? `${process.env.REACT_APP_API_URL}/api`
        : `http://${window.location.hostname}:5000/api`;
      const todayDate = new Date().toDateString();
      await Promise.all(
        Object.entries(dailyStockEdits).map(([id, qty]) =>
          fetch(`${API_BASE}/vendor/inventory/${id}/daily-stock`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-auth-token": token },
            body: JSON.stringify({ dailyAllocatedStock: qty, dailyStockDate: todayDate }),
          })
        )
      );
      setNotification({ open: true, message: "Daily stock saved!", severity: "success" });
      fetchInventory();
    } catch (err) {
      setNotification({ open: true, message: "Failed to save stock", severity: "error" });
    } finally {
      setSavingStock(false);
    }
  };

  useEffect(() => {
    if (value === 1 || value === 4) fetchInventory();
  }, [value]);

  useEffect(() => {
    calcTodayDelivered(myOrders);
  }, [myOrders]);

  const getStockColor = (stock) => {
    if (stock <= 0) return "#D32F2F";
    if (stock <= 20) return "#F57C00";
    return "#388E3C";
  };

  const getStockLabel = (stock) => {
    if (stock <= 0) return "Out of Stock";
    if (stock <= 20) return "Low Stock";
    return "In Stock";
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      urea: "🧪",
      dap: "💎",
      npk: "⚗️",
      organic: "🌿",
      other: "📦",
      "Bio-Fertilizers": "🦠",
      Micronutrients: "🔬",
      "NPK Fertilizers": "⚗️",
      Organic: "🌿",
      Pesticides: "🛡️",
      Seeds: "🌱",
      Tools: "🛠️",
      Urea: "💧",
    };
    return icons[cat] || "📦";
  };

  const renderProducts = () => {
    const totalStock = inventoryItems.reduce(
      (s, i) => s + (i.availableStock ?? i.stock ?? 0),
      0,
    );
    const lowCount = inventoryItems.filter(
      (i) =>
        (i.availableStock ?? i.stock ?? 0) <= 20 &&
        (i.availableStock ?? i.stock ?? 0) > 0,
    ).length;
    const outCount = inventoryItems.filter(
      (i) => (i.availableStock ?? i.stock ?? 0) <= 0,
    ).length;

    const catColors = {
      urea: {
        bg: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
        text: "#1565C0",
        accent: "#1E88E5",
      },
      dap: {
        bg: "linear-gradient(135deg, #EDE7F6 0%, #D1C4E9 100%)",
        text: "#6A1B9A",
        accent: "#8E24AA",
      },
      npk: {
        bg: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
        text: "#2E7D32",
        accent: "#43A047",
      },
      organic: {
        bg: "linear-gradient(135deg, #F1F8E9 0%, #DCEDC8 100%)",
        text: "#33691E",
        accent: "#558B2F",
      },
      other: {
        bg: "linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)",
        text: "#E65100",
        accent: "#FB8C00",
      },
      "Bio-Fertilizers": {
        bg: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
        text: "#2E7D32",
        accent: "#43A047",
      },
      Micronutrients: {
        bg: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
        text: "#7B1FA2",
        accent: "#8E24AA",
      },
      "NPK Fertilizers": {
        bg: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
        text: "#2E7D32",
        accent: "#43A047",
      },
      Organic: {
        bg: "linear-gradient(135deg, #F1F8E9 0%, #DCEDC8 100%)",
        text: "#33691E",
        accent: "#558B2F",
      },
      Pesticides: {
        bg: "linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)",
        text: "#C62828",
        accent: "#E53935",
      },
      Seeds: {
        bg: "linear-gradient(135deg, #F1F8E9 0%, #DCEDC8 100%)",
        text: "#558B2F",
        accent: "#689F38",
      },
      Tools: {
        bg: "linear-gradient(135deg, #ECEFF1 0%, #CFD8DC 100%)",
        text: "#455A64",
        accent: "#546E7A",
      },
      Urea: {
        bg: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
        text: "#1565C0",
        accent: "#1E88E5",
      },
    };

    return (
      <Box sx={{ p: 2, pb: 10 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight="800"
              sx={{ color: "text.primary", letterSpacing: -0.5 }}
            >
              My Inventory
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={500}
            >
              {inventoryItems.length} products tracked
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={fetchInventory}
            startIcon={<span style={{ fontSize: 14 }}>↻</span>}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.78rem",
              borderColor: "primary.main",
              color: "primary.main",
              py: 0.6,
              px: 1.5,
            }}
          >
            Refresh
          </Button>
        </Box>

        {/* Summary Stats Row */}
        {inventoryItems.length > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              mb: 2.5,
              overflowX: "auto",
              pb: 0.5,
              scrollbarWidth: "none",
            }}
          >
            {[
              {
                label: "Total Products",
                value: inventoryItems.length,
                bg: "#E3F2FD",
                color: "#1565C0",
              },
              {
                label: "Total Units",
                value: totalStock,
                bg: "#E8F5E9",
                color: "#2E7D32",
              },
              {
                label: "Low Stock",
                value: lowCount,
                bg: "#FFF3E0",
                color: "#E65100",
              },
              {
                label: "Out of Stock",
                value: outCount,
                bg: "#FFEBEE",
                color: "#C62828",
              },
            ].map((stat, i) => (
              <Box
                key={i}
                sx={{
                  minWidth: 90,
                  flexShrink: 0,
                  bgcolor: stat.bg,
                  borderRadius: 2.5,
                  p: 1.5,
                  textAlign: "center",
                }}
              >
                <Typography
                  fontWeight="900"
                  sx={{ color: stat.color, fontSize: "1.3rem", lineHeight: 1 }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: stat.color,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    opacity: 0.8,
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {loadingInventory ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
              mt: 8,
            }}
          >
            <CircularProgress size={36} thickness={4} />
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              Loading inventory...
            </Typography>
          </Box>
        ) : inventoryItems.length === 0 ? (
          /* Empty State */
          <Box
            sx={{
              textAlign: "center",
              mt: 6,
              p: 4,
              borderRadius: 4,
              border: "2px dashed",
              borderColor: "divider",
              bgcolor: "grey.50",
            }}
          >
            <Typography sx={{ fontSize: 56, mb: 1.5 }}>📦</Typography>
            <Typography
              variant="h6"
              fontWeight="800"
              color="text.primary"
              mb={0.5}
            >
              No Products Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Add your first product to start selling
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/vendor/add-product")}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 700,
                px: 4,
                py: 1.2,
                background: "linear-gradient(135deg, #2E7D32, #43A047)",
                boxShadow: "0 4px 16px rgba(46,125,50,0.3)",
              }}
            >
              Add First Product
            </Button>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {inventoryItems.map((item, idx) => {
              const stock = item.availableStock ?? item.stock ?? 0;
              const productName = item.product?.name || "Unknown Product";
              const color = getStockColor(stock);
              const label = getStockLabel(stock);
              const max = item.maxStockLevel || Math.max(stock * 1.5, 50);
              const pct = Math.min(100, (stock / max) * 100);
              const cat = item.product?.category || "other";
              const catStyle = catColors[cat] || catColors.other;

              return (
                <Grid item xs={6} key={item._id || idx}>
                  <MotionCard
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.04, duration: 0.25 }}
                    sx={{
                      borderRadius: 2.5,
                      overflow: "hidden",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                      border: "1px solid rgba(0,0,0,0.06)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "box-shadow 0.2s, transform 0.2s",
                      "&:hover": {
                        boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    {/* Visual Header — Real Product Image */}
                    <Box
                      sx={{
                        bgcolor: "#fff",
                        height: 100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        flexShrink: 0,
                        borderBottom: `3px solid ${catStyle.accent || catStyle.text}22`,
                      }}
                    >
                      <Box
                        component="img"
                        src={getProductImage(
                          item.product?.name,
                          cat,
                          item.product?.image || item.product?.images?.[0],
                        )}
                        alt={item.product?.name || cat}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          p: 1,
                          bgcolor: "#fff",
                        }}
                      />
                      {/* Fallback emoji (hidden by default, shown when image fails) */}
                      <Box
                        sx={{
                          display: "none",
                          width: "100%",
                          height: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: catStyle.bg,
                          fontSize: 36,
                        }}
                      >
                        {getCategoryIcon(cat)}
                      </Box>

                      {/* Stock status badge */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          bgcolor: color,
                          color: "#fff",
                          px: 0.8,
                          py: 0.2,
                          borderRadius: 1,
                          fontSize: "0.55rem",
                          fontWeight: 800,
                          lineHeight: 1.4,
                          textTransform: "uppercase",
                        }}
                      >
                        {stock <= 0 ? "OUT" : stock <= 20 ? "LOW" : "OK"}
                      </Box>

                      {/* Category top-left */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          bgcolor: "rgba(255,255,255,0.9)",
                          border: `1px solid ${catStyle.text}33`,
                          px: 0.7,
                          py: 0.2,
                          borderRadius: 0.8,
                          fontSize: "0.55rem",
                          fontWeight: 700,
                          color: catStyle.text,
                          lineHeight: 1.4,
                          textTransform: "uppercase",
                          letterSpacing: 0.3,
                        }}
                      >
                        {cat}
                      </Box>
                    </Box>

                    {/* Card Body */}
                    <Box
                      sx={{
                        p: 1.2,
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Product Name */}
                      <Typography
                        variant="body2"
                        fontWeight="700"
                        sx={{
                          lineHeight: 1.2,
                          mb: 0.6,
                          fontSize: "0.8rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.product?.name || "Product"}
                      </Typography>

                      {/* Price */}
                      <Typography
                        fontWeight="900"
                        sx={{
                          color: catStyle.text,
                          fontSize: "1rem",
                          lineHeight: 1,
                          mb: 0.2,
                        }}
                      >
                        ₹{item.sellingPrice || item.product?.price}
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{
                            color: "text.disabled",
                            fontWeight: 500,
                            ml: 0.4,
                            fontSize: "0.65rem",
                          }}
                        >
                          /{item.product?.unit || "unit"}
                        </Typography>
                      </Typography>

                      {/* Stock Row */}
                      <Box sx={{ mt: 1, mb: 0.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.4,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.disabled",
                              fontWeight: 600,
                              fontSize: "0.6rem",
                            }}
                          >
                            STOCK
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color, fontWeight: 800, fontSize: "0.75rem" }}
                          >
                            {stock} units
                          </Typography>
                        </Box>
                        {/* Progress bar */}
                        <Box
                          sx={{
                            height: 5,
                            bgcolor: "grey.100",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              height: "100%",
                              width: `${pct}%`,
                              background:
                                stock <= 0
                                  ? "#D32F2F"
                                  : stock <= 20
                                    ? "linear-gradient(90deg, #F57C00, #FFA726)"
                                    : "linear-gradient(90deg, #388E3C, #66BB6A)",
                              borderRadius: 3,
                              transition:
                                "width 0.7s cubic-bezier(0.4,0,0.2,1)",
                            }}
                          />
                        </Box>
                      </Box>

                      {(item.reservedStock || 0) > 0 && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "warning.main",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                          }}
                        >
                          ⏳ {item.reservedStock} reserved
                        </Typography>
                      )}
                    </Box>
                  </MotionCard>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    );
  };

  // ── Daily Stock Render ──────────────────────────────────────────────────────
  const renderDailyStock = () => (
    <Box sx={{ p: 2, pb: 10 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="800">Daily Stock</Typography>
          <Typography variant="caption" color="text.secondary">
            Set how many units you have ready today
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={saveDailyStock}
          disabled={savingStock}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2 }}
        >
          {savingStock ? "Saving..." : "Save All"}
        </Button>
      </Box>

      {loadingInventory ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress size={36} />
        </Box>
      ) : inventoryItems.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 6, opacity: 0.6 }}>
          <Typography sx={{ fontSize: 48 }}>📦</Typography>
          <Typography variant="h6" color="text.secondary">No products in inventory</Typography>
        </Box>
      ) : (
        inventoryItems.map((item, idx) => {
          const productName = item.product?.name || "Unknown Product";
          const cat = item.product?.category || "other";
          const currentStock = item.availableStock ?? item.stock ?? 0;
          const dailyAlloc = dailyStockEdits[item._id] ?? currentStock;
          const deliveredToday = todayDelivered[productName] || 0;
          const remaining = Math.max(0, dailyAlloc - deliveredToday);
          const pct = dailyAlloc > 0 ? Math.min(100, (remaining / dailyAlloc) * 100) : 0;
          const stockColor = remaining <= 0 ? "#D32F2F" : remaining <= 10 ? "#F57C00" : "#388E3C";

          return (
            <Card key={item._id || idx} sx={{ mb: 2, borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <CardContent sx={{ p: 2 }}>
                {/* Product name + category */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <Box
                    component="img"
                    src={getProductImage(productName, cat, item.product?.image || item.product?.images?.[0])}
                    alt={productName}
                    onError={(e) => { e.target.style.display = "none"; }}
                    sx={{ width: 44, height: 44, objectFit: "contain", borderRadius: 1.5, border: "1px solid #eee" }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight="700" noWrap>{productName}</Typography>
                    <Chip label={cat} size="small" sx={{ height: 18, fontSize: "0.6rem", mt: 0.3 }} />
                  </Box>
                </Box>

                {/* Progress bar */}
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Remaining Today
                    </Typography>
                    <Typography variant="caption" fontWeight="800" sx={{ color: stockColor }}>
                      {remaining} / {dailyAlloc} units
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "grey.100",
                      "& .MuiLinearProgress-bar": {
                        background: remaining <= 0
                          ? "#D32F2F"
                          : remaining <= 10
                          ? "linear-gradient(90deg, #F57C00, #FFA726)"
                          : "linear-gradient(90deg, #388E3C, #66BB6A)",
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>

                {/* Delivered today info */}
                {deliveredToday > 0 && (
                  <Box sx={{ bgcolor: "#E8F5E9", borderRadius: 1.5, px: 1.5, py: 0.8, mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: "#2E7D32", fontWeight: 700 }}>
                      ✅ {deliveredToday} units delivered today
                    </Typography>
                  </Box>
                )}

                {/* Daily allocation controls */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Today's Allocation:
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleDailyStockChange(item._id, -5)}
                      sx={{ bgcolor: "#FFEBEE", color: "#D32F2F", width: 32, height: 32 }}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography variant="h6" fontWeight="900" sx={{ minWidth: 40, textAlign: "center" }}>
                      {dailyAlloc}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleDailyStockChange(item._id, 5)}
                      sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", width: 32, height: 32 }}
                    >
                      <AddCircleOutline fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Total stock reference */}
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
                  Total inventory stock: {currentStock} units
                </Typography>
              </CardContent>
            </Card>
          );
        })
      )}
    </Box>
  );


  useEffect(() => {
    if (value === 2) {
      fetchMyOrders();
    }
  }, [value]);

  useEffect(() => {
    if (socket) {
      socket.on("order_status_updated", (data) => {
        fetchMyOrders();
        fetchInventory(); // Refresh inventory when order status changes
      });
      socket.on("order_claimed_success", () => {
        fetchMyOrders();
        fetchInventory(); // Refresh inventory when order is claimed
      });
    }
    return () => {
      if (socket) {
        socket.off("order_status_updated");
        socket.off("order_claimed_success");
      }
    };
  }, [socket]);

  const activeOrders = myOrders.filter(
    (o) => !["delivered", "cancelled", "rejected"].includes(o.orderStatus),
  );
  console.log(
    "All Orders Status:",
    myOrders.map((o) => ({ id: o._id, status: o.orderStatus })),
  );
  console.log("Active Orders:", activeOrders);

  const historyOrders = myOrders.filter((o) =>
    ["delivered", "cancelled", "rejected"].includes(o.orderStatus),
  );

  // --- New Pickup Verification UI Flow ---
  const [pinVerifyOpen, setPinVerifyOpen] = useState(false);
  const [pickupPin, setPickupPin] = useState("");
  const [orderToVerify, setOrderToVerify] = useState(null);
  const [verifiedOrder, setVerifiedOrder] = useState(null); // The order details to show after verification
  const [detailsOpen, setDetailsOpen] = useState(false); // To show items to hand over

  const handleOpenVerifyDialog = (order) => {
    setVerifiedOrder(null); // Clear previous
    setOrderToVerify(order);
    setPickupPin("");
    setPinVerifyOpen(true);
  };

  const submitVerifyPin = async () => {
    if (!pickupPin || pickupPin.length !== 4) {
      setNotification({
        open: true,
        message: "Please enter a valid 4-digit PIN",
        severity: "warning",
      });
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const data = await verifyPickup(orderToVerify._id, pickupPin, token);

      setNotification({
        open: true,
        message: "Verified! Hand over these items:",
        severity: "success",
      });
      setVerifiedOrder(data.order); // Contains items
      setPinVerifyOpen(false);
      setDetailsOpen(true);
      fetchMyOrders(); // Refresh order status
      fetchInventory(); // Refresh inventory to reflect stock changes
    } catch (err) {
      console.error(err);
      setNotification({
        open: true,
        message: err.message || "Verification failed",
        severity: "error",
      });
    }
  };

  const renderOrders = () => (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h5" fontWeight="800" sx={{ mb: 2 }}>
        My Orders
      </Typography>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          border: "1px solid #e0e0e0",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex" }}>
          <Box
            onClick={() => setOrderTab(0)}
            sx={{
              flex: 1,
              p: 1.5,
              textAlign: "center",
              bgcolor: orderTab === 0 ? "primary.main" : "background.paper",
              color: orderTab === 0 ? "white" : "text.secondary",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "all 0.3s",
            }}
          >
            Active ({activeOrders.length})
          </Box>
          <Box
            onClick={() => setOrderTab(1)}
            sx={{
              flex: 1,
              p: 1.5,
              textAlign: "center",
              bgcolor: orderTab === 1 ? "primary.main" : "background.paper",
              color: orderTab === 1 ? "white" : "text.secondary",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "all 0.3s",
              borderLeft: "1px solid #e0e0e0",
            }}
          >
            History
          </Box>
        </Box>
      </Paper>

      {loadingOrders ? (
        <Typography textAlign="center" py={4}>
          Loading orders...
        </Typography>
      ) : (
        <>
          {orderTab === 0 &&
            (activeOrders.length === 0 ? (
              <Box textAlign="center" py={5} sx={{ opacity: 0.6 }}>
                <LocalShipping
                  sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  No Active Orders
                </Typography>
                <Typography variant="body2">
                  New orders will appear here
                </Typography>
              </Box>
            ) : (
              activeOrders.map((order, i) => (
                <MotionCard
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  sx={{
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Chip
                        label={order.orderStatus.toUpperCase()}
                        size="small"
                        color={
                          order.orderStatus === "delivered"
                            ? "success"
                            : "warning"
                        }
                        sx={{ fontWeight: "bold", fontSize: "0.65rem" }}
                      />
                      <Typography
                        variant="subtitle2"
                        fontWeight="800"
                        color="primary"
                      >
                        ₹{order.totalAmount}
                      </Typography>
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                      {order.user?.name || "Customer"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      ID: #{order._id.slice(-6).toUpperCase()}
                    </Typography>

                    <Box
                      sx={{
                        bgcolor: "grey.50",
                        p: 1.5,
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        mb={0.5}
                      >
                        ITEMS
                      </Typography>
                      {order.items?.map((item, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {item.product?.images?.[0] && (
                              <Box
                                component="img"
                                src={item.product.images[0]}
                                alt={item.product?.name}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            )}
                            <Typography variant="body2" fontWeight="500">
                              {item.quantity}x{" "}
                              {item.product?.name || "Unknown Product"}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color="primary"
                          >
                            ₹{item.price}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, mt: 1, mb: 1 }}>
                      {!["picked_up", "out_for_delivery", "delivered", "pending", "finding_vendor", "cancelled", "rejected"].includes(
                        order.orderStatus,
                      ) && (
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={() => handleOpenVerifyDialog(order)}
                            sx={{ borderRadius: 2, py: 1 }}
                          >
                            Verify Pickup
                          </Button>
                        )}
                    </Box>
                    <Button fullWidth variant="outlined" size="small">
                      View Details
                    </Button>
                  </CardContent>
                </MotionCard>
              ))
            ))}

          {orderTab === 1 &&
            (historyOrders.length === 0 ? (
              <Typography textAlign="center" py={5} color="text.secondary">
                No past orders
              </Typography>
            ) : (
              historyOrders.map((order, i) => (
                <Card
                  key={order._id}
                  sx={{ mb: 2, borderRadius: 3, opacity: 0.8 }}
                >
                  <CardContent>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="subtitle2">
                        #{order._id.slice(-6).toUpperCase()}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold">
                        ₹{order.totalAmount}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={order.orderStatus}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))
            ))}
        </>
      )}
    </Box>
  );

  const renderProfile = () => (
    <Box sx={{ p: 2, pb: 10 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 4,
          mt: 2,
        }}
      >
        <Avatar
          src={user?.avatar}
          sx={{
            width: 80,
            height: 80,
            mb: 2,
            border: `3px solid ${theme.palette.primary.main}`,
          }}
        />
        <Typography variant="h5" fontWeight="bold">
          {user?.name}
        </Typography>
        <Chip
          label="Verified Vendor"
          color="success"
          size="small"
          sx={{ mt: 1 }}
        />
      </Box>

      <List
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid #f0f0f0",
          overflow: "hidden",
        }}
      >
        <ListItem button divider>
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
        <ListItem button divider>
          <ListItemIcon>
            <Notifications />
          </ListItemIcon>
          <ListItemText primary="Notifications" />
        </ListItem>
        <ListItem button onClick={logout} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <ExitToApp color="error" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  // --- END Pickup Verification ---

  return (
    <Box sx={{ pb: 7, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Sidebar Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 280 },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Top Bar Navigation */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: "background.paper", borderBottom: "1px solid #f0f0f0" }}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={handleDrawerToggle} edge="start" sx={{ mr: 0.5 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              Agrokart
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={toggleTheme} sx={{ color: "text.secondary" }}>
              {mode === "dark" ? <LightMode /> : <DarkMode />}
            </IconButton>
            <IconButton onClick={handleNotifClick} sx={{ color: "text.secondary", ml: 1 }}>
              <Badge badgeContent={notificationsList.filter((n) => !n.read).length} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            {/* Notification Menu */}
            <Menu
              anchorEl={notifAnchorEl}
              open={Boolean(notifAnchorEl)}
              onClose={handleNotifClose}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: "visible",
                  filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                  mt: 1.5,
                  maxHeight: 300,
                  width: 300,
                },
              }}
            >
              {notificationsList.length === 0 ? (
                <MenuItem disabled>
                  <Typography variant="body2">No new notifications</Typography>
                </MenuItem>
              ) : (
                notificationsList.map((notif) => (
                  <MenuItem key={notif.id} onClick={() => {
                    // Mark as read
                    setNotificationsList((prev) =>
                      prev.map((n) => n.id === notif.id ? { ...n, read: true } : n)
                    );
                    handleNotifClose();
                  }}>
                    <Box>
                      <Typography variant="body2" fontWeight={notif.read ? "normal" : "bold"}>
                        {notif.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notif.time.toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ p: 0 }}>
        {value === 0 && renderDashboard()}
        {value === 1 && renderProducts()}
        {value === 2 && renderOrders()}
        {value === 3 && renderProfile()}
        {value === 4 && renderDailyStock()}
      </Box>

      {/* New Order Alert Modal (Now just Informational) */}
      <Dialog
        open={Boolean(orderAlert)}
        onClose={() => setOrderAlert(null)}
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: 4,
            width: "90%",
            maxWidth: 400,
            overflow: "visible",
          },
        }}
      >
        <DialogContent sx={{ p: 4, textAlign: "center" }}>
          <MotionBox
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "#E3F2FD",
              color: "#1976D2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto -40px",
              transform: "translateY(-60px)",
              border: "4px solid white",
              boxShadow: "0 8px 24px rgba(25,118,210,0.2)",
            }}
          >
            <LocalOffer sx={{ fontSize: 40 }} />
          </MotionBox>

          <Typography
            variant="h5"
            fontWeight="900"
            sx={{ mt: 3, mb: 1, color: "#1976D2" }}
          >
            New Order Assigned!
          </Typography>

          <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 2, mb: 3 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
            >
              ORDER DETALS
            </Typography>
            <Typography
              variant="h4"
              fontWeight="900"
              sx={{ my: 1, color: "#2E7D32" }}
            >
              ₹{orderAlert?.amount || orderAlert?.totalAmount || "---"}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              ID: #
              {orderAlert?.trackingNumber ||
                orderAlert?.orderId?.slice(-6).toUpperCase() ||
                "---"}
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => {
              setOrderAlert(null);
              setValue(2); // Go to orders tab
            }}
            sx={{
              borderRadius: 3,
              py: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1.1rem",
              mb: 1.5,
            }}
          >
            View Active Orders
          </Button>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog
        open={pinVerifyOpen}
        onClose={() => setPinVerifyOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, width: "90%", maxWidth: 400 } }}
      >
        <DialogContent sx={{ p: 4, textAlign: "center" }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              bgcolor: "#E3F2FD",
              color: "#1976D2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <CheckCircle sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Verify Delivery Partner
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ask the delivery partner for their 4-digit pickup PIN for Order #
            {orderToVerify?._id.slice(-6).toUpperCase()}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            placeholder="Enter 4-digit PIN"
            value={pickupPin}
            onChange={(e) =>
              setPickupPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            inputProps={{
              style: {
                textAlign: "center",
                fontSize: "1.5rem",
                letterSpacing: "0.5em",
                fontWeight: "bold",
              },
            }}
            sx={{ mb: 3 }}
          />
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setPinVerifyOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              disabled={pickupPin.length !== 4}
              onClick={submitVerifyPin}
              sx={{ borderRadius: 2 }}
            >
              Verify
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Handover Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, width: "90%", maxWidth: 400 } }}
      >
        <DialogContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              color: "success.main",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <CheckCircle /> Pickup Verified
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please hand over the following items to the delivery partner:
          </Typography>
          <Box sx={{ mt: 2, bgcolor: "grey.50", p: 2, borderRadius: 2 }}>
            {verifiedOrder?.items?.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                  pb: 1,
                  borderBottom:
                    idx < verifiedOrder?.items?.length - 1
                      ? "1px dashed #ccc"
                      : "none",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {item.product?.images?.[0] && (
                    <Box
                      component="img"
                      src={item.product.images[0]}
                      alt={item.product?.name}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  <Typography variant="subtitle2" fontWeight="bold">
                    {item.product?.name || "Unknown Product"}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  x{item.quantity}
                </Typography>
              </Box>
            ))}
          </Box>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setDetailsOpen(false)}
            sx={{ mt: 3, borderRadius: 2 }}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>

      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100 }}
        elevation={10}
      >
        <BottomNavigation
          showLabels
          value={value > 3 ? false : value}
          onChange={(event, newValue) => setValue(newValue)}
          sx={{
            height: 70,
            bgcolor: "background.paper",
            "& .Mui-selected": { color: theme.palette.primary.main },
          }}
        >
          <BottomNavigationAction label="Dashboard" icon={<Dashboard />} />
          <BottomNavigationAction label="Products" icon={<Inventory />} />
          <BottomNavigationAction label="Orders" icon={<Receipt />} />
          <BottomNavigationAction label="Profile" icon={<Person />} />
        </BottomNavigation>
      </Paper>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={notification.severity}
          sx={{ width: "100%", borderRadius: 2, boxShadow: 3 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MobileVendorDashboard;
