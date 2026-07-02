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
  Switch,
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
  LocationOn,
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
  AccountBalanceWallet,
  AddPhotoAlternate,
  Remove,
  AddCircleOutline,
  Schedule,
  Info,
  AccountBalance,
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
  respondToVendorOrder,
  getVendorBankAccount,
  linkVendorBankAccount,
  getVendorDashboard,
  safeFetch,
  API_BASE_URL,
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

  // Real Dashboard Data State
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoadingDashboard(true);
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const response = await safeFetch(`${API_BASE_URL}/vendor/dashboard`, {
        headers: { "x-auth-token": token },
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Wallet State
  const [bankDetails, setBankDetails] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({ accountNumber: "", ifscCode: "", accountHolderName: "", bankName: "" });
  const [walletStats, setWalletStats] = useState({ earnings: 0, pending: 0 });

  // Address Update State
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
    lat: user?.location?.coordinates?.[1] || "",
    lon: user?.location?.coordinates?.[0] || ""
  });
  const [addressUpdating, setAddressUpdating] = useState(false);

  // Settings & Notifications State
  const [businessSettingsOpen, setBusinessSettingsOpen] = useState(false);
  const [notificationsSettingsOpen, setNotificationsSettingsOpen] = useState(false);
  
  const [vendorSettings, setVendorSettings] = useState({
    acceptingOrders: user?.vendorProfile?.settings?.acceptingOrders ?? true,
    autoAcceptOrders: user?.vendorProfile?.settings?.autoAcceptOrders ?? false,
    cashOnDelivery: user?.vendorProfile?.settings?.cashOnDelivery ?? true,
  });
  const [vendorNotifications, setVendorNotifications] = useState({
    push: user?.vendorProfile?.notifications?.push ?? true,
    sms: user?.vendorProfile?.notifications?.sms ?? false,
    lowStock: user?.vendorProfile?.notifications?.lowStock ?? true,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const data = await getVendorBankAccount(token);
      if (data.isLinked && data.bankDetails) {
        setBankDetails(data.bankDetails);
      }
    } catch (e) {
      console.error("Wallet error:", e);
    }
  };

  const handleLinkBank = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await linkVendorBankAccount(bankForm, token);
      setBankDetails(res.bankDetails);
      setShowBankForm(false);
      setNotification({ open: true, message: "Bank account linked successfully", severity: "success" });
    } catch (e) {
      setNotification({ open: true, message: e.message, severity: "error" });
    }
  };

  useEffect(() => {
    if (value === 4) fetchWalletData(); // Load wallet data when tab opens
  }, [value]);


  // Orders State (declared early - used in renderDashboard and effects above)
  const [orderTab, setOrderTab] = useState(0); // 0: Active, 1: History
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // ── Inventory State (declared early for stats) ──
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // ── Daily Stock State (declared early) ──
  const [dailyStockEdits, setDailyStockEdits] = useState({}); // { inventoryId: qty }
  const [savingStock, setSavingStock] = useState(false);

  // Fetch Orders
  const fetchMyOrders = async (silent = false) => {
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
      if (!silent) {
        setNotification({
          open: true,
          message: error.message?.includes("Failed to fetch")
            ? "Unable to connect to server. Please check your internet connection."
            : (error.message || "Failed to fetch orders"),
          severity: "error",
        });
      }
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
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [respondingToOrder, setRespondingToOrder] = useState(false);

  const handleIgnoreOrder = () => {
    setOrderAlert(null);
  };

  const handleAcceptOrder = async () => {
    if (!orderAlert) return;
    setRespondingToOrder(true);
    try {
      const token = localStorage.getItem("authToken");
      const orderId = orderAlert._id || orderAlert.orderId;
      
      if (orderAlert.status === "finding_vendor" || orderAlert.orderStatus === "finding_vendor") {
        await claimVendorOrder(orderId, token);
      } else {
        await respondToVendorOrder(orderId, { action: "accept" }, token);
      }
      
      setNotification({
        open: true,
        message: "Order Accepted! Delivery partner will be assigned.",
        severity: "success",
      });
      setOrderAlert(null);
      fetchMyOrders();
    } catch (error) {
      setNotification({
        open: true,
        message: error.message || "Failed to accept order",
        severity: "error",
      });
    } finally {
      setRespondingToOrder(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!orderAlert) return;
    setRespondingToOrder(true);
    try {
      const token = localStorage.getItem("authToken");
      const orderId = orderAlert._id || orderAlert.orderId;
      await respondToVendorOrder(orderId, { action: "reject", reason: rejectReason || "Vendor rejected the order" }, token);
      setNotification({
        open: true,
        message: "Order Rejected.",
        severity: "warning",
      });
      setOrderAlert(null);
      setRejectDialogOpen(false);
      setRejectReason("");
      fetchMyOrders();
    } catch (error) {
      setNotification({
        open: true,
        message: error.message || "Failed to reject order",
        severity: "error",
      });
    } finally {
      setRespondingToOrder(false);
    }
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
      value: myOrders.length.toString(),
      icon: OrdersIcon,
      color: "#1565C0",
      bg: "#E3F2FD",
    },
    {
      label: "Products",
      value: inventoryItems.length.toString(),
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

  // Mobile UI State
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notificationsList, setNotificationsList] = useState([]); // Real notifications

  const [updatingLocation, setUpdatingLocation] = useState(false);

  const handleUpdateManualAddress = async () => {
    setAddressUpdating(true);
    try {
      const token = localStorage.getItem("authToken");
      let coords = null;
      if (
        addressForm.lon !== "" && addressForm.lat !== "" &&
        addressForm.lon != null && addressForm.lat != null
      ) {
        const parsedLon = parseFloat(addressForm.lon);
        const parsedLat = parseFloat(addressForm.lat);
        if (!isNaN(parsedLon) && !isNaN(parsedLat)) {
          coords = [parsedLon, parsedLat];
        }
      }
        
      const payload = {
        address: {
          street: addressForm.street,
          city: addressForm.city,
          state: addressForm.state,
          pincode: addressForm.pincode,
          ...(coords && { coordinates: coords })
        }
      };

      const res = await safeFetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNotification({ open: true, message: "Address updated successfully!", severity: "success" });
        setAddressDialogOpen(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setNotification({ open: true, message: errorData.message || "Failed to update address", severity: "error" });
      }
    } catch (err) {
      console.error(err);
      setNotification({ open: true, message: "Error updating address", severity: "error" });
    } finally {
      setAddressUpdating(false);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await safeFetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-auth-token": token },
        body: JSON.stringify({ vendorProfile: { settings: vendorSettings } })
      });
      if (res.ok) {
        setNotification({ open: true, message: "Settings saved!", severity: "success" });
        setBusinessSettingsOpen(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setNotification({ open: true, message: err.message || "Failed to save settings", severity: "error" });
      }
    } catch (err) {
      setNotification({ open: true, message: "Network error saving settings", severity: "error" });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSettingsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await safeFetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-auth-token": token },
        body: JSON.stringify({ vendorProfile: { notifications: vendorNotifications } })
      });
      if (res.ok) {
        setNotification({ open: true, message: "Preferences saved!", severity: "success" });
        setNotificationsSettingsOpen(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setNotification({ open: true, message: err.message || "Failed to save preferences", severity: "error" });
      }
    } catch (err) {
      setNotification({ open: true, message: "Network error saving preferences", severity: "error" });
    } finally {
      setSettingsSaving(false);
    }
  };

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
              setNotification({ open: true, message: "Location updated successfully!", severity: "success" });
            } else {
              setNotification({ open: true, message: "Failed to update location on server.", severity: "error" });
            }
          } catch (e) {
            setNotification({ open: true, message: "Network error updating location.", severity: "error" });
          } finally {
            setUpdatingLocation(false);
          }
        },
        (error) => {
          console.error("GPS Error", error);
          setNotification({ open: true, message: "GPS access denied or unavailable.", severity: "error" });
          setUpdatingLocation(false);
        }
      );
    } else {
      setNotification({ open: true, message: "Geolocation not supported by browser.", severity: "error" });
    }
  };

  // Setup Polling as fallback
  const initialFetchDone = React.useRef(false);
  useEffect(() => {
    // Initial fetch
    fetchMyOrders().finally(() => { initialFetchDone.current = true; });
    fetchInventory();
    fetchDashboardData();

    // Setup 30-second polling for robustness (reduced from 10s to avoid flooding)
    const pollInterval = setInterval(() => {
        fetchMyOrders(true); // silent=true for poll fetches
        fetchDashboardData();
    }, 30000);

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
          onClick={() => { setValue(5); setMobileOpen(false); }}
          selected={value === 5}
          sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
        >
          <ListItemIcon>
            <StockIcon color={value === 5 ? "primary" : "inherit"} />
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
        
        <ListItemButton
          onClick={() => { setValue(4); setMobileOpen(false); }}
          selected={value === 4}
          sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
        >
          <ListItemIcon>
            <AccountBalanceWallet color={value === 4 ? "primary" : "inherit"} />
          </ListItemIcon>
          <ListItemText primary="Wallet" />
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

  
  const renderWallet = () => (
    <Box sx={{ pb: 12, bgcolor: "#F3F4F6", minHeight: "100vh" }}>
      {/* Minimalist Professional Header */}
      <Box sx={{ 
        px: 3, 
        pt: 4, 
        pb: 8, 
        bgcolor: "#111827", 
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        position: "relative"
      }}>
        <Box sx={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="overline" sx={{ color: "#9CA3AF", fontWeight: 600, letterSpacing: 1.5, display: "block", mb: 0.5 }}>
              AVAILABLE BALANCE
            </Typography>
            <Typography variant="h3" sx={{ color: "#F9FAFB", fontWeight: 700, display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "1.75rem", marginRight: "4px", color: "#10B981", fontWeight: 500 }}>₹</span>
              {walletStats.earnings.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2, border: "1px solid rgba(255,255,255,0.1)" }}>
            <AccountBalanceWallet sx={{ color: "#10B981", fontSize: 24 }} />
          </Box>
        </Box>
      </Box>

      {/* Floating Stats Card - Sharper Edges */}
      <MotionBox 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{ px: 2, mt: -4, position: "relative", zIndex: 2 }}
      >
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
          border: "1px solid #E5E7EB",
          bgcolor: "#ffffff"
        }}>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <Box sx={{ display: "flex", p: 2.5, alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Schedule sx={{ color: "#D97706", fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    Pending Settlement
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", mt: -0.5 }}>
                    ₹{walletStats.pending.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ bgcolor: "#F9FAFB", px: 2.5, py: 1.5 }}>
              <Typography variant="caption" sx={{ color: "#4B5563", display: "flex", alignItems: "center", gap: 0.5 }}>
                <Info sx={{ fontSize: 16 }} /> Will be transferred in the next settlement cycle.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Bank Details Section */}
      <Box sx={{ px: 2, mt: 4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#374151", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Withdrawal Method
        </Typography>

        <MotionBox 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {bankDetails ? (
            <Card sx={{ 
              borderRadius: 2, 
              border: "1px solid #E5E7EB",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              background: "linear-gradient(120deg, #1E3A8A 0%, #111827 100%)",
              color: "#fff",
              position: "relative",
              overflow: "hidden"
            }}>
              {/* Subtle tech pattern overlay */}
              <Box sx={{ 
                position: "absolute", top: 0, right: 0, bottom: 0, left: 0, 
                opacity: 0.05, 
                backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", 
                backgroundSize: "20px 20px" 
              }} />
              
              <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1.5, lineHeight: 1 }}>
                      PRIMARY BANK
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                      {bankDetails.bankName}
                    </Typography>
                  </Box>
                  <Chip 
                    label="Verified" 
                    size="small" 
                    icon={<CheckCircle sx={{ color: "#10B981 !important" }} />} 
                    sx={{ bgcolor: "rgba(16,185,129,0.1)", color: "#10B981", fontWeight: 600, border: "1px solid rgba(16,185,129,0.2)" }} 
                  />
                </Box>
                
                <Typography variant="h5" sx={{ fontWeight: 500, letterSpacing: 3, mb: 3, fontFamily: "'Roboto Mono', monospace" }}>
                  •••• •••• {bankDetails.accountNumber.slice(-4)}
                </Typography>
                
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: 1, display: "block", textTransform: "uppercase" }}>Card Holder</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, textTransform: "uppercase" }}>{bankDetails.accountHolderName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: 1, display: "block", textTransform: "uppercase" }}>IFSC</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{bankDetails.ifscCode}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ borderRadius: 2, border: "1px dashed #D1D5DB", bgcolor: "#ffffff", boxShadow: "none" }}>
              <CardContent sx={{ p: 3 }}>
                {!showBankForm ? (
                  <Box sx={{ py: 2, textAlign: "center" }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                      <AccountBalance sx={{ color: "#2563EB", fontSize: 24 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight="600" color="#111827" gutterBottom>
                      No Bank Account Linked
                    </Typography>
                    <Typography variant="body2" color="#6B7280" sx={{ mb: 3, px: 1 }}>
                      Add your bank details to automatically receive your sales earnings directly to your account.
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => setShowBankForm(true)}
                      disableElevation
                      sx={{ 
                        borderRadius: 1.5, 
                        bgcolor: "#111827", 
                        color: "#fff",
                        px: 3, 
                        py: 1.2,
                        fontWeight: 600,
                        textTransform: "none",
                        "&:hover": { bgcolor: "#374151" }
                      }}
                    >
                      Add Bank Account
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "left" }}>
                    <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1, color: "#111827" }}>
                      <AddCircleOutline sx={{ color: "#4F46E5", fontSize: 20 }} /> Enter Bank Details
                    </Typography>
                    <Stack spacing={2}>
                      <TextField 
                        variant="outlined"
                        size="small"
                        label="Account Number" 
                        fullWidth 
                        value={bankForm.accountNumber} 
                        onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})}
                        InputProps={{ sx: { borderRadius: 1.5 } }}
                      />
                      <TextField 
                        variant="outlined"
                        size="small"
                        label="IFSC Code" 
                        fullWidth 
                        value={bankForm.ifscCode} 
                        onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})}
                        InputProps={{ sx: { borderRadius: 1.5 } }}
                      />
                      <TextField 
                        variant="outlined"
                        size="small"
                        label="Account Holder Name" 
                        fullWidth 
                        value={bankForm.accountHolderName} 
                        onChange={e => setBankForm({...bankForm, accountHolderName: e.target.value})}
                        InputProps={{ sx: { borderRadius: 1.5 } }}
                      />
                      <TextField 
                        variant="outlined"
                        size="small"
                        label="Bank Name (e.g. HDFC, SBI)" 
                        fullWidth 
                        value={bankForm.bankName} 
                        onChange={e => setBankForm({...bankForm, bankName: e.target.value})}
                        InputProps={{ sx: { borderRadius: 1.5 } }}
                      />
                      <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          onClick={() => setShowBankForm(false)} 
                          sx={{ borderRadius: 1.5, py: 1, fontWeight: 600, textTransform: "none", borderColor: "#D1D5DB", color: "#4B5563", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="contained" 
                          fullWidth 
                          disableElevation
                          onClick={handleLinkBank} 
                          sx={{ borderRadius: 1.5, py: 1, fontWeight: 600, textTransform: "none", bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" } }}
                        >
                          Save Details
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </MotionBox>
      </Box>
    </Box>
  );

  const renderDashboard = () => {
    const realStats = dashboardData?.stats;
    const recentOrdersReal = dashboardData?.recentOrders || myOrders.slice(0, 5);
    const lowStock = dashboardData?.lowStockProducts || [];

    const statCards = [
      {
        label: "Total Revenue",
        value: realStats ? `₹${(realStats.totalEarnings || 0).toLocaleString("en-IN")}` : "—",
        subLabel: "All time earnings",
        icon: AttachMoney,
        color: "#1B5E20",
        gradient: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
      },
      {
        label: "Active Orders",
        value: realStats ? String(myOrders.filter(o => !["delivered","cancelled"].includes(o.orderStatus)).length) : "—",
        subLabel: "Orders in progress",
        icon: OrdersIcon,
        color: "#1565C0",
        gradient: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
      },
      {
        label: "Products Listed",
        value: realStats ? String(realStats.totalProducts || inventoryItems.length) : "—",
        subLabel: "In your inventory",
        icon: ProductsIcon,
        color: "#E65100",
        gradient: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
      },
      {
        label: "Pending Payout",
        value: realStats ? `₹${(realStats.pendingEarnings || 0).toLocaleString("en-IN")}` : "—",
        subLabel: "Awaiting settlement",
        icon: AccountBalanceWallet,
        color: "#6A1B9A",
        gradient: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
      },
    ];

    const getStatusColor = (status) => {
      switch(status?.toLowerCase()) {
        case "delivered": return { bg: "#E8F5E9", text: "#1B5E20", label: "Delivered" };
        case "cancelled": return { bg: "#FFEBEE", text: "#B71C1C", label: "Cancelled" };
        case "out_for_delivery": return { bg: "#E3F2FD", text: "#0D47A1", label: "Out for Delivery" };
        case "processing": return { bg: "#FFF8E1", text: "#E65100", label: "Processing" };
        case "confirmed": return { bg: "#E0F7FA", text: "#006064", label: "Confirmed" };
        default: return { bg: "#FFF8E1", text: "#E65100", label: status || "Pending" };
      }
    };

    return (
      <Box sx={{ p: 2, pb: 12 }}>
        {/* Header Section */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)",
            borderRadius: "24px",
            p: 3,
            mb: 3,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box sx={{ position: "absolute", top: -30, right: -30, opacity: 0.08 }}>
            <DashboardIcon sx={{ fontSize: 160, color: "white" }} />
          </Box>
          <Typography variant="h5" fontWeight="800" color="white">
            Welcome back! 👋
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mb: 2 }}>
            {user?.name || "Vendor"} · {dashboardData?.vendor?.businessName || user?.vendorProfile?.businessName || "Your Store"}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Chip
              label={dashboardData?.vendor?.verificationStatus === "approved" ? "✓ Verified" : "Pending Verification"}
              size="small"
              sx={{
                bgcolor: dashboardData?.vendor?.verificationStatus === "approved" ? "rgba(255,255,255,0.25)" : "rgba(255,200,0,0.3)",
                color: "white",
                fontWeight: 700,
                backdropFilter: "blur(10px)",
              }}
            />
            {realStats?.lowStockCount > 0 && (
              <Chip
                label={`⚠ ${realStats.lowStockCount} Low Stock`}
                size="small"
                sx={{ bgcolor: "rgba(255,100,0,0.3)", color: "white", fontWeight: 700 }}
              />
            )}
          </Stack>
        </Box>

        {/* Stats Grid */}
        <Typography variant="subtitle2" fontWeight="700" color="text.secondary" sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: 1 }}>
          Performance Overview
        </Typography>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {statCards.map((stat, i) => (
            <Grid item xs={6} key={i}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                sx={{
                  borderRadius: "20px",
                  background: stat.gradient,
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "default",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: `0 8px 24px ${stat.color}22` },
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    right: -12,
                    bottom: -12,
                    opacity: 0.12,
                    "& > svg": { fontSize: 90, color: stat.color },
                  }}
                >
                  <stat.icon />
                </Box>
                <CardContent sx={{ p: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      bgcolor: `${stat.color}22`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.5,
                    }}
                  >
                    <stat.icon sx={{ fontSize: 18, color: stat.color }} />
                  </Box>
                  {loadingDashboard ? (
                    <Typography variant="h5" fontWeight="800" sx={{ color: stat.color }}>...</Typography>
                  ) : (
                    <Typography variant="h5" fontWeight="800" sx={{ color: "#1a1a1a" }}>
                      {stat.value}
                    </Typography>
                  )}
                  <Typography variant="caption" fontWeight="600" sx={{ color: stat.color, display: "block" }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem" }}>
                    {stat.subLabel}
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Typography variant="subtitle2" fontWeight="700" color="text.secondary" sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: 1 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/vendor/add-product")}
            sx={{
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              background: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
              boxShadow: "0 4px 16px rgba(76,175,80,0.35)",
              "&:hover": { boxShadow: "0 6px 20px rgba(76,175,80,0.45)", transform: "translateY(-1px)" },
            }}
          >
            Add Product
          </Button>
          <Button
            variant="outlined"
            startIcon={<OrdersIcon />}
            onClick={() => setValue(2)}
            sx={{
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              borderColor: "#1565C0",
              color: "#1565C0",
            }}
          >
            View Orders
          </Button>
          <Button
            variant="outlined"
            startIcon={<StockIcon />}
            onClick={() => setValue(1)}
            sx={{
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              borderColor: "#E65100",
              color: "#E65100",
            }}
          >
            Manage Stock
          </Button>
        </Box>

        {/* Low Stock Alerts */}
        {lowStock.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight="700" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                ⚠ Low Stock Alerts
              </Typography>
            </Box>
            {lowStock.map((item, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  mb: 1,
                  borderRadius: "12px",
                  bgcolor: "#FFF8E1",
                  border: "1px solid #FFE082",
                }}
              >
                <Typography variant="body2" fontWeight="600" color="#E65100">
                  {item.product?.name || "Product"}
                </Typography>
                <Chip
                  label="Low Stock"
                  size="small"
                  sx={{ bgcolor: "#FF8F00", color: "white", fontWeight: 700, fontSize: "0.6rem" }}
                />
              </Box>
            ))}
          </Box>
        )}

        {/* Recent Orders */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="700" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
              Recent Orders
            </Typography>
            <Button size="small" endIcon={<ArrowForward />} onClick={() => setValue(2)}
              sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}
            >
              View All
            </Button>
          </Box>

          {loadingOrders ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} color="success" />
            </Box>
          ) : recentOrdersReal.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 5,
                borderRadius: "20px",
                bgcolor: "#F9FAFB",
                border: "2px dashed #E5E7EB",
              }}
            >
              <OrdersIcon sx={{ fontSize: 48, color: "#D1D5DB", mb: 1 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                No orders yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Your recent orders will appear here
              </Typography>
            </Box>
          ) : (
            recentOrdersReal.slice(0, 5).map((order, i) => {
              const statusStyle = getStatusColor(order.orderStatus);
              return (
                <MotionCard
                  key={order._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  onClick={() => setValue(2)}
                  sx={{
                    mb: 1.5,
                    borderRadius: "16px",
                    border: "1px solid #F3F4F6",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": { transform: "translateX(4px)", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: "#E8F5E9",
                            color: "#2E7D32",
                            fontWeight: 800,
                            fontSize: "1rem",
                          }}
                        >
                          {(order.user?.name?.[0] || "C").toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="700" sx={{ color: "#111827" }}>
                            {order.user?.name || "Customer"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{order._id?.slice(-6)?.toUpperCase()} · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="subtitle2" fontWeight="800" sx={{ color: "#111827" }}>
                          ₹{order.totalAmount?.toLocaleString("en-IN") || 0}
                        </Typography>
                        <Chip
                          label={statusStyle.label}
                          size="small"
                          sx={{
                            bgcolor: statusStyle.bg,
                            color: statusStyle.text,
                            fontWeight: 700,
                            fontSize: "0.6rem",
                            height: 20,
                            mt: 0.5,
                          }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </MotionCard>
              );
            })
          )}
        </Box>
      </Box>
    );
  };

  // ── Inventory State ──
  // Moved to top of component to fix ReferenceError
  
  // ── Daily Stock State ──
  // Moved to top of component

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
    if (value === 1 || value === 5) fetchInventory();
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
      (i) => (i.availableStock ?? i.stock ?? 0) <= 20 && (i.availableStock ?? i.stock ?? 0) > 0,
    ).length;
    const outCount = inventoryItems.filter(
      (i) => (i.availableStock ?? i.stock ?? 0) <= 0,
    ).length;
    const inStockCount = inventoryItems.length - lowCount - outCount;

    const catColors = {
      urea: { bg: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)", text: "#1565C0", accent: "#1E88E5" },
      dap: { bg: "linear-gradient(135deg, #EDE7F6 0%, #D1C4E9 100%)", text: "#6A1B9A", accent: "#8E24AA" },
      npk: { bg: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)", text: "#2E7D32", accent: "#43A047" },
      organic: { bg: "linear-gradient(135deg, #F1F8E9 0%, #DCEDC8 100%)", text: "#33691E", accent: "#558B2F" },
      other: { bg: "linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)", text: "#E65100", accent: "#FB8C00" },
      "Bio-Fertilizers": { bg: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)", text: "#2E7D32", accent: "#43A047" },
      Micronutrients: { bg: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)", text: "#7B1FA2", accent: "#8E24AA" },
      "NPK Fertilizers": { bg: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)", text: "#2E7D32", accent: "#43A047" },
      Organic: { bg: "linear-gradient(135deg, #F1F8E9 0%, #DCEDC8 100%)", text: "#33691E", accent: "#558B2F" },
      Pesticides: { bg: "linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)", text: "#C62828", accent: "#E53935" },
      Seeds: { bg: "linear-gradient(135deg, #F1F8E9 0%, #DCEDC8 100%)", text: "#558B2F", accent: "#689F38" },
      Tools: { bg: "linear-gradient(135deg, #ECEFF1 0%, #CFD8DC 100%)", text: "#455A64", accent: "#546E7A" },
      Urea: { bg: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)", text: "#1565C0", accent: "#1E88E5" },
    };

    return (
      <Box sx={{ p: 2, pb: 12 }}>
        {/* Hero Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #E65100 0%, #F57C00 50%, #FF8F00 100%)",
            borderRadius: "24px",
            p: 3,
            mb: 3,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box sx={{ position: "absolute", top: -20, right: -20, opacity: 0.08 }}>
            <ProductsIcon sx={{ fontSize: 160, color: "white" }} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography variant="h5" fontWeight="800" color="white">
                My Inventory
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5 }}>
                {inventoryItems.length} products · {totalStock} total units
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate("/vendor/add-product")}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 700,
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                boxShadow: "none",
              }}
            >
              Add New
            </Button>
          </Box>

          {/* Summary Mini Pills */}
          {inventoryItems.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, mt: 2.5, flexWrap: "wrap" }}>
              {[
                { label: `${inStockCount} In Stock`, bg: "rgba(76,175,80,0.3)", border: "rgba(76,175,80,0.5)" },
                { label: `${lowCount} Low Stock`, bg: "rgba(255,152,0,0.3)", border: "rgba(255,152,0,0.5)" },
                { label: `${outCount} Out of Stock`, bg: "rgba(244,67,54,0.3)", border: "rgba(244,67,54,0.5)" },
              ].map((pill, i) => (
                <Chip
                  key={i}
                  label={pill.label}
                  size="small"
                  sx={{
                    bgcolor: pill.bg,
                    border: `1px solid ${pill.border}`,
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Toolbar Row */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="700" color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
            All Products
          </Typography>
          <Button
            size="small"
            onClick={fetchInventory}
            disabled={loadingInventory}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.75rem",
              color: "#E65100",
              border: "1px solid rgba(230,81,0,0.3)",
              px: 2,
            }}
          >
            {loadingInventory ? "Refreshing..." : "↻ Refresh"}
          </Button>
        </Box>

        {loadingInventory ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, mt: 8 }}>
            <CircularProgress size={36} thickness={4} sx={{ color: "#E65100" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Loading inventory...
            </Typography>
          </Box>
        ) : inventoryItems.length === 0 ? (
          /* Empty State */
          <Box
            sx={{
              textAlign: "center",
              mt: 4,
              p: 4,
              borderRadius: "24px",
              border: "2px dashed #E0E0E0",
              bgcolor: "#FAFAFA",
            }}
          >
            <Typography sx={{ fontSize: 56, mb: 1.5 }}>📦</Typography>
            <Typography variant="h6" fontWeight="800" color="text.primary" mb={0.5}>
              No Products Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Add your first product to start selling on Agrokart
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/vendor/add-product")}
              sx={{
                borderRadius: "14px",
                textTransform: "none",
                fontWeight: 700,
                px: 4,
                py: 1.2,
                background: "linear-gradient(135deg, #E65100, #FF8F00)",
                boxShadow: "0 6px 20px rgba(230,81,0,0.35)",
              }}
            >
              Add First Product
            </Button>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {inventoryItems.map((item, idx) => {
              const stock = item.availableStock ?? item.stock ?? 0;
              const color = getStockColor(stock);
              const max = item.maxStockLevel || Math.max(stock * 1.5, 50);
              const pct = Math.min(100, (stock / max) * 100);
              const cat = item.product?.category || "other";
              const catStyle = catColors[cat] || catColors.other;
              const isOut = stock <= 0;
              const isLow = !isOut && stock <= 20;

              return (
                <Grid item xs={6} key={item._id || idx}>
                  <MotionCard
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.25 }}
                    sx={{
                      borderRadius: "20px",
                      overflow: "hidden",
                      boxShadow: isOut
                        ? "0 4px 16px rgba(211,47,47,0.08)"
                        : "0 4px 16px rgba(0,0,0,0.05)",
                      border: isOut
                        ? "1px solid rgba(211,47,47,0.2)"
                        : isLow
                        ? "1px solid rgba(245,124,0,0.2)"
                        : "1px solid rgba(0,0,0,0.05)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "box-shadow 0.2s, transform 0.2s",
                      "&:hover": {
                        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                        transform: "translateY(-3px)",
                      },
                    }}
                  >
                    {/* Product Image Area */}
                    <Box
                      sx={{
                        bgcolor: "#fff",
                        height: 100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        flexShrink: 0,
                        borderBottom: `3px solid ${catStyle.accent}22`,
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
                      <Box
                        sx={{
                          display: "none",
                          width: "100%",
                          height: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                          background: catStyle.bg,
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
                          px: 1,
                          py: 0.3,
                          borderRadius: "6px",
                          fontSize: "0.55rem",
                          fontWeight: 800,
                          letterSpacing: 0.5,
                          boxShadow: `0 2px 6px ${color}44`,
                        }}
                      >
                        {isOut ? "OUT" : isLow ? "LOW" : "OK"}
                      </Box>

                      {/* Category badge */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          bgcolor: "rgba(255,255,255,0.92)",
                          backdropFilter: "blur(4px)",
                          border: `1px solid ${catStyle.text}33`,
                          px: 0.8,
                          py: 0.2,
                          borderRadius: "6px",
                          fontSize: "0.5rem",
                          fontWeight: 700,
                          color: catStyle.text,
                          textTransform: "uppercase",
                          letterSpacing: 0.3,
                        }}
                      >
                        {cat}
                      </Box>
                    </Box>

                    {/* Card Body */}
                    <Box sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column" }}>
                      {/* Product Name */}
                      <Typography
                        variant="body2"
                        fontWeight="700"
                        sx={{
                          lineHeight: 1.3,
                          mb: 0.5,
                          fontSize: "0.8rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          color: "#111827",
                        }}
                      >
                        {item.product?.name || "Product"}
                      </Typography>

                      {/* Price */}
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 1 }}>
                        <Typography
                          fontWeight="900"
                          sx={{ color: catStyle.text, fontSize: "0.95rem", lineHeight: 1 }}
                        >
                          ₹{Number(item.sellingPrice || item.product?.price || 0).toFixed(0)}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem" }}>
                          /{item.product?.unit || "unit"}
                        </Typography>
                      </Box>

                      {/* Stock Bar */}
                      <Box sx={{ mt: "auto" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600, fontSize: "0.58rem" }}>
                            STOCK
                          </Typography>
                          <Typography variant="caption" sx={{ color, fontWeight: 800, fontSize: "0.72rem" }}>
                            {stock} units
                          </Typography>
                        </Box>
                        <Box sx={{ height: 5, bgcolor: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                          <Box
                            sx={{
                              height: "100%",
                              width: `${pct}%`,
                              background: isOut
                                ? "#D32F2F"
                                : isLow
                                ? "linear-gradient(90deg, #F57C00, #FFA726)"
                                : "linear-gradient(90deg, #388E3C, #66BB6A)",
                              borderRadius: 3,
                              transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
                            }}
                          />
                        </Box>
                        {(item.reservedStock || 0) > 0 && (
                          <Typography variant="caption" sx={{ color: "warning.main", fontSize: "0.58rem", fontWeight: 700, display: "block", mt: 0.5 }}>
                            ⏳ {item.reservedStock} reserved
                          </Typography>
                        )}
                      </Box>
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

                {/* Daily allocation & Total Stock controls */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={700} color="text.primary">
                      Total Stock: <Typography component="span" sx={{ color: "primary.main", fontWeight: 900 }}>{currentStock}</Typography>
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Today's Allocation:
                    </Typography>
                  </Box>
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
                      {order.orderStatus === "finding_vendor" ? (
                        <Button
                          fullWidth
                          variant="contained"
                          color="warning"
                          onClick={() => setOrderAlert(order)}
                          sx={{ borderRadius: 2, py: 1, fontWeight: "bold" }}
                        >
                          Respond to Order
                        </Button>
                      ) : (
                        !["picked_up", "out_for_delivery", "delivered", "cancelled", "rejected"].includes(
                          order.orderStatus,
                        ) && (
                          order.deliveryPartner ? (
                            <Button
                              fullWidth
                              variant="contained"
                              color="primary"
                              onClick={() => handleOpenVerifyDialog(order)}
                              sx={{ borderRadius: 2, py: 1 }}
                            >
                              Verify Pickup
                            </Button>
                          ) : (
                            <Button
                              fullWidth
                              variant="contained"
                              disabled
                              sx={{ borderRadius: 2, py: 1, bgcolor: "grey.300", color: "grey.600" }}
                            >
                              Awaiting Delivery Partner
                            </Button>
                          )
                        )
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

  const renderProfile = () => {
    const totalRevenue = dashboardData?.stats?.totalEarnings || historyOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = myOrders.length;
    const deliveredOrders = historyOrders.filter(o => o.orderStatus === "delivered").length;
    const activeOrders = myOrders.filter(o => !["delivered","cancelled","rejected"].includes(o.orderStatus)).length;
    const verificationStatus = dashboardData?.vendor?.verificationStatus || user?.vendorProfile?.verificationStatus;
    const isVerified = verificationStatus === "approved";
    const businessName = dashboardData?.vendor?.businessName || user?.vendorProfile?.businessName || user?.name || "Your Store";
    const rating = dashboardData?.vendor?.rating || user?.vendorProfile?.rating;

    const infoRows = [
      { icon: "📧", label: "Email", value: user?.email || "—" },
      { icon: "📱", label: "Phone", value: user?.phone || "—" },
      { icon: "📍", label: "Address", value: user?.address ? `${user.address.street || ""}, ${user.address.city || ""}`.replace(/^,\s*/, "") || "Not provided" : "Not provided" },
      { icon: "🏙️", label: "City", value: user?.address?.city || "—" },
      { icon: "📌", label: "Pincode", value: user?.address?.pincode || "—" },
    ];

    const actionItems = [
      {
        icon: <LocationOn sx={{ color: "#1565C0" }} />,
        label: "Update GPS Location",
        sub: "Sync exact coordinates via device",
        iconBg: "#E3F2FD",
        action: handleUpdateLocation,
        disabled: updatingLocation,
        actionLabel: updatingLocation ? "Detecting..." : null,
      },
      {
        icon: <LocationOn sx={{ color: "#2E7D32" }} />,
        label: "Update Address Manually",
        sub: "Type in your address and coordinates",
        iconBg: "#E8F5E9",
        action: () => setAddressDialogOpen(true),
      },
      {
        icon: <Settings sx={{ color: "#7B1FA2" }} />,
        label: "Business Settings",
        sub: "Manage your store preferences",
        iconBg: "#F3E5F5",
        action: () => setBusinessSettingsOpen(true),
      },
      {
        icon: <Notifications sx={{ color: "#E65100" }} />,
        label: "Notifications",
        sub: "Configure order and alert preferences",
        iconBg: "#FFF3E0",
        action: () => setNotificationsSettingsOpen(true),
      },
    ];

    return (
      <Box sx={{ pb: 12, bgcolor: "#F7F8FA", minHeight: "100vh" }}>

        {/* Hero Banner */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 40%, #43A047 100%)",
            height: 160,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background Pattern */}
          <Box sx={{ position: "absolute", top: -40, right: -40, opacity: 0.06 }}>
            <Person sx={{ fontSize: 260, color: "white" }} />
          </Box>
          <Box sx={{ position: "absolute", bottom: -20, left: -20, opacity: 0.06 }}>
            <Inventory sx={{ fontSize: 180, color: "white" }} />
          </Box>
        </Box>

        {/* Avatar + Name Card */}
        <Box sx={{ px: 2 }}>
          <Box
            sx={{
              bgcolor: "white",
              borderRadius: "24px",
              mt: -5,
              p: 2.5,
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              position: "relative",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
              {/* Avatar with ring */}
              <Box sx={{ position: "relative", mt: -6 }}>
                <Box
                  sx={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #1B5E20, #66BB6A)",
                    p: "3px",
                    boxShadow: "0 8px 24px rgba(27,94,32,0.35)",
                  }}
                >
                  <Avatar
                    src={user?.avatar}
                    sx={{
                      width: "100%",
                      height: "100%",
                      fontSize: "2.2rem",
                      fontWeight: 900,
                      bgcolor: "#2E7D32",
                      border: "3px solid white",
                    }}
                  >
                    {(businessName?.[0] || "V").toUpperCase()}
                  </Avatar>
                </Box>
                {isVerified && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      bgcolor: "#1565C0",
                      border: "2px solid white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 14, color: "white" }} />
                  </Box>
                )}
              </Box>

              {/* Name + Status */}
              <Box sx={{ flex: 1, pb: 0.5 }}>
                <Typography variant="h6" fontWeight="900" sx={{ color: "#111827", lineHeight: 1.2 }}>
                  {businessName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  {user?.name || "Vendor"} · {user?.email || ""}
                </Typography>
                <Chip
                  label={isVerified ? "✓ Verified Vendor" : "Pending Verification"}
                  size="small"
                  sx={{
                    bgcolor: isVerified ? "#E8F5E9" : "#FFF8E1",
                    color: isVerified ? "#1B5E20" : "#E65100",
                    fontWeight: 800,
                    fontSize: "0.65rem",
                    border: isVerified ? "1px solid #A5D6A7" : "1px solid #FFCC80",
                  }}
                />
              </Box>
            </Box>

            {/* Rating row */}
            {rating > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1.5, ml: 0.5 }}>
                {[1,2,3,4,5].map(star => (
                  <Box key={star} sx={{ color: star <= Math.round(rating) ? "#FFC107" : "#E0E0E0", fontSize: 16 }}>★</Box>
                ))}
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 0.5 }}>
                  {rating.toFixed(1)} rating
                </Typography>
              </Box>
            )}
          </Box>

          {/* Performance Stats */}
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: 1, ml: 0.5, mb: 1.5, display: "block" }}>
            Performance Overview
          </Typography>
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            {[
              {
                label: "Total Revenue",
                value: `₹${totalRevenue.toLocaleString("en-IN")}`,
                icon: "💰",
                gradient: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
                color: "#1B5E20",
              },
              {
                label: "Total Orders",
                value: totalOrders,
                icon: "📦",
                gradient: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
                color: "#1565C0",
              },
              {
                label: "Delivered",
                value: deliveredOrders,
                icon: "✅",
                gradient: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
                color: "#6A1B9A",
              },
              {
                label: "Active",
                value: activeOrders,
                icon: "🚚",
                gradient: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
                color: "#E65100",
              },
            ].map((stat, i) => (
              <Grid item xs={6} key={i}>
                <Box
                  sx={{
                    background: stat.gradient,
                    borderRadius: "18px",
                    p: 2,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                    border: "1px solid rgba(255,255,255,0.8)",
                  }}
                >
                  <Typography sx={{ fontSize: "1.4rem", mb: 0.5 }}>{stat.icon}</Typography>
                  <Typography variant="h5" fontWeight="900" sx={{ color: "#111827", lineHeight: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: stat.color }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Inventory Banner */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #42A5F5 100%)",
              borderRadius: "18px",
              p: 2.5,
              mb: 2.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ position: "absolute", right: -10, top: -10, opacity: 0.1 }}>
              <Inventory sx={{ fontSize: 100, color: "white" }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Active Inventory
              </Typography>
              <Typography variant="h4" fontWeight="900" color="white" sx={{ lineHeight: 1.1, mt: 0.5 }}>
                {inventoryItems.length}
                <Typography component="span" variant="body2" sx={{ color: "rgba(255,255,255,0.75)", ml: 1 }}>
                  Products
                </Typography>
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => setValue(1)}
              sx={{
                color: "white",
                bgcolor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                backdropFilter: "blur(4px)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              }}
            >
              Manage →
            </Button>
          </Box>

          {/* Personal Info */}
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: 1, ml: 0.5, mb: 1.5, display: "block" }}>
            Contact Information
          </Typography>
          <Box
            sx={{
              bgcolor: "white",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              mb: 2.5,
            }}
          >
            {infoRows.map((row, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 2.5,
                  py: 1.8,
                  borderBottom: i < infoRows.length - 1 ? "1px solid #F3F4F6" : "none",
                }}
              >
                <Typography sx={{ fontSize: "1.1rem", width: 28, textAlign: "center" }}>{row.icon}</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.58rem" }}>
                    {row.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#111827" noWrap>
                    {row.value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Actions */}
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: 1, ml: 0.5, mb: 1.5, display: "block" }}>
            Account & Settings
          </Typography>
          <Box
            sx={{
              bgcolor: "white",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              mb: 2,
            }}
          >
            {actionItems.map((item, i) => (
              <Box
                key={i}
                onClick={item.disabled ? undefined : item.action}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 2.5,
                  py: 2,
                  borderBottom: i < actionItems.length - 1 ? "1px solid #F3F4F6" : "none",
                  cursor: item.disabled ? "default" : "pointer",
                  opacity: item.disabled ? 0.6 : 1,
                  transition: "background 0.15s",
                  "&:active": { bgcolor: "#F9FAFB" },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "12px",
                    bgcolor: item.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} color="#111827">
                    {item.actionLabel || item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {item.sub}
                  </Typography>
                </Box>
                <ArrowForward sx={{ fontSize: 16, color: "#D1D5DB" }} />
              </Box>
            ))}
          </Box>

          {/* Logout Button */}
          <Box
            onClick={logout}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 2.5,
              py: 2,
              bgcolor: "white",
              borderRadius: "20px",
              border: "1.5px solid #FECACA",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(239,68,68,0.06)",
              transition: "all 0.2s",
              "&:active": { bgcolor: "#FEF2F2" },
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                bgcolor: "#FEF2F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ExitToApp sx={{ color: "#EF4444", fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={700} sx={{ color: "#EF4444" }}>
                Logout
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sign out from your account
              </Typography>
            </Box>
            <ArrowForward sx={{ fontSize: 16, color: "#FECACA" }} />
          </Box>

          {/* Version footer */}
          <Typography variant="caption" color="text.disabled" sx={{ textAlign: "center", display: "block", mt: 1 }}>
            Agrokart Vendor App · v1.0.0
          </Typography>
        </Box>
      </Box>
    );
  };
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
        {value === 4 && renderWallet()}
        {value === 5 && renderDailyStock()}
      </Box>

      {/* New Order Alert Modal — Accept / Reject */}
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
              bgcolor: "#FFF3E0",
              color: "#E65100",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto -40px",
              transform: "translateY(-60px)",
              border: "4px solid white",
              boxShadow: "0 8px 24px rgba(230,81,0,0.2)",
            }}
          >
            <LocalOffer sx={{ fontSize: 40 }} />
          </MotionBox>

          <Typography
            variant="h5"
            fontWeight="900"
            sx={{ mt: 3, mb: 0.5, color: "#E65100" }}
          >
            New Order Received!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please accept or reject this order
          </Typography>

          <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 2, mb: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
            >
              ORDER DETAILS
            </Typography>
            <Typography
              variant="h4"
              fontWeight="900"
              sx={{ my: 1, color: "#2E7D32" }}
            >
              ₹{orderAlert?.subtotalAmount || orderAlert?.totalAmount || orderAlert?.amount || "---"}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              ID: #
              {orderAlert?.trackingNumber ||
                orderAlert?.orderId?.slice(-6).toUpperCase() ||
                "---"}
            </Typography>
            {orderAlert?.deliveryCharge > 0 && (
              <Typography variant="caption" color="text.secondary">
                + ₹{orderAlert.deliveryCharge} delivery charge
              </Typography>
            )}
          </Box>

          {/* Vendor Payout Info */}
          <Box sx={{ bgcolor: "#E8F5E9", p: 1.5, borderRadius: 2, mb: 3 }}>
            <Typography variant="caption" fontWeight="bold" color="#2E7D32">
              YOUR PAYOUT (90%)
            </Typography>
            <Typography variant="h6" fontWeight="900" color="#1B5E20">
              ₹{orderAlert?.vendorPayout?.amount || Math.round((orderAlert?.subtotalAmount || orderAlert?.totalAmount || 0) * 0.9)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {orderAlert?.vendorPayout?.method === 'instant' ? '⚡ Instant payout' : '💵 After cash deposit'}
            </Typography>
          </Box>

          {/* Accept / Reject Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              size="large"
              disabled={respondingToOrder}
              onClick={() => setRejectDialogOpen(true)}
              sx={{
                borderRadius: 3,
                py: 1.5,
                fontWeight: "bold",
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Reject
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="success"
              size="large"
              disabled={respondingToOrder}
              onClick={handleAcceptOrder}
              sx={{
                borderRadius: 3,
                py: 1.5,
                fontWeight: "bold",
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              {respondingToOrder ? <CircularProgress size={24} color="inherit" /> : "Accept ✓"}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, width: "90%", maxWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Reject Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this order (optional):
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Out of stock, Cannot fulfill at this time..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={respondingToOrder}
            onClick={handleRejectOrder}
          >
            {respondingToOrder ? <CircularProgress size={20} color="inherit" /> : "Confirm Reject"}
          </Button>
        </DialogActions>
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
        sx={{ 
          position: "fixed", 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 100,
          pb: "env(safe-area-inset-bottom)", // Adjust for Vivo V20 gesture bar
        }}
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
          <BottomNavigationAction label="Wallet" icon={<AccountBalanceWallet />} />
        </BottomNavigation>
      </Paper>

      {/* Address Update Dialog */}
      <Dialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Update Address & Location</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Street Address"
              fullWidth
              size="small"
              value={addressForm.street}
              onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="City"
                fullWidth
                size="small"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              />
              <TextField
                label="State"
                fullWidth
                size="small"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
              />
            </Box>
            <TextField
              label="Pincode"
              fullWidth
              size="small"
              value={addressForm.pincode}
              onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
            />
            <Divider sx={{ my: 1 }}>GPS Coordinates (Optional)</Divider>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Latitude"
                fullWidth
                size="small"
                placeholder="e.g. 19.128684"
                value={addressForm.lat}
                onChange={(e) => setAddressForm({ ...addressForm, lat: e.target.value })}
              />
              <TextField
                label="Longitude"
                fullWidth
                size="small"
                placeholder="e.g. 74.189692"
                value={addressForm.lon}
                onChange={(e) => setAddressForm({ ...addressForm, lon: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddressDialogOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleUpdateManualAddress} 
            variant="contained" 
            color="primary"
            disabled={addressUpdating}
            sx={{ borderRadius: 2 }}
          >
            {addressUpdating ? "Saving..." : "Save Address"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Business Settings Dialog */}
      <Dialog
        open={businessSettingsOpen}
        onClose={() => setBusinessSettingsOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "24px", p: 1 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="900" color="#111827">Business Settings</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Manage how your store appears to customers on Agrokart.
          </Typography>
          
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight="700">Accepting Orders</Typography>
              <Typography variant="caption" color="text.secondary">Store is visible to customers</Typography>
            </Box>
            <Switch checked={vendorSettings.acceptingOrders} onChange={(e) => setVendorSettings({...vendorSettings, acceptingOrders: e.target.checked})} color="success" />
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight="700">Auto-Accept Orders</Typography>
              <Typography variant="caption" color="text.secondary">Automatically accept incoming requests</Typography>
            </Box>
            <Switch checked={vendorSettings.autoAcceptOrders} onChange={(e) => setVendorSettings({...vendorSettings, autoAcceptOrders: e.target.checked})} color="success" />
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="subtitle2" fontWeight="700">Cash on Delivery</Typography>
              <Typography variant="caption" color="text.secondary">Allow customers to pay on arrival</Typography>
            </Box>
            <Switch checked={vendorSettings.cashOnDelivery} onChange={(e) => setVendorSettings({...vendorSettings, cashOnDelivery: e.target.checked})} color="success" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
          <Button onClick={() => setBusinessSettingsOpen(false)} sx={{ color: "text.secondary", fontWeight: 700, borderRadius: "12px", textTransform: "none" }}>Close</Button>
          <Button onClick={handleSaveSettings} disabled={settingsSaving} variant="contained" sx={{ bgcolor: "#2E7D32", borderRadius: "12px", fontWeight: 700, textTransform: "none", boxShadow: "0 4px 12px rgba(46,125,50,0.3)", "&:hover": { bgcolor: "#1B5E20" } }}>
            {settingsSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Settings Dialog */}
      <Dialog
        open={notificationsSettingsOpen}
        onClose={() => setNotificationsSettingsOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "24px", p: 1 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="900" color="#111827">Notification Preferences</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose how you want to be alerted about new orders and stock.
          </Typography>
          
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight="700">Push Notifications</Typography>
              <Typography variant="caption" color="text.secondary">Alerts on your mobile device</Typography>
            </Box>
            <Switch checked={vendorNotifications.push} onChange={(e) => setVendorNotifications({...vendorNotifications, push: e.target.checked})} color="warning" />
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight="700">SMS Alerts</Typography>
              <Typography variant="caption" color="text.secondary">Text messages for new orders</Typography>
            </Box>
            <Switch checked={vendorNotifications.sms} onChange={(e) => setVendorNotifications({...vendorNotifications, sms: e.target.checked})} color="warning" />
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="subtitle2" fontWeight="700">Low Stock Warnings</Typography>
              <Typography variant="caption" color="text.secondary">Alert when inventory is below 10</Typography>
            </Box>
            <Switch checked={vendorNotifications.lowStock} onChange={(e) => setVendorNotifications({...vendorNotifications, lowStock: e.target.checked})} color="warning" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
          <Button onClick={() => setNotificationsSettingsOpen(false)} sx={{ color: "text.secondary", fontWeight: 700, borderRadius: "12px", textTransform: "none" }}>Close</Button>
          <Button onClick={handleSaveNotifications} disabled={settingsSaving} variant="contained" sx={{ bgcolor: "#E65100", borderRadius: "12px", fontWeight: 700, textTransform: "none", boxShadow: "0 4px 12px rgba(230,81,0,0.3)", "&:hover": { bgcolor: "#E65100" } }}>
            {settingsSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </DialogActions>
      </Dialog>

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
