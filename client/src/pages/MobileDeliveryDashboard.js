import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Avatar,
  Stack,
  Switch,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogContent,
  DialogActions,
  Slide,
  LinearProgress,
  Badge,
  Fab,
  Drawer,
  AppBar,
  Toolbar,
  TextField,
  DialogTitle,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import {
  Language,
  Map,
  Security,
  SupportAgent,
  PrivacyTip,
  AutoMode,
  PersonOutline,
  EmailOutlined,
  PhoneOutlined,
  TwoWheeler,
  BadgeOutlined,
  ConfirmationNumber,
  Dashboard as DashboardIcon,
  Timeline as HistoryIcon,
  AccountBalanceWallet as WalletIcon,
  Person as ProfileIcon,
  LocalShipping,
  GpsFixed,
  Directions,
  Notifications,
  Settings,
  ExitToApp,
  CheckCircle,
  Close,
  Phone,
  LocationOn,
  AccessTime,
  CurrencyRupee,
  TrendingUp,
  CalendarToday,
  Map as MapIcon,
  Star,
  Menu as MenuIcon,
  Store,
  ChevronRight,
  Home,
  DarkMode,
  LightMode,
  Palette,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useThemeContext } from "../context/ThemeContext"; // Import ThemeContext
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAvailableAssignments,
  acceptAssignment,
  getDeliveryDashboard,
  updateDeliveryStatus,
  updateDeliveryAvailability,
  rejectAssignment,
  getBankAccount,
  linkBankAccount,
  getCashCollection,
  recordCashDeposit,
  getDeliveryHistory,
  safeFetch,
  API_BASE_URL,
} from "../services/api";
import LiveTrackingMap from "../components/map/LiveTrackingMap";
import {
  startLocationTracking,
  stopLocationTracking,
  isTrackingActive,
} from "../services/trackingService";
import { DEMO_MODE, getDeviceGPS } from "../config/demoConfig";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

const MotionCard = motion(Card);
const MotionBox = motion(Box);
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// --- THEME CONSTANTS ---
const PURPLE_GRADIENT = "linear-gradient(135deg, #6A1B9A 0%, #4A148C 100%)";
const AMBER_ACCENT = "#FFD740";

// --- TRANSLATIONS ---
const TRANSLATIONS = {
  "English (US)": {
    dashboard: "Home",
    history: "History",
    wallet: "Wallet",
    profile: "Profile",
    settings: "Settings"
  },
  "Hindi (हिंदी)": {
    dashboard: "डैशबोर्ड",
    history: "इतिहास",
    wallet: "वॉलेट",
    profile: "प्रोफ़ाइल",
    settings: "सेटिंग्स"
  },
  "Marathi (मराठी)": {
    dashboard: "डॅशबोर्ड",
    history: "इतिहास",
    wallet: "पाकीट",
    profile: "प्रोफाईल",
    settings: "सेटिंग्ज"
  }
};

