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
} from "@mui/material";
import {
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
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ 
          background: PURPLE_GRADIENT,
          pt: "env(safe-area-inset-top)", // Adjust for Vivo V20 notch
        }}
      >
        <Toolbar sx={{ minHeight: 70 }}>
          <IconButton edge="start" color="inherit" onClick={handleDrawerToggle}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, ml: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              Agrokart
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Delivery Partner
              </Typography>
              {gpsStatus === "active" ? (
                <GpsFixed sx={{ fontSize: 14, color: "#00E676" }} />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    bgcolor: "rgba(255,0,0,0.2)",
                    px: 0.5,
                    borderRadius: 1,
                  }}
                >
                  <LocationOn sx={{ fontSize: 14, color: "#FF5252" }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#FF5252",
                      fontWeight: "bold",
                      fontSize: "0.6rem",
                    }}
                  >
                    GPS OFF
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={newOrderNotification ? 1 : 0} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              px: 2,
              py: 0.5,
              borderRadius: 20,
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: isOnline ? "#00E676" : "#FF5252",
                boxShadow: isOnline ? "0 0 10px #00E676" : "none",
              }}
            />
            <Typography
              variant="button"
              fontWeight="bold"
              sx={{ fontSize: "0.75rem" }}
            >
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Typography>
            <Switch
              size="small"
              checked={isOnline}
              onChange={handleOnlineToggle}
              color="default"
              sx={{
                "& .MuiSwitch-track": { bgcolor: "rgba(255,255,255,0.5)" },
              }}
            />
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2 }}>
        {/* Offline State */}
        <AnimatePresence>
          {!isOnline && (
            <MotionBox
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card
                sx={{
                  bgcolor: isDark ? "rgba(244, 67, 54, 0.1)" : "#ffebee",
                  color: "#c62828",
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: "none",
                  border: "1px solid #ffcdd2",
                }}
              >
                <CardContent
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  <Notifications sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      You are Offline
                    </Typography>
                    <Typography variant="body2">
                      Go online to start receiving assignments.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </MotionBox>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        {isOnline && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Card
                sx={{
                  bgcolor: cardBg,
                  color: textColor,
                  p: 1,
                  borderRadius: 3,
                  boxShadow: isDark
                    ? "0 4px 12px rgba(0,0,0,0.4)"
                    : "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="bold"
                  >
                    TODAY'S EARNINGS
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ color: isDark ? AMBER_ACCENT : "#6A1B9A" }}
                    fontWeight="bold"
                  >
                    ₹{earnings.daily}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    Today
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card
                sx={{
                  bgcolor: cardBg,
                  color: textColor,
                  p: 1,
                  borderRadius: 3,
                  boxShadow: isDark
                    ? "0 4px 12px rgba(0,0,0,0.4)"
                    : "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="bold"
                  >
                    DELIVERIES
                  </Typography>
                  <Typography variant="h5" color="secondary" fontWeight="bold">
                    {earnings.todayDeliveries}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    Today
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
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
    <Box sx={{ p: 2 }}>
      <AppBar position="static" elevation={0} color="transparent">
        <Toolbar>
          <IconButton edge="start" onClick={handleDrawerToggle} sx={{ color: textColor }}><MenuIcon /></IconButton>
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1, color: textColor }}>Delivery History</Typography>
        </Toolbar>
      </AppBar>

      {/* Summary Cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: "Completed", value: historyData.summary?.completedDeliveries || 0, color: "#2E7D32", bg: "#E8F5E9" },
          { label: "Earnings", value: `₹${historyData.summary?.totalEarnings || 0}`, color: "#1565C0", bg: "#E3F2FD" },
          { label: "Distance", value: `${historyData.summary?.totalDistance || 0} km`, color: "#E65100", bg: "#FFF3E0" },
        ].map((s, i) => (
          <Grid item xs={4} key={i}>
            <Card sx={{ borderRadius: 3, bgcolor: isDark ? "#1e1e1e" : s.bg, textAlign: "center", p: 1.5, boxShadow: "none" }}>
              <Typography variant="h6" fontWeight="900" color={s.color}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Date Filter */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, overflowX: "auto", pb: 1 }}>
        {["all", "today", "week", "month"].map((f) => (
          <Chip
            key={f}
            label={f.charAt(0).toUpperCase() + f.slice(1)}
            onClick={() => { setHistoryFilter(f); fetchHistory(f); }}
            variant={historyFilter === f ? "filled" : "outlined"}
            color={historyFilter === f ? "primary" : "default"}
            sx={{ fontWeight: "bold" }}
          />
        ))}
      </Stack>

      {historyLoading ? <LinearProgress sx={{ mb: 2 }} /> : null}

      {/* Delivery Cards */}
      {historyData.deliveries?.length > 0 ? (
        historyData.deliveries.map((d, i) => (
          <Card key={i} sx={{ borderRadius: 3, mb: 1.5, bgcolor: cardBg, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold" color={textColor}>
                  #{d.order?.trackingNumber || "N/A"}
                </Typography>
                <Chip
                  label={d.status}
                  size="small"
                  color={d.status === "delivered" ? "success" : d.status === "cancelled" ? "error" : "warning"}
                  sx={{ fontWeight: "bold", textTransform: "capitalize" }}
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {d.order?.createdAt ? new Date(d.order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "---"}
                </Typography>
                <Typography variant="subtitle2" fontWeight="bold" color="#2E7D32">
                  +₹{Math.min(500, d.deliveryFee || 50)}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {d.vendor?.vendorProfile?.businessName || d.vendor?.name || "Vendor"} → Customer
              </Typography>
            </CardContent>
          </Card>
        ))
      ) : !historyLoading ? (
        <Card sx={{ borderRadius: 3, boxShadow: "none", border: "1px solid #eee", p: 4, textAlign: "center", bgcolor: cardBg }}>
          <Typography color="text.secondary">No delivery history yet</Typography>
        </Card>
      ) : null}
    </Box>
  );

  const renderWallet = () => (
    <Box sx={{ p: 2 }}>
      <AppBar position="static" elevation={0} color="transparent">
        <Toolbar>
          <IconButton edge="start" onClick={handleDrawerToggle} sx={{ color: textColor }}><MenuIcon /></IconButton>
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1, color: textColor }}>Wallet</Typography>
        </Toolbar>
      </AppBar>

      {/* Account Frozen Banner */}
      {cashData.isAccountFrozen && (
        <Card sx={{ bgcolor: "#FFEBEE", borderRadius: 3, p: 2, mb: 2, border: "2px solid #EF5350" }}>
          <Typography variant="subtitle2" fontWeight="bold" color="error">⚠️ Account Frozen</Typography>
          <Typography variant="body2" color="error.dark">
            {cashData.frozenReason || "Cash collection limit exceeded. Please deposit immediately."}
          </Typography>
        </Card>
      )}

      {/* Total Balance Card */}
      <Card sx={{
        background: PURPLE_GRADIENT, color: "white", borderRadius: 4, p: 3, mb: 2,
        boxShadow: isDark ? "0 8px 24px rgba(106,27,154,0.4)" : "0 8px 24px rgba(33,150,243,0.3)",
      }}>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>TOTAL BALANCE</Typography>
        <Typography variant="h3" fontWeight="bold" sx={{ my: 1, color: isDark ? AMBER_ACCENT : "white" }}>
          ₹{earnings.monthly}
        </Typography>
        <Button variant="contained" sx={{
          bgcolor: isDark ? "#424242" : "white", color: isDark ? "white" : "#6A1B9A",
          fontWeight: "bold", mt: 1, borderRadius: 2,
        }}>Withdraw</Button>
      </Card>

      {/* Cash Collection Card (Uber-style ₹5000 limit) */}
      <Card sx={{ borderRadius: 3, mb: 2, bgcolor: cardBg, overflow: "hidden" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" color={textColor}>💵 Cash On Hand</Typography>
            <Chip
              label={cashData.isOverLimit ? "⚠️ Over Limit" : "Within Limit"}
              size="small"
              color={cashData.isOverLimit ? "error" : "success"}
              sx={{ fontWeight: "bold" }}
            />
          </Stack>

          <Typography variant="h4" fontWeight="900" color={cashData.isOverLimit ? "#D32F2F" : "#2E7D32"}>
            ₹{cashData.currentAmount || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Limit: ₹{cashData.limit || 5000}
          </Typography>

          {/* Progress Bar */}
          <LinearProgress
            variant="determinate"
            value={Math.min(100, ((cashData.currentAmount || 0) / (cashData.limit || 5000)) * 100)}
            sx={{
              mt: 1.5, height: 10, borderRadius: 5,
              bgcolor: isDark ? "#333" : "#eee",
              "& .MuiLinearProgress-bar": {
                borderRadius: 5,
                bgcolor: (cashData.currentAmount || 0) >= 4000 ? "#D32F2F" : (cashData.currentAmount || 0) >= 3000 ? "#FF9800" : "#4CAF50",
              },
            }}
          />

          {/* Timer if over limit */}
          {cashData.hoursRemaining !== null && cashData.hoursRemaining !== undefined && (
            <Card sx={{ mt: 2, bgcolor: "#FFF3E0", borderRadius: 2, p: 1.5 }}>
              <Typography variant="body2" fontWeight="bold" color="#E65100">
                ⏱ {cashData.hoursRemaining}h remaining to deposit
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Account will freeze if not deposited within 24 hours
              </Typography>
            </Card>
          )}

          <Button
            fullWidth variant="contained" color="warning"
            disabled={!cashData.currentAmount || cashData.currentAmount === 0}
            onClick={() => setDepositDialogOpen(true)}
            sx={{ mt: 2, borderRadius: 2, fontWeight: "bold", textTransform: "none" }}
          >
            Deposit to Bank Account
          </Button>
        </CardContent>
      </Card>

      {/* Bank Account Section */}
      <Card sx={{ borderRadius: 3, mb: 2, bgcolor: cardBg }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" color={textColor}>🏦 Bank Account</Typography>
            <Chip
              label={bankDetails.isLinked ? "Linked ✓" : "Not Linked"}
              size="small"
              color={bankDetails.isLinked ? "success" : "default"}
              sx={{ fontWeight: "bold" }}
            />
          </Stack>

          {bankDetails.isLinked && !showBankForm ? (
            <Box>
              <Typography variant="body2" color="text.secondary">
                {bankDetails.bankName} • ****{bankDetails.accountNumber?.slice(-4)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {bankDetails.accountHolderName} • IFSC: {bankDetails.ifscCode}
              </Typography>
              <Button size="small" onClick={() => setShowBankForm(true)} sx={{ mt: 1 }}>
                Update
              </Button>
            </Box>
          ) : (
            <Box>
              <TextField
                fullWidth size="small" label="Account Number" value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                sx={{ mb: 1.5 }}
              />
              <TextField
                fullWidth size="small" label="IFSC Code" value={bankForm.ifscCode}
                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                sx={{ mb: 1.5 }}
              />
              <TextField
                fullWidth size="small" label="Account Holder Name" value={bankForm.accountHolderName}
                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                sx={{ mb: 1.5 }}
              />
              <TextField
                fullWidth size="small" label="Bank Name" value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                sx={{ mb: 1.5 }}
              />
              <Stack direction="row" spacing={1}>
                {showBankForm && (
                  <Button variant="outlined" onClick={() => setShowBankForm(false)}>Cancel</Button>
                )}
                <Button variant="contained" onClick={handleLinkBank} sx={{ fontWeight: "bold" }}>
                  {bankDetails.isLinked ? "Update Account" : "Link Account"}
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

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
    <Box sx={{ p: 2 }}>
      <AppBar position="static" elevation={0} color="transparent">
        <Toolbar>
          <IconButton edge="start" onClick={handleDrawerToggle} sx={{ color: textColor }}><MenuIcon /></IconButton>
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1, color: textColor }}>Profile</Typography>
        </Toolbar>
      </AppBar>

      {/* Profile Header Card */}
      <Card sx={{
        background: PURPLE_GRADIENT, borderRadius: 4, p: 3, mb: 2, color: "white", textAlign: "center",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}>
        <Avatar
          src={user?.avatar}
          sx={{
            width: 90, height: 90, margin: "0 auto", mb: 1.5,
            border: `4px solid ${AMBER_ACCENT}`, boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}
        />
        <Typography variant="h5" fontWeight="bold">{user?.name || "Delivery Partner"}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>{user?.email}</Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Chip
            label="DELIVERY PARTNER"
            size="small"
            sx={{ bgcolor: AMBER_ACCENT, color: "black", fontWeight: "bold" }}
          />
          <Chip
            label={user?.deliveryProfile?.verificationStatus === "verified" ? "✓ Verified" : "⏳ Pending"}
            size="small"
            sx={{
              bgcolor: user?.deliveryProfile?.verificationStatus === "verified" ? "#4CAF50" : "#FF9800",
              color: "white", fontWeight: "bold",
            }}
          />
        </Stack>
      </Card>

      {/* Performance Stats */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: "Deliveries", value: user?.deliveryProfile?.totalDeliveries || 0, color: "#1565C0", bg: "#E3F2FD" },
          { label: "Rating", value: `${user?.deliveryProfile?.rating?.average?.toFixed(1) || "5.0"} ⭐`, color: "#E65100", bg: "#FFF3E0" },
          { label: "Success", value: `${user?.deliveryProfile?.successRate || 100}%`, color: "#2E7D32", bg: "#E8F5E9" },
          { label: "Earnings", value: `₹${earnings.monthly || 0}`, color: "#6A1B9A", bg: "#F3E5F5" },
        ].map((s, i) => (
          <Grid item xs={6} key={i}>
            <Card sx={{ borderRadius: 3, bgcolor: isDark ? "#1e1e1e" : s.bg, textAlign: "center", p: 2, boxShadow: "none" }}>
              <Typography variant="h6" fontWeight="900" color={s.color}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Personal Info */}
      <Card sx={{ borderRadius: 3, mb: 2, bgcolor: cardBg }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" color={textColor} sx={{ mb: 1.5 }}>Personal Information</Typography>
          <List disablePadding>
            {[
              { icon: "👤", label: "Name", value: user?.name },
              { icon: "📧", label: "Email", value: user?.email },
              { icon: "📱", label: "Phone", value: user?.phone },
            ].map((item, i) => (
              <ListItem key={i} disablePadding sx={{ py: 0.5 }}>
                <ListItemText
                  primary={<Typography variant="caption" color="text.secondary">{item.icon} {item.label}</Typography>}
                  secondary={<Typography variant="body2" fontWeight="bold" color={textColor}>{item.value || "Not set"}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Vehicle Details */}
      <Card sx={{ borderRadius: 3, mb: 2, bgcolor: cardBg }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" color={textColor} sx={{ mb: 1.5 }}>Vehicle Details</Typography>
          <List disablePadding>
            {[
              { icon: "🏍️", label: "Vehicle", value: user?.deliveryProfile?.vehicleType?.toUpperCase() },
              { icon: "🔢", label: "Number", value: user?.deliveryProfile?.vehicleNumber },
              { icon: "📋", label: "License", value: user?.deliveryProfile?.licenseNumber },
            ].map((item, i) => (
              <ListItem key={i} disablePadding sx={{ py: 0.5 }}>
                <ListItemText
                  primary={<Typography variant="caption" color="text.secondary">{item.icon} {item.label}</Typography>}
                  secondary={<Typography variant="body2" fontWeight="bold" color={textColor}>{item.value || "Not provided"}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Bank Account Status */}
      <Card sx={{ borderRadius: 3, mb: 2, bgcolor: cardBg }}>
        <CardContent>
          <ListItemButton onClick={() => setValue(2)} sx={{ borderRadius: 2, mx: -2 }}>
            <ListItemIcon><Typography>🏦</Typography></ListItemIcon>
            <ListItemText
              primary="Bank Account"
              secondary={bankDetails.isLinked ? `${bankDetails.bankName} • ****${bankDetails.accountNumber?.slice(-4)}` : "Not linked yet"}
            />
            <ChevronRight />
          </ListItemButton>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card sx={{ borderRadius: 3, bgcolor: cardBg }}>
        <ListItemButton onClick={logout} sx={{ borderRadius: 3, py: 2 }}>
          <ListItemIcon><ExitToApp color="error" /></ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: "error.main" }} primaryTypographyProps={{ fontWeight: "bold" }} />
        </ListItemButton>
      </Card>
    </Box>
  );

  const renderSettings = () => (
    <Box sx={{ p: 2 }}>
      <AppBar position="static" elevation={0} color="transparent">
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ color: textColor }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ flexGrow: 1, color: textColor }}
          >
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Card sx={{ borderRadius: 3, mb: 2, bgcolor: cardBg, color: textColor }}>
        <List>
          <ListItem>
            <ListItemIcon sx={{ color: textColor }}>
              {isDark ? <DarkMode /> : <LightMode />}
            </ListItemIcon>
            <ListItemText
              primary="Dark Mode"
              secondary={isDark ? "On" : "Off"}
              secondaryTypographyProps={{ color: "text.secondary" }}
            />
            <Switch checked={isDark} onChange={toggleTheme} color="secondary" />
          </ListItem>
          <Divider
            variant="inset"
            component="li"
            sx={{ borderColor: "divider" }}
          />
          <ListItem>
            <ListItemIcon sx={{ color: textColor }}>
              <Notifications />
            </ListItemIcon>
            <ListItemText
              primary="Push Notifications"
              secondary="Receive order updates"
              secondaryTypographyProps={{ color: "text.secondary" }}
            />
            <Switch defaultChecked color="primary" />
          </ListItem>
        </List>
      </Card>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Agrokart Delivery App v1.0.0
        </Typography>
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
            label="Home"
            icon={<Home />}
            sx={{
              color: textSecondary,
              "&.Mui-selected": { color: isDark ? AMBER_ACCENT : "#6A1B9A" },
            }}
          />
          <BottomNavigationAction
            label="History"
            icon={<HistoryIcon />}
            sx={{
              color: textSecondary,
              "&.Mui-selected": { color: isDark ? AMBER_ACCENT : "#6A1B9A" },
            }}
          />
          <BottomNavigationAction
            label="Wallet"
            icon={<WalletIcon />}
            sx={{
              color: textSecondary,
              "&.Mui-selected": { color: isDark ? AMBER_ACCENT : "#6A1B9A" },
            }}
          />
          <BottomNavigationAction
            label="Profile"
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
    </Box>
  );
};

export default MobileDeliveryDashboard;
