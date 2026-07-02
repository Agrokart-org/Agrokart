import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Button,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  AppBar,
  Toolbar,
  useMediaQuery,
  Menu,
  MenuItem,
  Stack,
  Divider,
  useTheme,
  Tabs,
  Tab,
  Badge,
  Snackbar,
  Alert,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Inventory as ProductsIcon,
  ShoppingCart as OrdersIcon,
  Analytics as AnalyticsIcon,
  AttachMoney as MoneyIcon,
  People as CustomersIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  TrendingUp,
  LocalShipping,
  MyLocation as MyLocationIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  getVendorAvailableOrders,
  claimVendorOrder,
  getVendorOrders,
  API_BASE_URL,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import theme from "../theme"; // Using the main theme we just updated
import MobileVendorDashboard from "./MobileVendorDashboard";

const drawerWidth = 280;

// Animated Components
const MotionCard = motion(Card);
const MotionBox = motion(Box);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

const VendorDashboard = () => {
  const { user, logout } = useAuth();
  const socket = useSocket(); // Use socket
  const navigate = useNavigate();
  const themeInstance = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // New State for Orders and Notifications
  const [orderTab, setOrderTab] = useState(0); // 0: Active, 1: New Requests, 2: Past Orders
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Notification Menu State
  const [notifications, setNotifications] = useState([]);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

  // Location Dialog State
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationData, setLocationData] = useState({
    street: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });
  const [updatingLocation, setUpdatingLocation] = useState(false);

  // --- Pickup PIN Verification Logic ---
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  // ------------------------------------

  // Initial Data Fetch
  useEffect(() => {
    console.log("DEBUG: VendorDashboard user object:", user);
    if (user && user.address) {
      console.log("DEBUG: Vendor Address:", user.address);
      console.log(
        "DEBUG: Coordinates check:",
        user.address.coordinates,
        user.address.coordinates?.coordinates,
      );
      // Pre-fill location data if available (partially)
      setLocationData({
        street: user.address.street || "",
        city: user.address.city || "",
        state: user.address.state || "",
        pincode: user.address.pincode || "",
        latitude: user.address.coordinates?.coordinates?.[1] || "",
        longitude: user.address.coordinates?.coordinates?.[0] || "",
      });
    } else {
      console.warn("Vendor has no address set!");
    }
    fetchAvailableOrders();
    fetchMyOrders();

    // Setup 10-second polling for robustness (Fail-safe against missed socket events)
    const pollInterval = setInterval(() => {
      fetchAvailableOrders();
      fetchMyOrders();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [user]); // Add user dependency

  // Socket Listener
  useEffect(() => {
    if (!socket || !user) return;

    const connectToRoom = () => {
      console.log(
        "🔌 Vendor Dashboard: Socket connected, joining vendor rooms...",
      );

      // Join by MongoDB ID
      if (user.id || user._id) {
        const userId = user.id || user._id;
        console.log(`➡️ Joining room: vendor_${userId}`);
        socket.emit("join_vendor_room", userId);
      }

      // Join by Firebase UID (fallback/alternative)
      if (user.firebaseUid) {
        console.log(`➡️ Joining room: vendor_${user.firebaseUid}`);
        socket.emit("join_vendor_room", user.firebaseUid);
      }
    };

    connectToRoom();

    // Listen for new orders matching vendor criteria
    const handleNewOrder = (data) => {
      console.log("🔔 NEW ORDER RECEIVED (Socket):", data);
      setNotification({
        open: true,
        message: "New Order Request Available!",
        severity: "info",
      });

      // Add to persistent notifications list
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: "New Order Request",
          message: `New order from ${data.deliveryAddress?.city || "Customer"}`,
          time: new Date(),
          data: data,
          unread: true,
        },
        ...prev,
      ]);

      fetchAvailableOrders(); // Refresh list
      fetchMyOrders(); // Refresh My Orders to catch auto-assigned confirmed orders
    };

    socket.on("new_order_available", handleNewOrder);

    // Order claimed by THIS vendor (confirmation)
    socket.on("order_claimed_success", (data) => {
      console.log("✅ Order claimed successfully (socket)", data);
      // Move from available to my orders
      setAvailableOrders((prev) => prev.filter((o) => o._id !== data.orderId));
      fetchMyOrders(); // Refresh my orders to get the full details
      setOrderTab(0); // Switch to My Orders tab or let user stay
    });

    // Order no longer available (claimed by someone else or cancelled)
    socket.on("order_no_longer_available", (data) => {
      console.log("⚠️ Order no longer available:", data);
      setAvailableOrders((prev) => prev.filter((o) => o._id !== data.orderId));
    });

    // Order status update (for My Orders)
    socket.on("order_status_updated", (data) => {
      console.log("ℹ️ Order status updated:", data);
      setMyOrders((prev) =>
        prev.map((order) =>
          order._id === data.orderId
            ? { ...order, orderStatus: data.status }
            : order,
        ),
      );
    });

    // Order cancelled
    socket.on("order_cancelled", (data) => {
      console.log("❌ Order cancelled:", data);
      setMyOrders((prev) =>
        prev.map((order) =>
          order._id === data.orderId
            ? { ...order, orderStatus: "cancelled" }
            : order,
        ),
      );
      setAvailableOrders((prev) => prev.filter((o) => o._id !== data.orderId));
    });

    return () => {
      socket.off("new_order_available", handleNewOrder);
      socket.off("order_claimed_success");
      socket.off("order_no_longer_available");
      socket.off("order_status_updated");
      socket.off("order_cancelled");
    };
  }, [socket, user]);

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationItemClick = (notif) => {
    handleNotificationClose();
    setOrderTab(1); // Switch to "New Requests" tab
    // Optionally mark as read logic here
  };

  const fetchAvailableOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        console.log("Fetching available orders...");
        const data = await getVendorAvailableOrders(token);
        console.log("Available orders data:", data);
        setAvailableOrders(data);
      }
    } catch (error) {
      console.error("Error fetching available orders", error);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        console.log("Fetching my orders...");
        const data = await getVendorOrders({}, token);
        console.log("My orders data:", data);
        setMyOrders(data.orders || []);

        if (data.orders) {
          const active = data.orders.filter(
            (o) =>
              !["delivered", "cancelled", "rejected"].includes(o.orderStatus),
          );
          const past = data.orders.filter((o) =>
            ["delivered", "cancelled", "rejected"].includes(o.orderStatus),
          );
          console.log("Filtered Active Orders:", active);
          console.log("Filtered Past Orders:", past);
        }
      }
    } catch (error) {
      console.error("Error fetching my orders", error);
    }
  };

  const handleClaimOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      await claimVendorOrder(orderId, token);
      setNotification({
        open: true,
        message: "Order Claimed Successfully!",
        severity: "success",
      });

      // Refresh lists
      fetchAvailableOrders();
      fetchMyOrders();
      setOrderTab(0); // Switch to "Active" (My Orders) tab
    } catch (error) {
      setNotification({
        open: true,
        message: error.message || "Failed to claim order",
        severity: "error",
      });
    }
  };

  // Handler for accepting notification (claiming order)
  const handleAcceptNotification = async (notif, event) => {
    event.stopPropagation();

    // Safety check for Order ID
    const orderId = notif.data.orderId || notif.data._id || notif.data.id;

    if (orderId) {
      handleClaimOrder(orderId);
    } else {
      console.error("Missing order ID in notification:", notif);
      setNotification({
        open: true,
        message: "Current Notification Invalid - Missing ID",
        severity: "error",
      });
    }

    // Remove from notifications
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    // Close menu if it's the last one
    if (notifications.length <= 1) handleNotificationClose();
  };

  // Handler for declining notification (dismissing)
  const handleDeclineNotification = (notif, event) => {
    event.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    if (notifications.length <= 1) handleNotificationClose();
  };

  if (isMobile) {
    return <MobileVendorDashboard />;
  }

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon /> },
    { text: "Products", icon: <ProductsIcon /> },
    { text: "Orders", icon: <OrdersIcon /> },
    { text: "Analytics", icon: <AnalyticsIcon /> },
    { text: "Settings", icon: <MoreVertIcon /> },
  ];

  // Derived state for Active and Past orders
  const activeOrders = myOrders.filter(
    (o) => !["delivered", "cancelled", "rejected"].includes(o.orderStatus),
  );
  const pastOrders = myOrders.filter((o) =>
    ["delivered", "cancelled", "rejected"].includes(o.orderStatus),
  );

  const handleLocationUpdate = async () => {
    setUpdatingLocation(true);
    try {
      const token = localStorage.getItem("token");
      const updateData = {
        address: {
          street: locationData.street,
          city: locationData.city,
          state: locationData.state,
          pincode: locationData.pincode,
          coordinates: {
            type: "Point",
            coordinates: [
              parseFloat(locationData.longitude),
              parseFloat(locationData.latitude),
            ],
          },
        },
      };

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setNotification({
          open: true,
          message: "Location updated successfully! Refreshing...",
          severity: "success",
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error("Failed to update location");
      }
    } catch (error) {
      console.error("Error updating location", error);
      setNotification({
        open: true,
        message: "Failed to update location",
        severity: "error",
      });
    } finally {
      setUpdatingLocation(false);
      setLocationDialogOpen(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setNotification({
            open: true,
            message: "Location detected!",
            severity: "success",
          });
        },
        (error) => {
          console.error("Error getting location", error);
          setNotification({
            open: true,
            message: "Could not detect location. Please enter manually.",
            severity: "warning",
          });
        },
      );
    } else {
      setNotification({
        open: true,
        message: "Geolocation is not supported by this browser.",
        severity: "error",
      });
    }
  };

  // --- Pickup PIN Verification Logic (Moved to top level) ---
  const handleOpenPinDialog = (orderId) => {
    setSelectedOrderId(orderId);
    setPin("");
    setPinDialogOpen(true);
  };

  const handleVerifyPin = async () => {
    try {
      const token = localStorage.getItem("token");
      // Updated to match Backend: /matches /orders/:orderId/verify-pickup
      const response = await fetch(
        `${API_BASE_URL}/vendor/orders/${selectedOrderId}/verify-pickup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({ pin }),
        },
      );

      const result = await response.json();
      if (response.ok) {
        setNotification({
          open: true,
          message: "Pickup Verified Successfully!",
          severity: "success",
        });
        setPinDialogOpen(false);
        fetchMyOrders(); // Refresh orders
      } else {
        setNotification({
          open: true,
          message: result.message || "Verification failed",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error verifying PIN", error);
      setNotification({
        open: true,
        message: "Server error during verification",
        severity: "error",
      });
    }
  };
  // ------------------------------------

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        // Modern dark gradient background for sidebar
        background: "linear-gradient(180deg, #052e16 0%, #14532d 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: "absolute",
          top: -50,
          left: -50,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: "rgba(74, 222, 128, 0.1)",
          filter: "blur(40px)",
        }}
      />

      <Box
        sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, zIndex: 1 }}
      >
        <MotionBox
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.6 }}
          sx={{
            width: 44,
            height: 44,
            background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "1.5rem",
            color: "#052e16",
            boxShadow: "0 8px 16px rgba(34, 197, 94, 0.3)",
          }}
        >
          V
        </MotionBox>
        <Box>
          <Typography
            variant="h6"
            fontWeight="800"
            sx={{ letterSpacing: "0.5px", lineHeight: 1.2 }}
          >
            Vendor<span style={{ color: "#4ade80" }}>Pro</span>
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontSize: "0.65rem",
            }}
          >
            Dashboard
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />

      <List sx={{ flexGrow: 1, px: 2, zIndex: 1 }}>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={motion.div}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              selected={activeTab === index}
              onClick={() => {
                setActiveTab(index);
                if (isMobile) setMobileOpen(false); // Close drawer on mobile selection
              }}
              sx={{
                borderRadius: "12px",
                py: 1.5,
                mb: 0.5,
                transition: "all 0.3s ease",
                "&.Mui-selected": {
                  background: "linear-gradient(90deg, rgba(74, 222, 128, 0.2) 0%, rgba(74, 222, 128, 0.05) 100%)",
                  borderLeft: "4px solid #4ade80",
                  "&:hover": { background: "linear-gradient(90deg, rgba(74, 222, 128, 0.3) 0%, rgba(74, 222, 128, 0.1) 100%)" },
                  "& .MuiListItemIcon-root": { color: "#4ade80", filter: "drop-shadow(0 2px 8px rgba(74,222,128,0.4))" },
                  "& .MuiTypography-root": { color: "white", fontWeight: 800 },
                },
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.05)",
                  "& .MuiListItemIcon-root": { color: "#fff" },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  minWidth: 40,
                  transition: "color 0.3s",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  color: "rgba(255,255,255,0.8)",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2, zIndex: 1 }}>
        <Card
          sx={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            color: "white",
            borderRadius: 4,
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={1}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: "50%",
                  bgcolor: "rgba(74, 222, 128, 0.2)",
                }}
              >
                <TrendingUp sx={{ color: "#4ade80", fontSize: "1.2rem" }} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.6)" }}
                >
                  This Month
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  ₹45,230
                </Typography>
              </Box>
            </Stack>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              sx={{
                borderColor: "rgba(255,255,255,0.2)",
                color: "#4ade80",
                borderRadius: 2,
                mt: 1,
                "&:hover": {
                  borderColor: "#4ade80",
                  bgcolor: "rgba(74, 222, 128, 0.05)",
                },
              }}
            >
              View Report
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
          backgroundImage:
            "radial-gradient(at 0% 0%, hsla(115,39%,90%,1) 0, transparent 50%), radial-gradient(at 50% 100%, hsla(258,40%,94%,1) 0, transparent 50%)",
        }}
      >
        {/* Top Navbar */}
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            bgcolor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.03)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.5)",
          }}
        >
          <Toolbar sx={{ height: 80 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,
                display: { md: "none" },
                color: "text.primary",
                bgcolor: "rgba(0,0,0,0.05)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.1)" },
              }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" color="text.primary" fontWeight="800">
                Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome back, {user?.name || "Partner"}! 👋
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={{ xs: 1, md: 2 }}
              alignItems="center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    borderRadius: "16px",
                    px: { xs: 2, md: 3 },
                    py: 1,
                    minWidth: { xs: 40, md: "auto" }, // Smaller on mobile
                    background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                    boxShadow: "0 8px 24px rgba(76, 175, 80, 0.3)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: "0 12px 28px rgba(76, 175, 80, 0.4)",
                      transform: "translateY(-2px)",
                    },
                    "& .MuiButton-startIcon": {
                      mr: { xs: 0, md: 1 },
                      ml: { xs: 0, md: -0.5 },
                    },
                    "& .MuiButton-startIcon>*:nth-of-type(1)": { fontSize: 20 },
                    // On extra small screens, hide text
                    "& span.MuiTypography-root": {
                      display: { xs: "none", md: "block" },
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", md: "block" } }}
                  >
                    Add Product
                  </Box>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    fetchAvailableOrders();
                    fetchMyOrders();
                    setNotification({
                      open: true,
                      message: "Refreshing data...",
                      severity: "info",
                    });
                  }}
                  sx={{
                    borderRadius: "12px",
                    minWidth: { xs: 40, md: "auto" },
                    mr: 1,
                    borderColor: "rgba(0,0,0,0.1)",
                    color: "text.secondary",
                    display: { xs: "none", md: "flex" }, // Hide on small screens if too crowded, or 'flex'
                  }}
                >
                  Refresh
                </Button>
              </motion.div>
              {/* Mobile Refresh Icon */}
              <IconButton
                size="large"
                onClick={() => {
                  fetchAvailableOrders();
                  fetchMyOrders();
                  setNotification({
                    open: true,
                    message: "Refreshing data...",
                    severity: "info",
                  });
                }}
                sx={{
                  display: { xs: "flex", md: "none" },
                  bgcolor: "background.paper",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  border: "1px solid #f3f4f6",
                  mr: 1,
                }}
              >
                <DashboardIcon color="action" />
              </IconButton>

              {/* DEBUG: Test Notification Button */}
              <Button
                variant="outlined"
                color="warning"
                size="small"
                sx={{ mr: 1, display: { xs: "none", md: "block" } }}
                onClick={() => {
                  console.log("🔔 TESTING NOTIFICATION MANUALLY");
                  setNotification({
                    open: true,
                    message:
                      "TEST NOTIFICATION: If you see this, UI is working!",
                    severity: "success",
                  });
                  setNotifications((prev) => [
                    {
                      id: Date.now(),
                      title: "Test Notification",
                      message: "This is a test to verify UI works.",
                      time: new Date(),
                      data: {},
                      unread: true,
                    },
                    ...prev,
                  ]);
                }}
              >
                Test Notif
              </Button>

              <IconButton
                size="large"
                onClick={handleNotificationClick}
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  border: "1px solid #f3f4f6",
                }}
              >
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon color="action" />
                </Badge>
              </IconButton>

              {/* Notification Menu */}
              <Menu
                anchorEl={notificationAnchorEl}
                open={Boolean(notificationAnchorEl)}
                onClose={handleNotificationClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    mt: 1.5,
                    width: 320,
                    maxHeight: 400,
                    borderRadius: 3,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    overflow: "auto",
                    "&:before": {
                      content: '""',
                      display: "block",
                      position: "absolute",
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: "background.paper",
                      transform: "translateY(-50%) rotate(45deg)",
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <Box sx={{ p: 2, borderBottom: "1px solid #f0f0f0" }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Notifications
                  </Typography>
                </Box>
                {notifications.length === 0 ? (
                  <MenuItem
                    onClick={handleNotificationClose}
                    sx={{
                      py: 3,
                      justifyContent: "center",
                      color: "text.secondary",
                    }}
                  >
                    No new notifications
                  </MenuItem>
                ) : (
                  notifications.map((notif) => (
                    <MenuItem
                      key={notif.id}
                      onClick={() => handleNotificationItemClick(notif)}
                      sx={{
                        py: 2,
                        px: 2,
                        borderBottom: "1px solid #f5f5f5",
                        display: "block", // Stack content
                        cursor: "default",
                        "&:hover": { bgcolor: "transparent" }, // Disable hover effect on container
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          cursor: "pointer",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                          borderRadius: 2,
                          p: 1,
                        }}
                        onClick={() => handleNotificationItemClick(notif)}
                      >
                        <Box
                          sx={{
                            mr: 2,
                            mt: 0.5,
                            color: theme.palette.primary.main,
                          }}
                        >
                          <NotificationsIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="600">
                            {notif.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {notif.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {notif.time.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Accept / Decline Buttons */}
                      <Stack direction="row" spacing={1} sx={{ pl: 6, mt: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={(e) => handleAcceptNotification(notif, e)}
                          sx={{
                            borderRadius: 4,
                            fontSize: "0.7rem",
                            py: 0.5,
                            boxShadow: "none",
                            minWidth: 70,
                            background: theme.palette.primary.main,
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={(e) => handleDeclineNotification(notif, e)}
                          sx={{
                            borderRadius: 4,
                            fontSize: "0.7rem",
                            py: 0.5,
                            minWidth: 70,
                          }}
                        >
                          Decline
                        </Button>
                      </Stack>
                    </MenuItem>
                  ))
                )}
              </Menu>

              <Box
                onClick={handleProfileMenuOpen}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  cursor: "pointer",
                  p: 0.5,
                  pr: { xs: 0.5, sm: 2 },
                  borderRadius: "30px",
                  bgcolor: "background.paper",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  border: "1px solid #f3f4f6",
                  transition: "0.2s",
                  "&:hover": {
                    bgcolor: "background.white",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    width: 36,
                    height: 36,
                  }}
                >
                  {user?.name?.charAt(0) || "V"}
                </Avatar>
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="700"
                    color="text.primary"
                  >
                    {user?.name || "Vendor"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Verified
                  </Typography>
                </Box>
              </Box>
            </Stack>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 1.5,
                  borderRadius: 3,
                  minWidth: 180,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  overflow: "visible",
                  "&:before": {
                    content: '""',
                    display: "block",
                    position: "absolute",
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) rotate(45deg)",
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              <MenuItem
                onClick={handleProfileMenuClose}
                sx={{ py: 1.5, px: 2.5, fontWeight: 500 }}
              >
                Profile
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                onClick={handleLogout}
                sx={{ py: 1.5, px: 2.5, fontWeight: 500, color: "error.main" }}
              >
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                border: "none",
              },
            }}
          >
            {drawerContent}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                border: "none",
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 4 },
            pb: { xs: 10, md: 4 },
            width: { md: `calc(100% - ${drawerWidth}px)` },
            mt: 10,
          }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Stats Overview */}
            {!user?.address?.coordinates?.coordinates && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Your location is not set! You will not receive nearby order
                requests. Please update your profile with a valid address.
              </Alert>
            )}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              Overview
            </Typography>
            {/* Conditional Rendering based on Active Tab */}
            {/* Conditional Rendering based on Active Tab */}
            {activeTab === 0 && (
              <Grid container spacing={3} sx={{ mb: 5 }}>
                {/* ... Existing Overview Cards ... */}
                {[
                  {
                    label: "Total Revenue",
                    value: "₹45,230",
                    icon: MoneyIcon,
                    color: "#1B5E20",
                    bg: "#dcfce7",
                  },
                  {
                    label: "Active Orders",
                    value: myOrders.length,
                    icon: LocalShipping,
                    color: "#1d4ed8",
                    bg: "#dbeafe",
                  },
                  {
                    label: "Total Products",
                    value: "24",
                    icon: ProductsIcon,
                    color: "#c2410c",
                    bg: "#ffedd5",
                  },
                  {
                    label: "Total Customers",
                    value: "156",
                    icon: CustomersIcon,
                    color: "#7e22ce",
                    bg: "#f3e8ff",
                  },
                ].map((stat, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <MotionCard
                      variants={itemVariants}
                      whileHover={{ y: -8, transition: { duration: 0.3 } }}
                      sx={{
                        height: "100%",
                        border: "1px solid rgba(255,255,255,0.4)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
                        borderRadius: "20px",
                        overflow: "hidden",
                        position: "relative",
                        background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 100%)`,
                        backdropFilter: "blur(20px)",
                        "&:hover": {
                           boxShadow: `0 16px 40px ${stat.color}33`,
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
                        <Box
                          sx={{
                            position: "absolute",
                            right: -20,
                            bottom: -20,
                            opacity: 0.08,
                            transform: "rotate(-15deg)",
                            zIndex: -1,
                            "& > svg": {
                              fontSize: 140,
                              color: stat.color,
                            }
                          }}
                        >
                          <stat.icon />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 3,
                          }}
                        >
                          <Box
                            sx={{
                              p: 1.5,
                              bgcolor: stat.bg,
                              color: stat.color,
                              borderRadius: "16px",
                              display: "flex",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            }}
                          >
                            <stat.icon fontSize="medium" />
                          </Box>
                          <Chip
                            label="+2.5%"
                            size="small"
                            sx={{
                              bgcolor: "#dcfce7",
                              color: "#15803d",
                              fontWeight: "bold",
                              borderRadius: "8px",
                              height: 24,
                            }}
                          />
                        </Box>
                        <Stack spacing={0.5}>
                          <Typography
                            variant="h4"
                            fontWeight="800"
                            sx={{ color: "#1f2937" }}
                          >
                            {stat.value}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight="600"
                          >
                            {stat.label}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </MotionCard>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Products Tab (Index 1) */}
            {activeTab === 1 && (
              <MotionCard
                variants={itemVariants}
                sx={{
                  mt: 3,
                  borderRadius: "24px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
                  border: "1px solid rgba(0,0,0,0.03)",
                  background: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6" fontWeight="700">
                      My Products
                    </Typography>
                    <Chip
                      label={`${myOrders.length || 0} listed`}
                      size="small"
                      sx={{
                        bgcolor: "#dcfce7",
                        color: "#15803d",
                        fontWeight: "bold",
                      }}
                    />
                  </Box>
                  <TableContainer sx={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                    <Table sx={{ minWidth: 600 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Product
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Category
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            align="center"
                            sx={{ py: 6, color: "text.secondary" }}
                          >
                            <Box>
                              <ProductsIcon
                                sx={{ fontSize: 48, color: "#d1d5db", mb: 1 }}
                              />
                              <Typography
                                variant="body1"
                                color="text.secondary"
                              >
                                Your products will appear here
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Add your first product to start selling
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Add Product Button at Bottom */}
                  <Box
                    sx={{
                      mt: 3,
                      pt: 3,
                      borderTop: "1px solid #e5e7eb",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<AddIcon />}
                      onClick={() => navigate("/vendor/add-product")}
                      sx={{
                        bgcolor: "#16a34a",
                        color: "white",
                        px: 5,
                        py: 1.5,
                        borderRadius: 3,
                        fontWeight: 700,
                        fontSize: "1rem",
                        textTransform: "none",
                        boxShadow: "0 4px 16px rgba(22, 163, 74, 0.3)",
                        "&:hover": {
                          bgcolor: "#15803d",
                          boxShadow: "0 6px 20px rgba(22, 163, 74, 0.4)",
                          transform: "translateY(-2px)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      + Add New Product
                    </Button>
                  </Box>
                </CardContent>
              </MotionCard>
            )}

            {/* Orders Tab (Index 2) */}
            {(activeTab === 0 || activeTab === 2) && (
              <MotionCard 
                variants={itemVariants} 
                sx={{ 
                  mt: 3,
                  borderRadius: "24px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
                  border: "1px solid rgba(0,0,0,0.03)",
                  background: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <Box
                  sx={{ borderBottom: 1, borderColor: "divider", px: 3, pt: 2 }}
                >
                  <Tabs value={orderTab} onChange={(e, v) => setOrderTab(v)}>
                    <Tab label={`Active (${activeOrders.length})`} />
                    <Tab
                      label={
                        <Badge
                          badgeContent={availableOrders.length}
                          color="error"
                          sx={{ pr: 2 }}
                        >
                          New Requests
                        </Badge>
                      }
                    />
                    <Tab label={`History (${pastOrders.length})`} />
                  </Tabs>
                </Box>

                {/* Active Orders Table */}
                {orderTab === 0 && (
                  <TableContainer sx={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                    <Table sx={{ minWidth: 600 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Items</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              No active orders (Total: {myOrders.length})
                            </TableCell>
                          </TableRow>
                        ) : (
                          activeOrders.map((row) => (
                            <TableRow key={row._id} hover>
                              <TableCell fontWeight="600">
                                {row.trackingNumber || row._id.slice(-6)}
                              </TableCell>
                              <TableCell>
                                {row.user?.name || "Customer"}
                              </TableCell>
                              <TableCell>{row.items?.length} Items</TableCell>
                              <TableCell fontWeight="700">
                                ₹{row.totalAmount}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={row.orderStatus}
                                  size="small"
                                  color={
                                    row.orderStatus === "delivered"
                                      ? "success"
                                      : "warning"
                                  }
                                />
                              </TableCell>
                              <TableCell align="right">
                                {[
                                  "confirmed",
                                  "preparing",
                                  "ready_for_pickup",
                                ].includes(row.orderStatus) && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="info"
                                    sx={{ mr: 1, fontSize: "0.7rem" }}
                                    onClick={() => handleOpenPinDialog(row._id)}
                                  >
                                    Verify PIN
                                  </Button>
                                )}
                                <Button size="small">Details</Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* New Requests Table */}
                {orderTab === 1 && (
                  <TableContainer sx={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                    <Table sx={{ minWidth: 600 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Location</TableCell>
                          <TableCell>Items</TableCell>
                          <TableCell>Earnings (Est)</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {availableOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Box sx={{ py: 3 }}>
                                <Typography
                                  variant="body1"
                                  color="text.secondary"
                                >
                                  No new requests nearby
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                >
                                  (Orders appear here when customers within 15km
                                  place a request)
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ) : (
                          availableOrders.map((row) => (
                            <TableRow
                              key={row._id}
                              hover
                              sx={{ bgcolor: "#fff8e1" }}
                            >
                              <TableCell fontWeight="600">
                                {row.trackingNumber}
                              </TableCell>
                              <TableCell>
                                {row.deliveryAddress?.city || "Nearby"}
                              </TableCell>
                              <TableCell>
                                {(row.items || [])
                                  .map(
                                    (i) =>
                                      `${i.quantity}x ${i.product?.name || "Item"}`,
                                  )
                                  .join(", ")}
                              </TableCell>
                              <TableCell
                                fontWeight="700"
                                sx={{ color: "green" }}
                              >
                                ₹{row.totalAmount}
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  onClick={() => handleClaimOrder(row._id)}
                                >
                                  Accept Order
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* History (Past Orders) Table */}
                {orderTab === 2 && (
                  <TableContainer sx={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                    <Table sx={{ minWidth: 600 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Items</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pastOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              No past orders
                            </TableCell>
                          </TableRow>
                        ) : (
                          pastOrders.map((row) => (
                            <TableRow key={row._id} hover>
                              <TableCell fontWeight="600">
                                {row.trackingNumber || row._id.slice(-6)}
                              </TableCell>
                              <TableCell>
                                {row.user?.name || "Customer"}
                              </TableCell>
                              <TableCell>{row.items?.length} Items</TableCell>
                              <TableCell fontWeight="700">
                                ₹{row.totalAmount}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={row.orderStatus}
                                  size="small"
                                  color={
                                    row.orderStatus === "delivered"
                                      ? "success"
                                      : "error"
                                  }
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Button size="small">Details</Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </MotionCard>
            )}
          </motion.div>
        </Box>
        {/* Mobile Bottom Navigation */}
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            display: { md: "none" },
            zIndex: 1000,
          }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={activeTab}
            onChange={(event, newValue) => {
              setActiveTab(newValue);
            }}
            sx={{
              bgcolor: "background.paper",
              "& .Mui-selected": { color: theme.palette.primary.main },
            }}
          >
            <BottomNavigationAction label="Overview" icon={<DashboardIcon />} />
            <BottomNavigationAction label="Products" icon={<ProductsIcon />} />
            <BottomNavigationAction label="Orders" icon={<OrdersIcon />} />
            <BottomNavigationAction label="Reports" icon={<AnalyticsIcon />} />
          </BottomNavigation>
        </Paper>
        {/* Location Update Dialog */}
        <Dialog
          open={locationDialogOpen}
          onClose={() => setLocationDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Update Store Location</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<MyLocationIcon />}
                  onClick={getCurrentLocation}
                  sx={{ mb: 2 }}
                >
                  Use Current GPS Location
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Latitude"
                  fullWidth
                  value={locationData.latitude}
                  onChange={(e) =>
                    setLocationData({
                      ...locationData,
                      latitude: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Longitude"
                  fullWidth
                  value={locationData.longitude}
                  onChange={(e) =>
                    setLocationData({
                      ...locationData,
                      longitude: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Street Address"
                  fullWidth
                  value={locationData.street}
                  onChange={(e) =>
                    setLocationData({ ...locationData, street: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="City"
                  fullWidth
                  value={locationData.city}
                  onChange={(e) =>
                    setLocationData({ ...locationData, city: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Pincode"
                  fullWidth
                  value={locationData.pincode}
                  onChange={(e) =>
                    setLocationData({
                      ...locationData,
                      pincode: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLocationDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleLocationUpdate}
              variant="contained"
              disabled={updatingLocation}
              startIcon={
                updatingLocation ? <CircularProgress size={20} /> : <SaveIcon />
              }
            >
              {updatingLocation ? "Saving..." : "Save Location"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* PIN Verification Dialog */}
        <Dialog open={pinDialogOpen} onClose={() => setPinDialogOpen(false)}>
          <DialogTitle>Verify Pickup Partner</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Ask the delivery partner for the 4-digit PIN displayed on their
              dashboard.
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Enter 4-digit PIN"
              type="text"
              fullWidth
              variant="outlined"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputProps={{
                maxLength: 4,
                style: {
                  fontSize: "2rem",
                  textAlign: "center",
                  letterSpacing: "10px",
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPinDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleVerifyPin}
              variant="contained"
              disabled={pin.length !== 4}
            >
              Verify & Handover
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setNotification({ ...notification, open: false })}
            severity={notification.severity}
            sx={{
              width: "100%",
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default VendorDashboard;