const MobileDeliveryDashboard = () => {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeContext(); // Get theme mode and toggle function
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const socket = useSocket();
  const [value, setValue] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const [earnings, setEarnings] = useState({
    daily: 0,
    monthly: 0,
    todayDeliveries: 0,
    monthlyDeliveries: 0,
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [currentLocation, setCurrentLocation] = useState({
    lat: 18.5204,
    lng: 73.8567,
  });
  const [mapView, setMapView] = useState(false);
  const [demoPickup, setDemoPickup] = useState(null);
  const [demoCustomer, setDemoCustomer] = useState(null);
  const locationWatchId = useRef(null);
  const notificationTimeout = useRef(null);

  // Settings State
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [pushEnabled, setPushEnabled] = useState(true);
  const [autoNavEnabled, setAutoNavEnabled] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [language, setLanguage] = useState("English (US)");
  const [navigationDialogOpen, setNavigationDialogOpen] = useState(false);
  const [navigationApp, setNavigationApp] = useState("Google Maps");
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  
  // Security PIN states
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const handleSnackbar = (message) => setSnackbar({ open: true, message });

  const t = (key) => TRANSLATIONS[language]?.[key] || TRANSLATIONS["English (US)"][key] || key;

  // Derived theme colors
  const isDark = mode === "dark";
  const bgColor = isDark ? "#121212" : "#F3E5F5"; // Very dark grey vs Light Purple tint
  const cardBg = isDark ? "#1E1E1E" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#4A148C"; // White vs Dark Purple
  const textSecondary = isDark ? "#B0BEC5" : "#757575";
  const bottomNavBg = isDark ? "#1E1E1E" : "#FFFFFF";

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (token && isOnline) {
          const data = await getDeliveryDashboard(token);
          setDashboardData(data);
          if (data.earningsSummary) {
            const deliveriesToday = data.stats?.todayDeliveries || 0;
            const deliveriesMonth = data.stats?.deliveriesThisMonth || 0;
            const maxDaily = Math.max(500, 500 * deliveriesToday);
            const maxMonthly = Math.max(5000, 500 * deliveriesMonth);
            
            setEarnings({
              daily: Math.min(data.earningsSummary.totalNet || 0, maxDaily),
              monthly:
                Math.min(data.monthlyTrend?.reduce(
                  (sum, month) => sum + (month.totalNet || 0),
                  0,
                ) || 0, maxMonthly),
              todayDeliveries: deliveriesToday,
              monthlyDeliveries: deliveriesMonth,
            });
          }
          if (data.currentAssignments && data.currentAssignments.length > 0) {
            setCurrentAssignment(data.currentAssignments[0]);
          } else {
            setCurrentAssignment(null);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [token, isOnline]);

  // Fetch available assignments
  useEffect(() => {
    let isMounted = true;
    const fetchAssignments = async () => {
      if (isOnline && token && isMounted) {
        try {
          console.log("🔄 Fetching assignments from API...");
          const response = await getAvailableAssignments(token);
          console.log("✅ Fetched assignments API response:", response);
          if (isMounted) {
            setAvailableAssignments(response.assignments || []);
            console.log("✅ State updated with assignments:", response.assignments?.length || 0);
          }
        } catch (err) {
          console.error("❌ Failed to fetch available assignments:", err);
        }
      } else if (!isOnline) {
        console.log("⏸️ Delivery partner is offline. Skipping assignment fetch.");
      }
    };
    
    // Initial fetch
    fetchAssignments();

    const interval = setInterval(fetchAssignments, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    }
  }, [isOnline, token]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !isOnline) return;

    if (user?.id) {
      socket.emit("join_delivery_partner_room", user.id);
    }
    if (user?.firebaseUid) {
      socket.emit("join_delivery_partner_room", user.firebaseUid);
    }

    const handleNewAssignment = (assignment) => {
      console.log("🔔 NEW DELIVERY REQUEST RECEIVED (Socket):", assignment);
      setNewOrderNotification(assignment);

      // Play notification sound if available (optional/future)

      if (token) {
        console.log("🔄 Refreshing available assignments list...");
        getAvailableAssignments(token)
          .then((response) => {
            console.log(
              "✅ Assignments refreshed:",
              response.assignments?.length,
            );
            setAvailableAssignments(response.assignments || []);
          })
          .catch((err) =>
            console.error("❌ Error refreshing assignments:", err),
          );
      }

      // Clear notification after 30 seconds if not interacted
      if (notificationTimeout.current)
        clearTimeout(notificationTimeout.current);
      notificationTimeout.current = setTimeout(() => {
        setNewOrderNotification(null);
      }, 30000);
    };

    socket.on("new_assignment", handleNewAssignment);
    socket.on("delivery_request", handleNewAssignment);
    socket.on("assignment_accepted", (data) => {
      if (data.assignmentId === newOrderNotification?._id) {
        setNewOrderNotification(null);
      }
    });

    return () => {
      socket.off("new_assignment", handleNewAssignment);
      socket.off("delivery_request", handleNewAssignment);
      socket.off("assignment_accepted");
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current);
      }
    };
  }, [socket, isOnline, newOrderNotification, user, token]);

  // Real-time location tracking (uses trackingService with GPS + socket)
  useEffect(() => {
    if (!isOnline || !currentAssignment || !socket) {
      stopLocationTracking();
      return;
    }

    const orderId = currentAssignment.order?._id || currentAssignment.order;
    const assignmentId = currentAssignment._id;

    startLocationTracking(socket, assignmentId, orderId, (loc) => {
      setCurrentLocation(loc);
    });

    return () => {
      stopLocationTracking();
    };
  }, [isOnline, socket, currentAssignment]);

  // DEMO_MODE: Set all positions to device GPS
  useEffect(() => {
    if (!DEMO_MODE) return;
    const init = async () => {
      const [pickup, customer] = await Promise.all([
        getDeviceGPS(100),
        getDeviceGPS(80),
      ]);
      setDemoPickup(pickup);
      setDemoCustomer(customer);
    };
    init();
  }, []);

  const handleOnlineToggle = async (event) => {
    const online = event.target.checked;
    setIsOnline(online);

    // Update backend status
    if (token) {
      try {
        await updateDeliveryAvailability({ isAvailable: online }, token);
        console.log(
          `Backend status updated to: ${online ? "Online" : "Offline"}`,
        );
      } catch (error) {
        console.error("Failed to update backend availability status:", error);
        // Optional: Revert UI state if critical
      }
    }

    // Socket updates (keep existing logic)
    if (online && socket) {
      socket.emit("delivery_partner_online", { partnerId: user?.id });
    } else if (socket) {
      socket.emit("delivery_partner_offline", { partnerId: user?.id });
    }
  };

  const handleAcceptOrder = async () => {
    if (!newOrderNotification || !token) return;
    try {
      const response = await acceptAssignment(newOrderNotification._id, token);
      if (response.assignment) {
        setCurrentAssignment(response.assignment);
        setNewOrderNotification(null);
        if (notificationTimeout.current) {
          clearTimeout(notificationTimeout.current);
        }
        if (socket) {
          socket.emit("assignment_accepted", {
            assignmentId: newOrderNotification._id,
            partnerId: user?.id,
          });
        }
      }
    } catch (error) {
      console.error("Error accepting assignment:", error);
      alert(
        error.message ||
          "Failed to accept order. It may have been taken by another partner.",
      );
    }
  };

  const handleRejectOrder = () => {
    setNewOrderNotification(null);
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }
  };

  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [deliveryPin, setDeliveryPin] = useState("");
  const [pickupPinDialogOpen, setPickupPinDialogOpen] = useState(false);
  const [vendorPickupPin, setVendorPickupPin] = useState("");

  const handleStatusUpdate = async (newStatus) => {
    if (!currentAssignment || !token) return;

    if (newStatus === "picked_up") {
      setPickupPinDialogOpen(true);
      return;
    }

    if (newStatus === "delivered") {
      setPinDialogOpen(true);
      return;
    }

    try {
      const response = await updateDeliveryStatus(
        currentAssignment._id,
        { status: newStatus },
        token,
      );
      if (response.success) {
        setCurrentAssignment((prev) => ({ ...prev, status: newStatus }));

        // Broadcast status change to customer via socket
        if (socket) {
          const orderId =
            currentAssignment.order?._id || currentAssignment.order;
          socket.emit("delivery_status_change", {
            orderId,
            assignmentId: currentAssignment._id,
            status: newStatus,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.message || "Failed to update status");
    }
  };

  const handleDeliverWithPin = async () => {
    if (!deliveryPin || deliveryPin.length !== 4) {
      alert("Please enter a valid 4-digit PIN");
      return;
    }

    try {
      const response = await updateDeliveryStatus(
        currentAssignment._id,
        { status: "delivered", deliveryPin },
        token,
      );
      if (response.success || response.assignment) {
        // Broadcast delivered status to customer
        if (socket) {
          const orderId =
            currentAssignment.order?._id || currentAssignment.order;
          socket.emit("delivery_status_change", {
            orderId,
            assignmentId: currentAssignment._id,
            status: "delivered",
            timestamp: Date.now(),
          });
        }
        // Stop GPS tracking
        stopLocationTracking();

        setPinDialogOpen(false);
        setDeliveryPin("");
        setCurrentAssignment(null);
        const dashboard = await getDeliveryDashboard(token);
        if (dashboard.earningsSummary) {
          const deliveriesToday = dashboard.stats?.todayDeliveries || 0;
          const deliveriesMonth = dashboard.stats?.deliveriesThisMonth || 0;
          const maxDaily = Math.max(500, 500 * deliveriesToday);
          const maxMonthly = Math.max(5000, 500 * deliveriesMonth);
          
          setEarnings({
            daily: Math.min(dashboard.earningsSummary.totalNet || 0, maxDaily),
            monthly:
              Math.min(dashboard.monthlyTrend?.reduce(
                (sum, month) => sum + (month.totalNet || 0),
                0,
              ) || 0, maxMonthly),
            todayDeliveries: deliveriesToday,
            monthlyDeliveries: deliveriesMonth,
          });
        }
        alert("Order delivered successfully! Earnings updated.");
      }
    } catch (error) {
      console.error("Error completing delivery:", error);
      alert(error.message || "Invalid PIN or failed to complete delivery");
    }
  };

  const handlePickupWithPin = async () => {
    if (!vendorPickupPin || vendorPickupPin.length !== 4) {
      alert("Please enter a valid 4-digit PIN");
      return;
    }

    try {
      const response = await updateDeliveryStatus(
        currentAssignment._id,
        { status: "picked_up", vendorPickupPin },
        token,
      );
      if (response.success || response.assignment) {
        // Broadcast status change to customer via socket
        if (socket) {
          const orderId = currentAssignment.order?._id || currentAssignment.order;
          socket.emit("delivery_status_change", {
            orderId,
            assignmentId: currentAssignment._id,
            status: "picked_up",
            timestamp: Date.now(),
          });
        }

        setPickupPinDialogOpen(false);
        setVendorPickupPin("");
        setCurrentAssignment((prev) => ({ ...prev, status: "in_transit" })); // The next status after picked_up is in_transit from delivery partner's point of view, although the DB tracks it.
        // Also refresh dashboard to ensure consistency
        const dashboard = await getDeliveryDashboard(token);
        if (dashboard.currentAssignments && dashboard.currentAssignments.length > 0) {
          setCurrentAssignment(dashboard.currentAssignments[0]);
        }
        alert("Order picked up successfully!");
      }
    } catch (error) {
      console.error("Error completing pickup:", error);
      alert(error.message || "Invalid Vendor PIN or failed to confirm pickup");
    }
  };

  const drawer = (
    <Box sx={{ height: "100%", bgcolor: cardBg, color: textColor }}>
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: PURPLE_GRADIENT,
          color: "white",
        }}
      >
        <Avatar
          src={user?.avatar}
          sx={{
            width: 80,
            height: 80,
            mb: 2,
            border: `4px solid ${AMBER_ACCENT}`,
          }}
        />
        <Typography variant="h6" fontWeight="bold">
          {user?.name}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {user?.email}
        </Typography>
        <Chip
          label="Delivery Partner"
          size="small"
          sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
        />
      </Box>
      <List sx={{ pt: 2 }}>
        {[
          { text: "Dashboard", icon: <DashboardIcon />, index: 0 },
          { text: "History", icon: <HistoryIcon />, index: 1 },
          { text: "Earnings", icon: <WalletIcon />, index: 2 },
          { text: "Profile", icon: <ProfileIcon />, index: 3 },
          { text: "Settings", icon: <Settings />, index: 4 }, // Changed to index 4 for local settings
        ].map((item) => (
          <ListItemButton
            key={item.text}
            onClick={() => {
              setValue(item.index);
              setMobileOpen(false);
            }}
            selected={item.index === value}
            sx={{
              mx: 2,
              borderRadius: 2,
              mb: 1,
              "&.Mui-selected": {
                bgcolor: isDark ? "rgba(255, 215, 64, 0.15)" : "#F3E5F5",
                color: isDark ? AMBER_ACCENT : "#4A148C",
              },
              "&:hover": {
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#F5F5F5",
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  item.index === value
                    ? isDark
                      ? AMBER_ACCENT
                      : "#6A1B9A"
                    : textSecondary,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: 600,
                color:
                  item.index === value
                    ? isDark
                      ? AMBER_ACCENT
                      : "#4A148C"
                    : textColor,
              }}
            />
            {item.index === value && (
              <ChevronRight sx={{ color: isDark ? AMBER_ACCENT : "#6A1B9A" }} />
            )}
          </ListItemButton>
        ))}
        <Divider
          sx={{
            my: 2,
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          }}
        />
        <ListItemButton
          onClick={logout}
          sx={{ mx: 2, borderRadius: 2, color: "#D32F2F" }}
        >
          <ListItemIcon sx={{ color: "#D32F2F" }}>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontWeight: 600 }}
          />
        </ListItemButton>
      </List>
    </Box>
  );

  const [gpsStatus, setGpsStatus] = useState("unknown"); // 'active', 'inactive', 'denied'

  // Check GPS Status
  useEffect(() => {
    const checkGps = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const permission = await Geolocation.checkPermissions();
          if (permission.location !== "granted") {
            setGpsStatus("denied");
            return;
          }
          // Try to get current position to verify GPS is actually on
          try {
            await Geolocation.getCurrentPosition({ timeout: 5000 });
            setGpsStatus("active");
          } catch (e) {
            setGpsStatus("inactive");
          }
        } else {
          // Web Fallback
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              () => setGpsStatus("active"),
              () => setGpsStatus("inactive"),
            );
          } else {
            setGpsStatus("denied");
          }
        }
      } catch (error) {
        console.error("GPS Check Error:", error);
        setGpsStatus("inactive");
      }
    };

    checkGps();
    const interval = setInterval(checkGps, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const renderDashboard = () => (
    <Box sx={{ pb: 10, bgcolor: "#F5F3FF", minHeight: "100vh" }}>
      {/* Structured Purple Header */}
      <Box sx={{ 
        px: 2.5, 
        pt: "calc(env(safe-area-inset-top) + 20px)", 
        pb: 3, 
        background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)", // Deep Violet / Purple
        borderBottom: "4px solid #8B5CF6", // Accent border
      }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton edge="start" sx={{ color: "#ffffff" }} onClick={handleDrawerToggle}>
              <MenuIcon />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ color: "#ffffff", lineHeight: 1.2 }}>
                Hello, {user?.name?.split(" ")[0] || "Partner"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                {gpsStatus === "active" ? (
                  <Chip size="small" icon={<GpsFixed sx={{ fontSize: "14px !important", color: "#34D399 !important" }} />} label="GPS Active" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, bgcolor: "rgba(52,211,153,0.15)", color: "#34D399", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 1 }} />
                ) : (
                  <Chip size="small" icon={<LocationOn sx={{ fontSize: "14px !important", color: "#FCA5A5 !important" }} />} label="GPS Off" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, bgcolor: "rgba(248,113,113,0.15)", color: "#FCA5A5", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 1 }} />
                )}
              </Box>
            </Box>
          </Box>
          
          <IconButton 
            sx={{ 
              color: "#ffffff", 
              bgcolor: "rgba(255,255,255,0.1)", 
              borderRadius: 1,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.2)",
                transform: "translateY(-2px)"
              },
              "&:active": {
                transform: "scale(0.92)"
              },
              ...(newOrderNotification && {
                animation: "pulse 1.5s infinite"
              })
            }}
          >
            <Badge 
              badgeContent={newOrderNotification ? 1 : 0} 
              color="error"
              sx={{
                "& .MuiBadge-badge": {
                  boxShadow: "0 0 0 2px #4C1D95", // matches header background
                }
              }}
            >
              <Notifications sx={{ 
                animation: newOrderNotification ? "ring 2s ease-in-out infinite" : "none",
                "@keyframes ring": {
                  "0%": { transform: "rotate(0)" },
                  "10%": { transform: "rotate(15deg)" },
                  "20%": { transform: "rotate(-10deg)" },
                  "30%": { transform: "rotate(5deg)" },
                  "40%": { transform: "rotate(-5deg)" },
                  "50%": { transform: "rotate(0)" },
                  "100%": { transform: "rotate(0)" }
                },
                "@keyframes pulse": {
                  "0%": { boxShadow: "0 0 0 0 rgba(255,255,255,0.4)" },
                  "70%": { boxShadow: "0 0 0 10px rgba(255,255,255,0)" },
                  "100%": { boxShadow: "0 0 0 0 rgba(255,255,255,0)" }
                }
              }} />
            </Badge>
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ px: 2, pt: 3 }}>
        {/* Status Toggle Box */}
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          bgcolor: isOnline ? "#ECFDF5" : "#ffffff", 
          border: isOnline ? "1px solid #10B981" : "1px solid #EDE9FE",
          boxShadow: "0 2px 4px rgba(109, 40, 217, 0.05)",
          p: 2, 
          borderRadius: 1.5,
          mb: 3
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: isOnline ? "#10B981" : "#8B5CF6" }} />
            <Box>
              <Typography variant="subtitle2" sx={{ color: isOnline ? "#065F46" : "#4C1D95", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                {isOnline ? "Online" : "Offline"}
              </Typography>
              <Typography variant="caption" sx={{ color: isOnline ? "#047857" : "#6D28D9" }}>
                {isOnline ? "Ready for orders" : "Not accepting orders"}
              </Typography>
            </Box>
          </Box>
          <Switch
            checked={isOnline}
            onChange={handleOnlineToggle}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": { color: "#10B981" },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#10B981" },
              "& .MuiSwitch-switchBase:not(.Mui-checked)": { color: "#8B5CF6" },
              "& .MuiSwitch-track": { bgcolor: "#C4B5FD" },
            }}
          />
        </Box>

        {/* Offline State Alert */}
        <AnimatePresence>
          {!isOnline && (
            <MotionBox
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: "16px" }}
            >
              <Card sx={{ bgcolor: "#ffffff", borderRadius: 1.5, borderLeft: "4px solid #8B5CF6", borderTop: "1px solid #EDE9FE", borderRight: "1px solid #EDE9FE", borderBottom: "1px solid #EDE9FE", boxShadow: "0 2px 4px rgba(109, 40, 217, 0.05)" }}>
                <CardContent sx={{ display: "flex", alignItems: "flex-start", gap: 2, p: "16px !important" }}>
                  <LocalShipping sx={{ fontSize: 24, color: "#8B5CF6", mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="700" color="#4C1D95">
                      You are currently offline
                    </Typography>
                    <Typography variant="body2" color="#6D28D9" sx={{ mt: 0.5 }}>
                      Toggle the switch above to connect to the network and start receiving assignments.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </MotionBox>
          )}
        </AnimatePresence>

        {/* Sharp Stats Cards with Purple Accents */}
        {isOnline && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6D28D9", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Today's Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card sx={{ borderRadius: 1.5, boxShadow: "0 2px 4px rgba(109, 40, 217, 0.05)", border: "1px solid #EDE9FE", bgcolor: "#ffffff" }}>
                  <CardContent sx={{ p: "16px !important" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                       <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: "#F5F3FF", display: "flex", alignItems: "center", justifyItems: "center" }}>
                          <CurrencyRupee sx={{ color: "#8B5CF6", fontSize: 18, margin: "auto" }} />
                       </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: "#6D28D9", fontWeight: 600, display: "block", mb: 0.5 }}>
                      EARNINGS
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#4C1D95", display: "flex", alignItems: "center" }}>
                      <span style={{ color: "#8B5CF6", fontSize: "1.2rem", marginRight: "2px" }}>₹</span>
                      {earnings.daily}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ borderRadius: 1.5, boxShadow: "0 2px 4px rgba(109, 40, 217, 0.05)", border: "1px solid #EDE9FE", bgcolor: "#ffffff" }}>
                  <CardContent sx={{ p: "16px !important" }}>
                     <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                       <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: "#F5F3FF", display: "flex", alignItems: "center", justifyItems: "center" }}>
                          <LocalShipping sx={{ color: "#8B5CF6", fontSize: 18, margin: "auto" }} />
                       </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: "#6D28D9", fontWeight: 600, display: "block", mb: 0.5 }}>
                      DELIVERIES
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#4C1D95" }}>
                      {earnings.todayDeliveries}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Active Assignment */}
        {isOnline && currentAssignment && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: textColor,
              }}
            >
              <LocalShipping
                sx={{ color: isDark ? AMBER_ACCENT : "#6A1B9A" }}
              />{" "}
              Active Order
            </Typography>
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                overflow: "hidden",
                bgcolor: cardBg,
                color: textColor,
              }}
            >
              <Box sx={{ width: "100%", height: 220, position: "relative" }}>
                <LiveTrackingMap
                  riderPosition={currentLocation}
                  pickupPosition={
                    DEMO_MODE && demoPickup
                      ? demoPickup
                      : {
                          lat:
                            currentAssignment.pickupLocation?.coordinates
                              ?.coordinates[1] || 18.5204,
                          lng:
                            currentAssignment.pickupLocation?.coordinates
                              ?.coordinates[0] || 73.8567,
                        }
                  }
                  customerPosition={
                    DEMO_MODE && demoCustomer
                      ? demoCustomer
                      : {
                          lat:
                            currentAssignment.deliveryLocation?.coordinates
                              ?.coordinates[1] || 18.525,
                          lng:
                            currentAssignment.deliveryLocation?.coordinates
                              ?.coordinates[0] || 73.861,
                        }
                  }
                  riderName={user?.name || "You"}
                  followRider={true}
                />
                {isTrackingActive() && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      zIndex: 1000,
                      bgcolor: "#2E7D32",
                      color: "white",
                      px: 1,
                      py: 0.3,
                      borderRadius: 2,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      boxShadow: "0 2px 8px rgba(46,125,50,0.3)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "#76FF03",
                        animation: "livePulse 2s ease-out infinite",
                      }}
                    />
                    LIVE TRACKING
                  </Box>
                )}
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      ORDER ID
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {currentAssignment.order?._id
                        ? `#${currentAssignment.order._id.slice(-6).toUpperCase()}`
                        : "OD-12345"}
                    </Typography>
                  </Box>
                  <Chip
                    label={currentAssignment.status
                      .replace("_", " ")
                      .toUpperCase()}
                    sx={{
                      fontWeight: "bold",
                      bgcolor: isDark ? AMBER_ACCENT : "#6A1B9A",
                      color: isDark ? "black" : "white",
                    }}
                  />
                </Box>

                {currentAssignment.vendorPickupPin &&
                  currentAssignment.status !== "picked_up" &&
                  currentAssignment.status !== "delivered" && (
                    <Box
                      sx={{
                        mb: 2,
                        textAlign: "center",
                        bgcolor: "rgba(255, 215, 64, 0.15)",
                        px: 2,
                        py: 1.5,
                        borderRadius: 2,
                        border: "1px solid #FFD740",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight="bold"
                      >
                        SHARE THIS PIN WITH VENDOR FOR PICKUP
                      </Typography>
                      <Typography
                        variant="h4"
                        fontWeight="900"
                        sx={{ color: "#FFD740", letterSpacing: 4, mt: 0.5 }}
                      >
                        {currentAssignment.vendorPickupPin}
                      </Typography>
                    </Box>
                  )}

                <Divider
                  sx={{
                    my: 2,
                    borderColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  }}
                />

                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      PICKUP
                    </Typography>
                    <Typography variant="body2" fontWeight="600" noWrap>
                      {currentAssignment.pickupLocation?.address?.street ||
                        "Vendor Location"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      DROP
                    </Typography>
                    <Typography variant="body2" fontWeight="600" noWrap>
                      {currentAssignment.deliveryLocation?.address?.street ||
                        "Customer Location"}
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<Directions />}
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      background: PURPLE_GRADIENT,
                    }}
                    onClick={() => {
                      const lat =
                        currentAssignment.deliveryLocation?.coordinates
                          ?.coordinates[1];
                      const lng =
                        currentAssignment.deliveryLocation?.coordinates
                          ?.coordinates[0];
                      if (lat && lng)
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                          "_blank",
                        );
                    }}
                  >
                    Navigate to Drop
                  </Button>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      startIcon={<Phone />}
                      fullWidth
                      sx={{
                        borderRadius: 2,
                        borderColor: isDark ? AMBER_ACCENT : "#6A1B9A",
                        color: isDark ? AMBER_ACCENT : "#6A1B9A",
                      }}
                      onClick={() => {
                        if (currentAssignment.customer?.phone)
                          window.open(
                            `tel:${currentAssignment.customer.phone}`,
                            "_self",
                          );
                      }}
                    >
                      Call Customer
                    </Button>
                    {currentAssignment.status === "accepted" && (
                      <Box sx={{ flex: 1, p: 1, bgcolor: isDark ? 'rgba(255, 152, 0, 0.1)' : '#fff3e0', borderRadius: 2, border: '1px dashed #ff9800', textAlign: 'center' }}>
                        <Typography variant="caption" color="warning.main">Show this PIN to Vendor:</Typography>
                        <Typography variant="h5" color="warning.main" sx={{ letterSpacing: 3, fontWeight: 'bold' }}>{currentAssignment.vendorPickupPin || "WAITING"}</Typography>
                      </Box>
                    )}
                    {currentAssignment.status === "picked_up" && (
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        sx={{ borderRadius: 2 }}
                        onClick={() => handleStatusUpdate("delivered")}
                      >
                        Delivered
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Available Assignments */}
        {isOnline && !currentAssignment && availableAssignments.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ mb: 2, color: textColor }}
            >
              Available Orders ({availableAssignments.length})
            </Typography>
            {availableAssignments.map((assignment) => (
              <MotionCard
                key={assignment._id}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  border: "1px solid #eee",
                  bgcolor: cardBg,
                  color: textColor,
                }}
                whileHover={{ y: -2 }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ color: isDark ? AMBER_ACCENT : "#6A1B9A" }}
                      >
                        ₹{Math.min(500, assignment.deliveryFee || 50)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Est. Earnings
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="h6" fontWeight="bold">
                        {assignment.distance?.toFixed(1)} km
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Distance
                      </Typography>
                    </Box>
                  </Box>
                  <Divider
                    sx={{
                      mb: 2,
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <LocationOn fontSize="small" color="disabled" />
                    <Typography variant="body2" noWrap>
                      {assignment.deliveryLocation?.address?.street ||
                        "Customer Location"}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2, borderRadius: 2, background: PURPLE_GRADIENT }}
                    onClick={async () => {
                      try {
                        const response = await acceptAssignment(
                          assignment._id,
                          token,
                        );
                        if (response.assignment) {
                          setCurrentAssignment(response.assignment);
                          setAvailableAssignments((prev) =>
                            prev.filter((a) => a._id !== assignment._id),
                          );
                        }
                      } catch (error) {
                        alert(error.message || "Failed to accept order");
                      }
                    }}
                  >
                    Accept Order
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    sx={{ mt: 1, borderRadius: 2 }} // Added margin top for spacing
                    onClick={async () => {
                      try {
                        await rejectAssignment(assignment._id, token);
                        setAvailableAssignments((prev) =>
                          prev.filter((a) => a._id !== assignment._id),
                        );
                      } catch (error) {
                        alert(error.message || "Failed to reject order");
                      }
                    }}
                  >
                    Reject
                  </Button>
                </CardContent>
              </MotionCard>
            ))}
          </Box>
        )}

        {/* Empty State */}
        {isOnline &&
          !currentAssignment &&
          availableAssignments.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8, opacity: 0.7 }}>
              <LocalShipping sx={{ fontSize: 80, color: "#e0e0e0", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No orders available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Waiting for new requests...
              </Typography>
            </Box>
          )}
      </Box>
    </Box>
  );

  // ─── History, Wallet & Profile State ───────────────────────────────
  const [historyData, setHistoryData] = useState({ deliveries: [], summary: {} });
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState({ isLinked: false });
  const [bankForm, setBankForm] = useState({ accountNumber: "", ifscCode: "", accountHolderName: "", bankName: "" });
  const [showBankForm, setShowBankForm] = useState(false);
  const [cashData, setCashData] = useState({ currentAmount: 0, limit: 5000, isAccountFrozen: false });
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);

  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });
  
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

  const handleUpdateManualAddress = async () => {
    setAddressUpdating(true);
    try {
      const coords = (addressForm.lon && addressForm.lat) 
        ? [parseFloat(addressForm.lon), parseFloat(addressForm.lat)] 
        : null;
        
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
        setNotification({ open: true, message: "Failed to update address", severity: "error" });
      }
    } catch (err) {
      console.error(err);
      setNotification({ open: true, message: "Error updating address", severity: "error" });
    } finally {
      setAddressUpdating(false);
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

  const fetchHistory = async (filter = "all") => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const data = await getDeliveryHistory({ filter: filter === "all" ? undefined : filter }, token);
      if (data.summary) {
        const deliveriesCount = data.summary.totalDeliveries || data.deliveries?.length || 0;
        const maxEarnings = Math.max(500, 500 * deliveriesCount);
        data.summary.totalEarnings = Math.min(maxEarnings, data.summary.totalEarnings || 0);
      }
      setHistoryData(data);
    } catch (e) { console.error("History fetch error:", e); }
    finally { setHistoryLoading(false); }
  };

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const [bankRes, cashRes] = await Promise.all([
        getBankAccount(token),
        getCashCollection(token),
      ]);
      setBankDetails(bankRes.bankDetails || { isLinked: false });
      setCashData(cashRes);
    } catch (e) { console.error("Wallet fetch error:", e); }
  };

  const handleLinkBank = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await linkBankAccount(bankForm, token);
      setBankDetails(res.bankDetails);
      setShowBankForm(false);
      alert("Bank account linked!");
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeposit = async () => {
    try {
      const token = localStorage.getItem("authToken");
      await recordCashDeposit(Number(depositAmount), token);
      setDepositDialogOpen(false);
      setDepositAmount("");
      fetchWalletData();
      alert("Deposit recorded!");
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    if (value === 1) fetchHistory(historyFilter);
    if (value === 2) fetchWalletData();
  }, [value]);

  const renderHistory = () => (
    <Box sx={{ pb: 10, bgcolor: "#F9FAFB", minHeight: "100vh" }}>
      {/* Premium Header */}
      <Box sx={{ 
        px: 2.5, 
        pt: "calc(env(safe-area-inset-top) + 20px)", 
        pb: 3, 
        background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)",
        borderBottom: "4px solid #8B5CF6",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton edge="start" sx={{ color: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" }} onClick={handleDrawerToggle}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="700" sx={{ color: "#ffffff" }}>
            Delivery History
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, pt: 3 }}>
        {/* Date Filter Segmented Control */}
        <Box sx={{ 
          display: "flex", 
          bgcolor: "#E5E7EB", 
          borderRadius: 1.5, 
          p: 0.5, 
          mb: 3,
          overflowX: "auto",
          "&::-webkit-scrollbar": { display: "none" }
        }}>
          {["all", "today", "week", "month"].map((f) => (
            <Button
              key={f}
              onClick={() => { setHistoryFilter(f); fetchHistory(f); }}
              disableElevation
              sx={{
                flex: 1,
                minWidth: "auto",
                px: 2,
                py: 0.75,
                borderRadius: 1,
                textTransform: "capitalize",
                fontWeight: historyFilter === f ? 700 : 600,
                color: historyFilter === f ? "#ffffff" : "#6B7280",
                bgcolor: historyFilter === f ? "#111827" : "transparent", // Almost black
                boxShadow: historyFilter === f ? "0 4px 10px rgba(0,0,0,0.25)" : "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": { 
                  bgcolor: historyFilter === f ? "#000000" : "rgba(0,0,0,0.05)",
                  transform: historyFilter === f ? "scale(1.02)" : "none"
                },
                "&:active": {
                  transform: "scale(0.95)"
                }
              }}
            >
              {f}
            </Button>
          ))}
        </Box>

        {/* Summary KPIs */}
        <Grid container spacing={1.5} sx={{ mb: 4 }}>
          {[
            { label: "Completed", value: historyData.summary?.completedDeliveries || 0, icon: <CheckCircle sx={{ fontSize: 16 }} />, color: "#10B981" },
            { label: "Earnings", value: `₹${historyData.summary?.totalEarnings || 0}`, icon: <CurrencyRupee sx={{ fontSize: 16 }} />, color: "#8B5CF6" },
            { label: "Distance", value: `${historyData.summary?.totalDistance || 0} km`, icon: <Directions sx={{ fontSize: 16 }} />, color: "#3B82F6" },
          ].map((s, i) => (
            <Grid item xs={4} key={i}>
              <Card sx={{ 
                borderRadius: 1.5, 
                bgcolor: "#ffffff", 
                border: "1px solid #E5E7EB", 
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center"
              }}>
                <CardContent sx={{ p: "12px !important", textAlign: "center" }}>
                  <Box sx={{ color: s.color, mb: 0.5, display: "flex", justifyContent: "center" }}>{s.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827", lineHeight: 1 }}>{s.value}</Typography>
                  <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: 0.5, mt: 0.5, display: "block" }}>{s.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {historyLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1, bgcolor: "#EDE9FE", "& .MuiLinearProgress-bar": { bgcolor: "#8B5CF6" } }} />}

        {/* Delivery Cards */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6D28D9", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Recent Activity
        </Typography>

        {historyData.deliveries?.length > 0 ? (
          <Stack spacing={1.5}>
            {historyData.deliveries.map((d, i) => {
              const isDelivered = d.status === "delivered";
              const isCancelled = d.status === "cancelled";
              return (
                <Card 
                  key={i} 
                  sx={{ 
                    borderRadius: 1.5, 
                    bgcolor: "#ffffff", 
                    border: "1px solid #E5E7EB",
                    borderLeft: `4px solid ${isDelivered ? "#10B981" : isCancelled ? "#EF4444" : "#F59E0B"}`,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}
                >
                  <CardContent sx={{ p: "16px !important" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, display: "block", mb: 0.2 }}>
                          ORDER ID
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#111827" }}>
                          #{d.order?.trackingNumber || (d.order?._id ? d.order._id.slice(-6).toUpperCase() : "N/A")}
                        </Typography>
                      </Box>
                      <Chip
                        label={d.status}
                        size="small"
                        sx={{ 
                          height: 22, 
                          borderRadius: 1,
                          fontSize: "0.65rem", 
                          fontWeight: 700, 
                          textTransform: "uppercase",
                          bgcolor: isDelivered ? "#ECFDF5" : isCancelled ? "#FEF2F2" : "#FFFBEB",
                          color: isDelivered ? "#059669" : isCancelled ? "#DC2626" : "#D97706",
                          border: `1px solid ${isDelivered ? "#A7F3D0" : isCancelled ? "#FECACA" : "#FDE68A"}`
                        }}
                      />
                    </Box>
                    
                    <Divider sx={{ my: 1.5, borderColor: "#F3F4F6" }} />
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#6B7280", display: "flex", alignItems: "center", gap: 0.5, fontWeight: 500 }}>
                          <CalendarToday sx={{ fontSize: 12 }} /> 
                          {d.order?.createdAt ? new Date(d.order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "---"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#4B5563", display: "flex", alignItems: "center", gap: 0.5, mt: 0.5, fontWeight: 600 }}>
                          <Store sx={{ fontSize: 12, color: "#8B5CF6" }} /> 
                          {d.vendor?.vendorProfile?.businessName || d.vendor?.name || "Vendor"}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, display: "block" }}>
                          FEE
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#059669" }}>
                          +₹{Math.min(500, d.deliveryFee || 50)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        ) : !historyLoading ? (
          <Box sx={{ textAlign: "center", py: 6, px: 2, bgcolor: "#ffffff", borderRadius: 1.5, border: "1px dashed #D1D5DB" }}>
            <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
              <HistoryIcon sx={{ fontSize: 32, color: "#9CA3AF" }} />
            </Box>
            <Typography variant="subtitle1" fontWeight="700" color="#374151" gutterBottom>
              No History Found
            </Typography>
            <Typography variant="body2" color="#6B7280">
              You haven't completed any deliveries for the selected time period yet.
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );

  const renderWallet = () => (
    <Box sx={{ pb: 10, bgcolor: "#F9FAFB", minHeight: "100vh" }}>
      {/* Premium Header */}
      <Box sx={{ 
        px: 2.5, 
        pt: "calc(env(safe-area-inset-top) + 20px)", 
        pb: 3, 
        background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)",
        borderBottom: "4px solid #8B5CF6",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton edge="start" sx={{ color: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" }} onClick={handleDrawerToggle}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="700" sx={{ color: "#ffffff" }}>
            Wallet
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, pt: 3 }}>
        {/* Account Frozen Banner */}
        <AnimatePresence>
          {cashData.isAccountFrozen && (
            <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 3 }}>
              <Card sx={{ bgcolor: "#FEF2F2", borderRadius: 1.5, borderLeft: "4px solid #EF4444", borderTop: "1px solid #FCA5A5", borderRight: "1px solid #FCA5A5", borderBottom: "1px solid #FCA5A5", boxShadow: "none" }}>
                <CardContent sx={{ p: "16px !important", display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Box sx={{ color: "#EF4444", mt: 0.5 }}>⚠️</Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="700" color="#991B1B">Account Frozen</Typography>
                    <Typography variant="body2" color="#B91C1C" sx={{ mt: 0.5 }}>
                      {cashData.frozenReason || "Cash collection limit exceeded. Please deposit immediately to unfreeze your account."}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </MotionBox>
          )}
        </AnimatePresence>

        {/* Total Balance Card (FinTech Style) */}
        <Card sx={{
          background: "linear-gradient(135deg, #111827 0%, #374151 100%)", 
          color: "white", 
          borderRadius: 1.5, 
          p: 3, 
          mb: 3,
          boxShadow: "0 10px 20px -5px rgba(0,0,0,0.3)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Decorative elements */}
          <Box sx={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <Box sx={{ position: "absolute", bottom: -20, right: 40, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="caption" sx={{ color: "#9CA3AF", fontWeight: 700, letterSpacing: 1 }}>TOTAL EARNINGS</Typography>
              <WalletIcon sx={{ color: "#6B7280" }} />
            </Box>
            <Typography variant="h3" fontWeight="800" sx={{ mb: 3, color: "#ffffff", display: "flex", alignItems: "center" }}>
              <span style={{ color: "#9CA3AF", fontSize: "1.8rem", marginRight: "4px" }}>₹</span>
              {earnings.monthly}
            </Typography>
            <Button variant="contained" disableElevation sx={{
              bgcolor: "#ffffff", color: "#111827",
              fontWeight: 700, borderRadius: 1, px: 3,
              "&:hover": { bgcolor: "#F3F4F6" }
            }}>
              Withdraw Funds
            </Button>
          </Box>
        </Card>

        {/* Cash Collection Card (Uber-style) */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6D28D9", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Cash Collection
        </Typography>
        <Card sx={{ borderRadius: 1.5, mb: 4, bgcolor: "#ffffff", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <CardContent sx={{ p: "20px !important" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CurrencyRupee sx={{ color: "#16A34A", fontSize: 18 }} />
                </Box>
                <Typography variant="subtitle2" fontWeight="700" color="#111827">Cash On Hand</Typography>
              </Box>
              <Chip
                label={cashData.isOverLimit ? "OVER LIMIT" : "WITHIN LIMIT"}
                size="small"
                sx={{ 
                  height: 22, fontSize: "0.65rem", fontWeight: 700, borderRadius: 1,
                  bgcolor: cashData.isOverLimit ? "#FEF2F2" : "#F0FDF4",
                  color: cashData.isOverLimit ? "#DC2626" : "#16A34A",
                  border: `1px solid ${cashData.isOverLimit ? "#FECACA" : "#BBF7D0"}`
                }}
              />
            </Stack>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h4" fontWeight="800" color={cashData.isOverLimit ? "#DC2626" : "#111827"}>
                ₹{cashData.currentAmount || 0}
              </Typography>
              <Typography variant="caption" color="#6B7280" fontWeight="600">
                Limit: ₹{cashData.limit || 5000}
              </Typography>
            </Box>

            {/* Progress Bar */}
            <LinearProgress
              variant="determinate"
              value={Math.min(100, ((cashData.currentAmount || 0) / (cashData.limit || 5000)) * 100)}
              sx={{
                height: 8, borderRadius: 1,
                bgcolor: "#F3F4F6",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 1,
                  bgcolor: (cashData.currentAmount || 0) >= 4000 ? "#DC2626" : (cashData.currentAmount || 0) >= 3000 ? "#F59E0B" : "#10B981",
                },
              }}
            />

            {/* Timer if over limit */}
            {cashData.hoursRemaining !== null && cashData.hoursRemaining !== undefined && (
              <Box sx={{ mt: 2, bgcolor: "#FFFBEB", borderLeft: "3px solid #F59E0B", borderRadius: 1, p: 1.5 }}>
                <Typography variant="body2" fontWeight="700" color="#B45309" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <AccessTime sx={{ fontSize: 16 }} /> {cashData.hoursRemaining}h remaining
                </Typography>
                <Typography variant="caption" color="#92400E" sx={{ mt: 0.5, display: "block" }}>
                  Deposit cash within {cashData.hoursRemaining} hours to prevent account freezing.
                </Typography>
              </Box>
            )}

            <Button
              fullWidth variant="contained" disableElevation
              disabled={!cashData.currentAmount || cashData.currentAmount === 0}
              onClick={() => setDepositDialogOpen(true)}
              sx={{ 
                mt: 3, borderRadius: 1, fontWeight: 700, py: 1.2,
                bgcolor: "#111827",
                "&:hover": { bgcolor: "#374151" },
                "&.Mui-disabled": { bgcolor: "#F3F4F6", color: "#9CA3AF" }
              }}
            >
              Deposit to Bank
            </Button>
          </CardContent>
        </Card>

        {/* Bank Account Section */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6D28D9", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Linked Bank Account
        </Typography>
        <Card sx={{ borderRadius: 1.5, mb: 4, bgcolor: "#ffffff", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <CardContent sx={{ p: "20px !important" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <WalletIcon sx={{ color: "#4B5563", fontSize: 18 }} />
                </Box>
                <Typography variant="subtitle2" fontWeight="700" color="#111827">Account Details</Typography>
              </Box>
              <Chip
                label={bankDetails.isLinked ? "LINKED" : "UNLINKED"}
                size="small"
                sx={{ 
                  height: 22, fontSize: "0.65rem", fontWeight: 700, borderRadius: 1,
                  bgcolor: bankDetails.isLinked ? "#ECFDF5" : "#F3F4F6",
                  color: bankDetails.isLinked ? "#059669" : "#6B7280",
                  border: `1px solid ${bankDetails.isLinked ? "#A7F3D0" : "#D1D5DB"}`
                }}
              />
            </Stack>

            {bankDetails.isLinked && !showBankForm ? (
              <Box sx={{ bgcolor: "#F9FAFB", p: 2, borderRadius: 1, border: "1px solid #F3F4F6" }}>
                <Typography variant="subtitle2" fontWeight="700" color="#111827" sx={{ mb: 0.5 }}>
                  {bankDetails.bankName}
                </Typography>
                <Typography variant="body2" color="#4B5563" sx={{ letterSpacing: 1, mb: 0.5 }}>
                  •••• •••• •••• {bankDetails.accountNumber?.slice(-4) || "XXXX"}
                </Typography>
                <Typography variant="caption" color="#6B7280" sx={{ display: "block", mb: 1 }}>
                  {bankDetails.accountHolderName} • IFSC: {bankDetails.ifscCode}
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => setShowBankForm(true)} 
                  sx={{ fontWeight: 700, color: "#6D28D9", p: 0, "&:hover": { bgcolor: "transparent", color: "#4C1D95" } }}
                >
                  Edit Details
                </Button>
              </Box>
            ) : (
              <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="bank-name-label" sx={{ "&.Mui-focused": { color: "#6D28D9" } }}>Select Bank</InputLabel>
                  <Select
                    labelId="bank-name-label"
                    value={bankForm.bankName}
                    label="Select Bank"
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    sx={{
                      borderRadius: 1,
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6D28D9" }
                    }}
                  >
                    {[
                      "State Bank of India",
                      "HDFC Bank",
                      "ICICI Bank",
                      "Axis Bank",
                      "Kotak Mahindra Bank",
                      "Punjab National Bank",
                      "Bank of Baroda",
                      "IndusInd Bank",
                      "Yes Bank",
                      "Union Bank of India"
                    ].map((bank) => (
                      <MenuItem key={bank} value={bank}>{bank}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth size="small" label="Account Number" value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1, "&.Mui-focused fieldset": { borderColor: "#6D28D9" } }, "& .MuiInputLabel-root.Mui-focused": { color: "#6D28D9" } }}
                />
                <TextField
                  fullWidth size="small" label="IFSC Code" value={bankForm.ifscCode}
                  onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1, "&.Mui-focused fieldset": { borderColor: "#6D28D9" } }, "& .MuiInputLabel-root.Mui-focused": { color: "#6D28D9" } }}
                />
                <TextField
                  fullWidth size="small" label="Account Holder Name" value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1, "&.Mui-focused fieldset": { borderColor: "#6D28D9" } }, "& .MuiInputLabel-root.Mui-focused": { color: "#6D28D9" } }}
                />

                <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                  {showBankForm && (
                    <Button variant="outlined" onClick={() => setShowBankForm(false)} sx={{ borderRadius: 1, fontWeight: 700, color: "#4B5563", borderColor: "#D1D5DB", flex: 1, "&:hover": { bgcolor: "#F9FAFB" } }}>Cancel</Button>
                  )}
                  <Button variant="contained" disableElevation onClick={handleLinkBank} sx={{ borderRadius: 1, fontWeight: 700, bgcolor: "#6D28D9", flex: 2, "&:hover": { bgcolor: "#4C1D95" } }}>
                    {bankDetails.isLinked ? "Save Changes" : "Link Account"}
                  </Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onClose={() => setDepositDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, width: "90%", maxWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Record Cash Deposit</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the amount you deposited to your linked bank account
          </Typography>
          <TextField
            fullWidth type="number" label="Deposit Amount (₹)"
            value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
            inputProps={{ max: cashData.currentAmount }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Available balance: ₹{cashData.currentAmount || 0}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDepositDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleDeposit}
            disabled={!depositAmount || Number(depositAmount) <= 0}>
            Confirm Deposit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderProfile = () => (
    <Box sx={{ pb: 10, bgcolor: "#F9FAFB", minHeight: "100vh" }}>
      {/* Premium Header */}
      <Box sx={{ 
        px: 2.5, 
        pt: "calc(env(safe-area-inset-top) + 20px)", 
        pb: 4, 
        background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)",
        borderBottom: "4px solid #8B5CF6",
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton edge="start" sx={{ color: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" }} onClick={handleDrawerToggle}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="700" sx={{ color: "#ffffff" }}>
            Profile
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, pt: 0, mt: -3 }}>
        {/* Profile Header Card */}
        <Card sx={{
          background: "linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)", 
          borderRadius: 1.5, p: 3, mb: 3, textAlign: "center",
          boxShadow: "0 8px 24px rgba(76, 29, 149, 0.25)", border: "none",
          position: "relative", overflow: "hidden"
        }}>
          {/* Subtle background decoration */}
          <Box sx={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          
          <Avatar
            variant="rounded"
            src={user?.avatar}
            sx={{
              width: 80, height: 80, margin: "0 auto", mb: 2,
              borderRadius: 1.5,
              border: "3px solid rgba(255,255,255,0.5)", 
              bgcolor: "rgba(255,255,255,0.2)",
              color: "#ffffff",
              backdropFilter: "blur(10px)"
            }}
          >
            <PersonOutline sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" fontWeight="800" color="#ffffff">{user?.name || "Delivery Partner"}</Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mb: 2, fontWeight: 500 }}>{user?.email}</Typography>
          
          <Stack direction="row" spacing={1} justifyContent="center">
            <Chip
              label="DELIVERY PARTNER"
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#ffffff", fontWeight: 700, borderRadius: 1, letterSpacing: 0.5, border: "1px solid rgba(255,255,255,0.3)" }}
            />
            <Chip
              label={user?.deliveryProfile?.verificationStatus === "verified" ? "VERIFIED" : "PENDING"}
              size="small"
              sx={{
                bgcolor: user?.deliveryProfile?.verificationStatus === "verified" ? "rgba(22, 163, 74, 0.8)" : "rgba(202, 138, 4, 0.8)",
                color: "#ffffff", 
                fontWeight: 700, borderRadius: 1, letterSpacing: 0.5,
                border: "1px solid rgba(255,255,255,0.3)"
              }}
            />
          </Stack>
        </Card>

        {/* Performance Stats */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6D28D9", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Performance Overview
        </Typography>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {[
            { label: "Deliveries", value: user?.deliveryProfile?.totalDeliveries || 0, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
            { label: "Rating", value: `${user?.deliveryProfile?.rating?.average?.toFixed(1) || "5.0"} ⭐`, color: "#D97706", bg: "#FEF3C7", border: "#FDE68A" },
            { label: "Success", value: `${user?.deliveryProfile?.successRate || 100}%`, color: "#16A34A", bg: "#DCFCE7", border: "#BBF7D0" },
            { label: "Earnings", value: `₹${earnings.monthly || 0}`, color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
          ].map((s, i) => (
            <Grid item xs={6} key={i}>
              <Card sx={{ 
                borderRadius: 1.5, bgcolor: isDark ? "#1e1e1e" : s.bg, 
                border: `1px solid ${s.border}`,
                textAlign: "center", p: 2, boxShadow: "none" 
              }}>
                <Typography variant="h5" fontWeight="900" color={s.color}>{s.value}</Typography>
                <Typography variant="caption" fontWeight="700" color={s.color} sx={{ opacity: 0.8, textTransform: "uppercase" }}>{s.label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Personal Info */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6D28D9", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Personal Details
        </Typography>
        <Card sx={{ borderRadius: 1.5, mb: 3, bgcolor: "#ffffff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <List disablePadding>
            {[
              { icon: <PersonOutline sx={{ color: "#6B7280" }} />, label: "Full Name", value: user?.name },
              { icon: <EmailOutlined sx={{ color: "#6B7280" }} />, label: "Email Address", value: user?.email },
              { icon: <PhoneOutlined sx={{ color: "#6B7280" }} />, label: "Mobile Number", value: user?.phone },
            ].map((item, i) => (
              <React.Fragment key={i}>
                <ListItem sx={{ py: 1.5, px: 2 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="caption" fontWeight="600" color="#6B7280">{item.label}</Typography>}
                    secondary={<Typography variant="body2" fontWeight="700" color="#111827">{item.value || "Not set"}</Typography>}
                  />
                </ListItem>
                {i < 2 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>

        {/* Vehicle Details */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6D28D9", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Vehicle Information
        </Typography>
        <Card sx={{ borderRadius: 1.5, mb: 3, bgcolor: "#ffffff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <List disablePadding>
            {[
              { icon: <TwoWheeler sx={{ color: "#6B7280" }} />, label: "Vehicle Type", value: user?.deliveryProfile?.vehicleType?.toUpperCase() },
              { icon: <ConfirmationNumber sx={{ color: "#6B7280" }} />, label: "Registration Number", value: user?.deliveryProfile?.vehicleNumber },
              { icon: <BadgeOutlined sx={{ color: "#6B7280" }} />, label: "Driving License", value: user?.deliveryProfile?.licenseNumber },
            ].map((item, i) => (
              <React.Fragment key={i}>
                <ListItem sx={{ py: 1.5, px: 2 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="caption" fontWeight="600" color="#6B7280">{item.label}</Typography>}
                    secondary={<Typography variant="body2" fontWeight="700" color="#111827">{item.value || "Not provided"}</Typography>}
                  />
                </ListItem>
                {i < 2 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>

        {/* Quick Actions */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6D28D9", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Settings & Actions
        </Typography>
        <Card sx={{ borderRadius: 1.5, mb: 4, bgcolor: "#ffffff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <List disablePadding>
            <ListItemButton onClick={() => setValue(2)} sx={{ py: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}><WalletIcon sx={{ color: "#4C1D95" }} /></ListItemIcon>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="700" color="#111827">Bank Account</Typography>}
                secondary={<Typography variant="caption" color="#6B7280">{bankDetails.isLinked ? `${bankDetails.bankName} • ****${bankDetails.accountNumber?.slice(-4)}` : "Not linked yet"}</Typography>}
              />
              <ChevronRight sx={{ color: "#9CA3AF" }} />
            </ListItemButton>
            <Divider />
            
            <ListItemButton onClick={handleUpdateLocation} disabled={updatingLocation} sx={{ py: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}><GpsFixed sx={{ color: "#2563EB" }} /></ListItemIcon>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="700" color="#111827">{updatingLocation ? "Detecting..." : "Live GPS Sync"}</Typography>}
                secondary={<Typography variant="caption" color="#6B7280">Update your current coordinates</Typography>}
              />
              <ChevronRight sx={{ color: "#9CA3AF" }} />
            </ListItemButton>
            <Divider />

            <ListItemButton onClick={() => setAddressDialogOpen(true)} disabled={updatingLocation} sx={{ py: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}><LocationOn sx={{ color: "#D97706" }} /></ListItemIcon>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="700" color="#111827">Manual Address</Typography>}
                secondary={<Typography variant="caption" color="#6B7280">Edit exact location details</Typography>}
              />
              <ChevronRight sx={{ color: "#9CA3AF" }} />
            </ListItemButton>
          </List>
        </Card>

        {/* Logout */}
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={logout}
          startIcon={<ExitToApp />}
          sx={{ 
            borderRadius: 1.5, py: 1.5, fontWeight: 800, mb: 4,
            borderWidth: 2, "&:hover": { borderWidth: 2, bgcolor: "#FEF2F2" }
          }}
        >
          LOG OUT SECURELY
        </Button>
      </Box>
    </Box>
  );

  const renderSettings = () => (
    <Box sx={{ pb: 10, bgcolor: "#F9FAFB", minHeight: "100vh" }}>
      {/* Premium Header */}
      <Box sx={{ 
        px: 2.5, 
        pt: "calc(env(safe-area-inset-top) + 20px)", 
        pb: 3, 
        background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)",
        borderBottom: "4px solid #8B5CF6",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton edge="start" sx={{ color: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" }} onClick={handleDrawerToggle}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="700" sx={{ color: "#ffffff" }}>
            {t("settings")}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, pt: 3 }}>
        
        {/* Account Settings */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6D28D9", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Account Settings
        </Typography>
        <Card sx={{ borderRadius: 1.5, mb: 4, bgcolor: "#ffffff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <List disablePadding>
            <ListItemButton sx={{ py: 1.5, px: 2 }} onClick={() => setValue(3)}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#E0E7FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ProfileIcon sx={{ color: "#4F46E5", fontSize: 20 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="700" color="#111827">Personal Profile</Typography>}
                secondary={<Typography variant="caption" color="#6B7280">Update name, phone, and vehicle</Typography>}
              />
              <ChevronRight sx={{ color: "#9CA3AF" }} />
            </ListItemButton>
            <Divider component="li" />
            <ListItemButton sx={{ py: 1.5, px: 2 }} onClick={() => setSecurityDialogOpen(true)}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Security sx={{ color: "#EF4444", fontSize: 20 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="700" color="#111827">Security & Password</Typography>}
                secondary={<Typography variant="caption" color="#6B7280">Change PIN and biometrics</Typography>}
              />
              <ChevronRight sx={{ color: "#9CA3AF" }} />
            </ListItemButton>
          </List>
        </Card>

        {/* Preferences */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6D28D9", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          App Preferences
        </Typography>
        <Card sx={{ borderRadius: 1.5, mb: 4, bgcolor: "#ffffff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <List disablePadding>
            <ListItem sx={{ py: 1.5, px: 2 }}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isDark ? <DarkMode sx={{ color: "#D97706", fontSize: 20 }} /> : <LightMode sx={{ color: "#D97706", fontSize: 20 }} />}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="700" color="#111827">Dark Mode</Typography>}
                secondary={<Typography variant="caption" color="#6B7280">{isDark ? "Enabled" : "Disabled"}</Typography>}
              />
              <Switch 
                checked={isDark} 
                onChange={toggleTheme} 
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#6D28D9" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#6D28D9" },
                }}
              />
            </ListItem>
            <Divider component="li" />
            
            <ListItem sx={{ py: 1.5, px: 2 }}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Notifications sx={{ color: "#16A34A", fontSize: 20 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="700" color="#111827">Push Notifications</Typography>}
                secondary={<Typography variant="caption" color="#6B7280">Receive order alerts instantly</Typography>}
              />
              <Switch 
                checked={pushEnabled}
                onChange={() => {
                  setPushEnabled(!pushEnabled);
                  handleSnackbar(pushEnabled ? "Push Notifications Disabled" : "Push Notifications Enabled");
                }}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#6D28D9" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#6D28D9" },
                }}
              />
            </ListItem>
            <Divider component="li" />

            <ListItemButton sx={{ py: 1.5, px: 2 }} onClick={() => setLanguageDialogOpen(true)}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#F3E8FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Language sx={{ color: "#9333EA", fontSize: 20 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="700" color="#111827">Language</Typography>}
                secondary={<Typography variant="caption" color="#6B7280">{language}</Typography>}
              />
              <ChevronRight sx={{ color: "#9CA3AF" }} />
            </ListItemButton>
          </List>
        </Card>

        {/* Navigation & Maps */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6D28D9", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Navigation
        </Typography>
        <Card sx={{ borderRadius: 1.5, mb: 4, bgcolor: "#ffffff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <List disablePadding>
            <ListItemButton sx={{ py: 1.5, px: 2 }} onClick={() => setNavigationDialogOpen(true)}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Map sx={{ color: "#0284C7", fontSize: 20 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="700" color="#111827">Default Navigation App</Typography>}
                secondary={<Typography variant="caption" color="#6B7280">{navigationApp}</Typography>}
              />
              <ChevronRight sx={{ color: "#9CA3AF" }} />
            </ListItemButton>
            <Divider component="li" />
            <ListItem sx={{ py: 1.5, px: 2 }}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#FFE4E6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AutoMode sx={{ color: "#E11D48", fontSize: 20 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="700" color="#111827">Auto-Navigate</Typography>}
                secondary={<Typography variant="caption" color="#6B7280">Start route on order accept</Typography>}
              />
              <Switch 
                checked={autoNavEnabled}
                onChange={() => {
                  setAutoNavEnabled(!autoNavEnabled);
                  handleSnackbar(autoNavEnabled ? "Auto-Navigate Disabled" : "Auto-Navigate Enabled");
                }}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#6D28D9" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#6D28D9" },
                }}
              />
            </ListItem>
          </List>
        </Card>

        {/* Support & Info */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#6D28D9", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Support & Info
        </Typography>
        <Card sx={{ borderRadius: 1.5, mb: 4, bgcolor: "#ffffff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <List disablePadding>
            <ListItemButton sx={{ py: 1.5, px: 2 }} onClick={() => setHelpDialogOpen(true)}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#ECFCCB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SupportAgent sx={{ color: "#65A30D", fontSize: 20 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="700" color="#111827">Help Center</Typography>}
                secondary={<Typography variant="caption" color="#6B7280">24/7 partner support</Typography>}
              />
              <ChevronRight sx={{ color: "#9CA3AF" }} />
            </ListItemButton>
            <Divider component="li" />
            <ListItemButton sx={{ py: 1.5, px: 2 }} onClick={() => setPrivacyDialogOpen(true)}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PrivacyTip sx={{ color: "#4B5563", fontSize: 20 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight="700" color="#111827">Privacy Policy</Typography>}
                secondary={<Typography variant="caption" color="#6B7280">How we handle your data</Typography>}
              />
              <ChevronRight sx={{ color: "#9CA3AF" }} />
            </ListItemButton>
          </List>
        </Card>

        <Box sx={{ mt: 2, mb: 4, textAlign: "center" }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: "#EEDEFF", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1 }}>
            <LocalShipping sx={{ color: "#6D28D9", fontSize: 24 }} />
          </Box>
          <Typography variant="subtitle2" fontWeight="800" color="#4B5563">
            Agrokart Delivery
          </Typography>
          <Typography variant="caption" color="#9CA3AF" fontWeight="600" letterSpacing={0.5}>
            VERSION 1.0.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        bgcolor: bgColor,
        minHeight: "100vh",
        flexDirection: "column",
      }}
    >
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { sm: 280 }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: 280,
              bgcolor: cardBg,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, width: "100%", mb: 7 }}>
        {value === 0 && renderDashboard()}
        {value === 1 && renderHistory()}
        {value === 2 && renderWallet()}
        {value === 3 && renderProfile()}
        {value === 4 && renderSettings()}
      </Box>

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

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          bgcolor: bottomNavBg,
          pb: "env(safe-area-inset-bottom)", // Adjust for Vivo V20 gesture bar
        }}
        elevation={3}
      >
        <BottomNavigation
          value={value}
          onChange={(event, newValue) => setValue(newValue)}
          showLabels
          sx={{ bgcolor: bottomNavBg }}
        >
          <BottomNavigationAction
            label={t("dashboard")}
            icon={<Home />}
            sx={{
              color: textSecondary,
              "&.Mui-selected": { color: isDark ? AMBER_ACCENT : "#6A1B9A" },
            }}
          />
          <BottomNavigationAction
            label={t("history")}
            icon={<HistoryIcon />}
            sx={{
              color: textSecondary,
              "&.Mui-selected": { color: isDark ? AMBER_ACCENT : "#6A1B9A" },
            }}
          />
          <BottomNavigationAction
            label={t("wallet")}
            icon={<WalletIcon />}
            sx={{
              color: textSecondary,
              "&.Mui-selected": { color: isDark ? AMBER_ACCENT : "#6A1B9A" },
            }}
          />
          <BottomNavigationAction
            label={t("profile")}
            icon={<ProfileIcon />}
            sx={{
              color: textSecondary,
              "&.Mui-selected": { color: isDark ? AMBER_ACCENT : "#6A1B9A" },
            }}
          />
        </BottomNavigation>
      </Paper>

      {/* Notification Dialog */}
      <Dialog
        open={!!newOrderNotification}
        onClose={handleRejectOrder}
        PaperProps={{
          sx: {
            borderRadius: 4,
            width: "100%",
            m: 2,
            bgcolor: isDark ? "#2C2C2C" : "white",
            color: textColor,
          },
        }}
      >
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <LocalShipping
            sx={{
              fontSize: 60,
              mb: 2,
              color: isDark ? AMBER_ACCENT : "#6A1B9A",
            }}
          />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            New Delivery Request!
          </Typography>
          <Typography
            variant="h4"
            sx={{ color: isDark ? AMBER_ACCENT : "#6A1B9A" }}
            fontWeight="bold"
          >
            ₹
            {Math.min(500, newOrderNotification?.earnings || newOrderNotification?.deliveryFee || 50)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {newOrderNotification?.distance || "-- km"} |{" "}
            {newOrderNotification?.estimatedDuration || "~20"} min
          </Typography>
          <Box
            sx={{
              bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5",
              p: 2,
              borderRadius: 2,
              textAlign: "left",
              mb: 3,
            }}
          >
            <Typography
              variant="caption"
              fontWeight="bold"
              color="text.secondary"
            >
              PICKUP:
            </Typography>
            <Typography variant="body2" noWrap sx={{ mb: 1 }}>
              {newOrderNotification?.vendorShopName ||
                newOrderNotification?.pickupLocation?.street ||
                newOrderNotification?.pickupLocation?.address?.street ||
                newOrderNotification?.pickupLocation?.city ||
                "Vendor Location"}
            </Typography>
            <Typography
              variant="caption"
              fontWeight="bold"
              color="text.secondary"
            >
              DROP:
            </Typography>
            <Typography variant="body2" noWrap>
              {newOrderNotification?.dropLocation?.street ||
                newOrderNotification?.dropLocation?.city ||
                newOrderNotification?.deliveryLocation?.address?.street ||
                "Customer Location"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleRejectOrder}
              sx={{
                borderRadius: 2,
                borderColor: isDark ? "white" : "rgba(0,0,0,0.23)",
                color: textColor,
              }}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleAcceptOrder}
              sx={{ borderRadius: 2, background: PURPLE_GRADIENT }}
            >
              Accept
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Delivery PIN Dialog */}
      <Dialog
        open={pinDialogOpen}
        onClose={() => setPinDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 4, bgcolor: cardBg, color: textColor },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
          Enter Delivery PIN
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Ask the customer for the 4-digit PIN to confirm delivery.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            value={deliveryPin}
            onChange={(e) =>
              setDeliveryPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
            }
            placeholder="0000"
            inputProps={{
              style: {
                textAlign: "center",
                fontSize: "2rem",
                letterSpacing: "0.5rem",
                color: textColor,
              },
            }}
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5",
                "& fieldset": {
                  borderColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.1)",
                },
                "&:hover fieldset": {
                  borderColor: isDark ? AMBER_ACCENT : "#6A1B9A",
                },
                "&.Mui-focused fieldset": {
                  borderColor: isDark ? AMBER_ACCENT : "#6A1B9A",
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: "center" }}>
          <Button
            onClick={() => setPinDialogOpen(false)}
            sx={{ color: "text.secondary", mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeliverWithPin}
            disabled={deliveryPin.length !== 4}
            sx={{
              background: PURPLE_GRADIENT,
              borderRadius: 3,
              px: 4,
              py: 1,
            }}
          >
            Verify & Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pickup PIN Dialog */}
      <Dialog
        open={pickupPinDialogOpen}
        onClose={() => setPickupPinDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 4, bgcolor: cardBg, color: textColor },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
          Verify Pickup PIN
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Ask the vendor for the 4-digit Pickup PIN to confirm collection.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            value={vendorPickupPin}
            onChange={(e) =>
              setVendorPickupPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
            }
            placeholder="0000"
            inputProps={{
              style: {
                textAlign: "center",
                fontSize: "2rem",
                letterSpacing: "0.5rem",
                color: textColor,
              },
            }}
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5",
                "& fieldset": {
                  borderColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.1)",
                },
                "&:hover fieldset": {
                  borderColor: isDark ? AMBER_ACCENT : "#6A1B9A",
                },
                "&.Mui-focused fieldset": {
                  borderColor: isDark ? AMBER_ACCENT : "#6A1B9A",
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: "center" }}>
          <Button
            onClick={() => setPickupPinDialogOpen(false)}
            sx={{ color: "text.secondary", mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePickupWithPin}
            disabled={vendorPickupPin.length !== 4}
            sx={{
              background: PURPLE_GRADIENT,
              borderRadius: 3,
              px: 4,
              py: 1,
            }}
          >
            Confirm Pickup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Address Update Dialog */}
      <Dialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: "bold", color: textColor }}>Update Address & Location</DialogTitle>
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
            disabled={addressUpdating}
            sx={{ borderRadius: 2, background: PURPLE_GRADIENT, color: "white" }}
          >
            {addressUpdating ? "Saving..." : "Save Address"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialogs */}
      <Dialog open={languageDialogOpen} onClose={() => setLanguageDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, width: "90%", maxWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Select Language</DialogTitle>
        <DialogContent>
          <RadioGroup value={language} onChange={(e) => setLanguage(e.target.value)}>
            <FormControlLabel value="English (US)" control={<Radio color="secondary" />} label="English (US)" />
            <FormControlLabel value="Hindi (हिंदी)" control={<Radio color="secondary" />} label="Hindi (हिंदी)" />
            <FormControlLabel value="Marathi (मराठी)" control={<Radio color="secondary" />} label="Marathi (मराठी)" />
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLanguageDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: "#6D28D9", color: "white" }} onClick={() => setLanguageDialogOpen(false)}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={navigationDialogOpen} onClose={() => setNavigationDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, width: "90%", maxWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Navigation App</DialogTitle>
        <DialogContent>
          <RadioGroup value={navigationApp} onChange={(e) => setNavigationApp(e.target.value)}>
            <FormControlLabel value="Google Maps" control={<Radio color="secondary" />} label="Google Maps" />
            <FormControlLabel value="Waze" control={<Radio color="secondary" />} label="Waze" />
            <FormControlLabel value="Apple Maps" control={<Radio color="secondary" />} label="Apple Maps" />
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNavigationDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: "#6D28D9", color: "white" }} onClick={() => setNavigationDialogOpen(false)}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={securityDialogOpen} onClose={() => setSecurityDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, width: "90%", maxWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Security & Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Update your app login PIN to keep your account secure.
          </Typography>
          <TextField fullWidth type="password" label="Current PIN" size="small" sx={{ mb: 2 }} value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} />
          <TextField fullWidth type="password" label="New PIN" size="small" sx={{ mb: 2 }} value={newPin} onChange={(e) => setNewPin(e.target.value)} />
          <TextField fullWidth type="password" label="Confirm New PIN" size="small" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSecurityDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: "#6D28D9", color: "white" }} onClick={() => {
            if (!currentPin || !newPin || !confirmPin) {
              handleSnackbar("Please fill all fields.");
              return;
            }
            if (newPin !== confirmPin) {
              handleSnackbar("New PINs do not match.");
              return;
            }
            setSecurityDialogOpen(false);
            setCurrentPin("");
            setNewPin("");
            setConfirmPin("");
            handleSnackbar("PIN updated successfully.");
          }}>Update PIN</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, width: "90%", maxWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Help Center</DialogTitle>
        <DialogContent>
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>Need assistance?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Our partner support team is available 24/7 to help you with active orders, account issues, or payment queries.
          </Typography>
          <Button fullWidth variant="outlined" startIcon={<PhoneOutlined />} sx={{ mb: 1.5, py: 1.5, borderRadius: 2 }}>Call Support</Button>
          <Button fullWidth variant="outlined" startIcon={<EmailOutlined />} sx={{ py: 1.5, borderRadius: 2 }}>Email Support</Button>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHelpDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={privacyDialogOpen} onClose={() => setPrivacyDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, width: "90%", maxWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Privacy Policy</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Agrokart collects location data to enable order tracking, distance calculations, and delivery assignments even when the app is closed or not in use.
            <br/><br/>
            Your data is encrypted and securely stored. We do not share your exact location with third parties beyond what is necessary to fulfill orders.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" sx={{ bgcolor: "#6D28D9", color: "white" }} onClick={() => setPrivacyDialogOpen(false)}>I Understand</Button>
        </DialogActions>
      </Dialog>

      {/* Global Snackbar for User Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      />
    </Box>
  );
};

export default MobileDeliveryDashboard;
