import React, { useState, useEffect, useCallback } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  Box,
  Container,
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
  Stack,
  Divider,
  Tab,
  Tabs,
  LinearProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Pagination,
  Tooltip,
  Skeleton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  VerifiedUser as VerifiedIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  ShoppingBag as OrderIcon,
  Store as VendorIcon,
  LocalShipping as DeliveryIcon,
  Person as CustomerIcon,
  Terminal as TerminalIcon,
  Code as CodeIcon,
  Search as SearchIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  TrendingUp as RevenueIcon,
  RemoveCircle as RemoveIcon,
  MoreVert as MoreVertIcon,
  LocalShipping as LocalShippingIcon,
  Person as PersonIcon,
  Store as StoreIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/api";

// Hacker Theme for Admin
const hackerTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#00ff00" },
    secondary: { main: "#00ff00" },
    background: { default: "#000000", paper: "#0a0a0a" },
    text: { primary: "#e0e0e0", secondary: "#00ff00" },
    divider: "#333",
  },
  typography: {
    fontFamily: "'Courier New', monospace",
    h4: { fontWeight: 700, letterSpacing: 1 },
    h6: { letterSpacing: 1 },
    button: { fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: "1px solid #00ff00",
          color: "#00ff00",
          "&:hover": {
            backgroundColor: "rgba(0,255,0,0.1)",
            boxShadow: "0 0 10px rgba(0,255,0,0.3)",
          },
        },
        contained: {
          backgroundColor: "#00ff00",
          color: "black",
          "&:hover": { backgroundColor: "#00cc00" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { border: "1px solid #222", borderRadius: 0 } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: "1px solid #222", fontFamily: "monospace" },
        head: {
          color: "#00ff00",
          fontWeight: "bold",
          borderBottom: "2px solid #00ff00",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontFamily: "monospace",
          border: "1px solid",
          backgroundColor: "transparent",
        },
        colorSuccess: { borderColor: "#00ff00", color: "#00ff00" },
        colorWarning: { borderColor: "#ffff00", color: "#ffff00" },
        colorError: { borderColor: "#ff0000", color: "#ff0000" },
      },
    },
  },
});

const drawerWidth = 280;

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(hackerTheme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // State
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [userFilter, setUserFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersPagination, setOrdersPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderRoleView, setOrderRoleView] = useState("all");
  const [deliveryAssignments, setDeliveryAssignments] = useState([]);
  const [deliveryPagination, setDeliveryPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [pendingApprovals, setPendingApprovals] = useState({
    vendors: [],
    delivery: [],
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    content: "",
    onConfirm: null,
  });

  const showNotif = (message, severity = "success") =>
    setNotification({ open: true, message, severity });

  // Fetch helpers
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/dashboard-stats`);
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (e) {
      console.error("Stats fetch error:", e);
    }
  }, []);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 15 });
        if (userFilter !== "all") params.set("role", userFilter);
        if (userSearch) params.set("search", userSearch);
        const res = await fetch(`${API_BASE_URL}/admin/users?${params}`);
        const data = await res.json();
        if (res.ok) {
          setUsers(data.users);
          setUsersPagination(data.pagination);
        }
      } catch (e) {
        console.error("Users fetch error:", e);
      }
      setLoading(false);
    },
    [userFilter, userSearch],
  );

  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 15 });
        if (orderFilter !== "all") params.set("status", orderFilter);
        if (orderSearch) params.set("search", orderSearch);
        const res = await fetch(`${API_BASE_URL}/admin/orders?${params}`);
        const data = await res.json();
        if (res.ok) {
          setOrders(data.orders);
          setOrdersPagination(data.pagination);
        }
      } catch (e) {
        console.error("Orders fetch error:", e);
      }
      setLoading(false);
    },
    [orderFilter, orderSearch, orderRoleView],
  );

  const fetchDeliveryAssignments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      const res = await fetch(
        `${API_BASE_URL}/admin/delivery-assignments?${params}`,
      );
      const data = await res.json();
      if (res.ok) {
        setDeliveryAssignments(data.assignments);
        setDeliveryPagination(data.pagination);
      }
    } catch (e) {
      console.error("Delivery assignments fetch error:", e);
    }
    setLoading(false);
  }, []);

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/pending-approvals`);
      const data = await res.json();
      if (res.ok) setPendingApprovals(data);
    } catch (e) {
      console.error("Approvals fetch error:", e);
    }
  }, []);

  // Load data on tab switch
  useEffect(() => {
    if (activeTab === 0) {
      fetchStats();
      fetchApprovals();
    }
    if (activeTab === 1) fetchUsers();
    if (activeTab === 2) {
      fetchOrders();
      if (orderRoleView === "delivery") fetchDeliveryAssignments();
    }
    if (activeTab === 3) fetchApprovals();
  }, [
    activeTab,
    fetchStats,
    fetchUsers,
    fetchOrders,
    fetchApprovals,
    fetchDeliveryAssignments,
    orderRoleView,
  ]);

  // Reload on filter/search change
  useEffect(() => {
    if (activeTab === 1) fetchUsers();
  }, [userFilter, userSearch, fetchUsers, activeTab]);
  useEffect(() => {
    if (activeTab === 2) fetchOrders();
  }, [orderFilter, orderSearch, fetchOrders, activeTab]);
  useEffect(() => {
    if (activeTab === 2 && orderRoleView === "delivery")
      fetchDeliveryAssignments();
  }, [orderRoleView, fetchDeliveryAssignments, activeTab]);

  // User Actions
  const handleUserAction = async (userId, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        showNotif(`User ${action}ed successfully`);
        fetchUsers(usersPagination.page);
        fetchStats();
        fetchApprovals();
      } else {
        const data = await res.json();
        showNotif(data.error || "Action failed", "error");
      }
    } catch (e) {
      showNotif("Network error", "error");
    }
  };

  const handleDeleteUser = (userId, userName) => {
    setConfirmDialog({
      open: true,
      title: "DELETE USER",
      content: `Permanently delete user "${userName}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            showNotif("User deleted");
            fetchUsers(usersPagination.page);
            fetchStats();
          } else {
            const d = await res.json();
            showNotif(d.error || "Delete failed", "error");
          }
        } catch (e) {
          showNotif("Network error", "error");
        }
        setConfirmDialog({ open: false });
      },
    });
  };

  // Order Actions
  const handleCancelOrder = (orderId) => {
    setConfirmDialog({
      open: true,
      title: "CANCEL ORDER",
      content: `Force-cancel order ${orderId.slice(-6).toUpperCase()}?`,
      onConfirm: async () => {
        try {
          const res = await fetch(
            `${API_BASE_URL}/admin/orders/${orderId}/status`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "cancelled" }),
            },
          );
          if (res.ok) {
            showNotif("Order cancelled");
            fetchOrders(ordersPagination.page);
            fetchStats();
          } else showNotif("Failed to cancel", "error");
        } catch (e) {
          showNotif("Network error", "error");
        }
        setConfirmDialog({ open: false });
      },
    });
  };

  const handleDeleteOrder = (orderId) => {
    setConfirmDialog({
      open: true,
      title: "DELETE ORDER",
      content: `Permanently remove order ${orderId.slice(-6).toUpperCase()} from the system?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            showNotif("Order deleted");
            fetchOrders(ordersPagination.page);
            fetchStats();
          } else showNotif("Failed to delete order", "error");
        } catch (e) {
          showNotif("Network error", "error");
        }
        setConfirmDialog({ open: false });
      },
    });
  };

  const handleDeleteAssignment = (assignmentId) => {
    setConfirmDialog({
      open: true,
      title: "DELETE ASSIGNMENT",
      content: `Delete assignment ${assignmentId.slice(-6).toUpperCase()}? This will reset the order to 'confirmed'.`,
      onConfirm: async () => {
        try {
          const res = await fetch(
            `${API_BASE_URL}/admin/delivery-assignments/${assignmentId}`,
            { method: "DELETE" },
          );
          if (res.ok) {
            showNotif("Assignment deleted");
            fetchDeliveryAssignments(deliveryPagination.page);
            fetchStats();
          } else showNotif("Failed to delete assignment", "error");
        } catch (e) {
          showNotif("Network error", "error");
        }
        setConfirmDialog({ open: false });
      },
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "vendor":
        return <VendorIcon sx={{ fontSize: 16 }} />;
      case "delivery_partner":
        return <DeliveryIcon sx={{ fontSize: 16 }} />;
      default:
        return <CustomerIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      finding_vendor: "warning",
      confirmed: "success",
      processing: "info",
      out_for_delivery: "info",
      delivered: "success",
      cancelled: "error",
      assigned: "warning",
      accepted: "info",
      picked_up: "primary",
      in_transit: "primary",
      failed: "error",
    };
    return colors[status] || "default";
  };

  const tabLabels = ["OVERVIEW", "USER_DB", "ORDER_DB", "APPROVALS", "CONFIG"];
  const tabIcons = [
    DashboardIcon,
    PeopleIcon,
    OrderIcon,
    VerifiedIcon,
    SettingsIcon,
  ];

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#000",
        borderRight: "1px solid #333",
      }}
    >
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <TerminalIcon sx={{ color: "#00ff00", fontSize: 32 }} />
        <Box>
          <Typography
            variant="h6"
            fontWeight="bold"
            color="#00ff00"
            lineHeight={1}
            sx={{ fontFamily: "monospace" }}
          >
            SYS_ADMIN
          </Typography>
          <Typography
            variant="caption"
            color="#666"
            sx={{ fontFamily: "monospace" }}
          >
            AGROKART_PANEL
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ borderColor: "#333" }} />
      <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
        {tabLabels.map((text, index) => {
          const Icon = tabIcons[index];
          return (
            <ListItem key={text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={activeTab === index}
                onClick={() => {
                  setActiveTab(index);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 0,
                  borderLeft:
                    activeTab === index
                      ? "4px solid #00ff00"
                      : "4px solid transparent",
                  "&.Mui-selected": {
                    bgcolor: "rgba(0,255,0,0.1)",
                    color: "#00ff00",
                  },
                  "&:hover": { bgcolor: "rgba(0,255,0,0.05)" },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: activeTab === index ? "#00ff00" : "#666",
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  primaryTypographyProps={{
                    fontFamily: "monospace",
                    fontWeight: "bold",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2, borderTop: "1px solid #333" }}>
        <Typography
          variant="caption"
          sx={{
            color: "#444",
            fontFamily: "monospace",
            display: "block",
            mb: 1,
          }}
        >
          SYS_STATUS: ONLINE
        </Typography>
        <LinearProgress
          variant="determinate"
          value={88}
          sx={{
            bgcolor: "#222",
            "& .MuiLinearProgress-bar": { bgcolor: "#00ff00" },
          }}
        />
      </Box>
    </Box>
  );

  const StatCard = ({ label, value, icon: Icon, color = "#00ff00" }) => (
    <Card
      sx={{
        height: "100%",
        bgcolor: "#0a0a0a",
        transition: "all 0.3s",
        "&:hover": { borderColor: color, boxShadow: `0 0 20px ${color}33` },
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            variant="caption"
            color="#666"
            gutterBottom
            sx={{ fontFamily: "monospace" }}
          >
            &gt; {label}
          </Typography>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: "#fff", fontFamily: "monospace" }}
          >
            {value !== undefined ? value : <Skeleton width={60} />}
          </Typography>
        </Box>
        <Box sx={{ p: 1.5, border: `1px solid ${color}33`, color }}>
          <Icon />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <ThemeProvider theme={hackerTheme}>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        {/* AppBar */}
        <AppBar
          position="fixed"
          sx={{
            width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
            ml: { xs: 0, md: `${drawerWidth}px` },
            boxShadow: "none",
            borderBottom: "1px solid #333",
            bgcolor: "rgba(0,0,0,0.9)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2, display: { md: "none" }, color: "#00ff00" }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h6"
                color="#00ff00"
                fontWeight="bold"
                sx={{
                  fontFamily: "monospace",
                  fontSize: { xs: "0.9rem", md: "1.25rem" },
                }}
              >
                root@agrokart:~# {tabLabels[activeTab]?.toLowerCase()}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={() => {
                    fetchStats();
                    fetchUsers();
                    fetchOrders();
                    fetchApprovals();
                  }}
                  sx={{ color: "#00ff00" }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CodeIcon />}
                onClick={handleLogout}
                sx={{
                  fontFamily: "monospace",
                  display: { xs: "none", sm: "inline-flex" },
                }}
              >
                LOGOUT
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
            mt: 8,
            color: "#e0e0e0",
            overflow: "hidden",
          }}
        >
          <Container maxWidth="xl" disableGutters sx={{ px: { xs: 0, sm: 2 } }}>
            {loading && (
              <LinearProgress
                sx={{
                  mb: 2,
                  bgcolor: "#222",
                  "& .MuiLinearProgress-bar": { bgcolor: "#00ff00" },
                }}
              />
            )}

            {/* 0: Overview */}
            {activeTab === 0 && (
              <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      label="TOTAL_USERS"
                      value={stats?.users?.total}
                      icon={PeopleIcon}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      label="ACTIVE_ORDERS"
                      value={stats?.orders?.active}
                      icon={OrderIcon}
                      color="#ffff00"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      label="PENDING_AUTH"
                      value={stats?.pendingApprovals?.total}
                      icon={VerifiedIcon}
                      color="#ff9900"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      label="NET_REVENUE"
                      value={
                        stats
                          ? `₹${(stats.revenue / 1000).toFixed(1)}K`
                          : undefined
                      }
                      icon={RevenueIcon}
                      color="#00ffff"
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      label="CUSTOMERS"
                      value={stats?.users?.customers}
                      icon={CustomerIcon}
                      color="#4dabf7"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      label="VENDORS"
                      value={stats?.users?.vendors}
                      icon={VendorIcon}
                      color="#69db7c"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      label="DELIVERY_AGENTS"
                      value={stats?.users?.delivery}
                      icon={DeliveryIcon}
                      color="#ffa94d"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      label="TOTAL_ORDERS"
                      value={stats?.orders?.total}
                      icon={OrderIcon}
                      color="#e599f7"
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: "100%", bgcolor: "#0a0a0a" }}>
                      <Box
                        sx={{
                          p: 3,
                          borderBottom: "1px solid #222",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{ color: "#00ff00" }}
                        >
                          PENDING_APPROVALS
                        </Typography>
                        <Button size="small" onClick={() => setActiveTab(3)}>
                          VIEW_ALL
                        </Button>
                      </Box>
                      <List>
                        {[
                          ...pendingApprovals.vendors.slice(0, 3),
                          ...pendingApprovals.delivery.slice(0, 2),
                        ].map((item) => (
                          <ListItem
                            key={item._id}
                            divider
                            sx={{ borderColor: "#222" }}
                          >
                            <ListItemIcon sx={{ color: "#666" }}>
                              <TerminalIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={item.name}
                              secondary={`ROLE: ${item.role === "vendor" ? "VENDOR" : "DELIVERY"} | ${new Date(item.createdAt).toLocaleDateString()}`}
                              primaryTypographyProps={{
                                fontFamily: "monospace",
                                color: "#ddd",
                              }}
                              secondaryTypographyProps={{
                                fontFamily: "monospace",
                                color: "#666",
                                fontSize: "0.75rem",
                              }}
                            />
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleUserAction(item._id, "verify")
                                }
                                sx={{ color: "#00ff00" }}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleUserAction(item._id, "reject")
                                }
                                sx={{ color: "#ff0000" }}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Stack>
                          </ListItem>
                        ))}
                        {pendingApprovals.vendors.length === 0 &&
                          pendingApprovals.delivery.length === 0 && (
                            <ListItem>
                              <ListItemText
                                primary="No pending approvals"
                                primaryTypographyProps={{
                                  color: "#666",
                                  fontFamily: "monospace",
                                  textAlign: "center",
                                }}
                              />
                            </ListItem>
                          )}
                      </List>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: "100%", bgcolor: "#0a0a0a" }}>
                      <Box sx={{ p: 3, borderBottom: "1px solid #222" }}>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{ color: "#00ff00" }}
                        >
                          QUICK_ACTIONS
                        </Typography>
                      </Box>
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<PeopleIcon />}
                              onClick={() => setActiveTab(1)}
                              sx={{ justifyContent: "flex-start", py: 1.5 }}
                            >
                              MANAGE_USERS
                            </Button>
                          </Grid>
                          <Grid item xs={6}>
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<OrderIcon />}
                              onClick={() => setActiveTab(2)}
                              sx={{ justifyContent: "flex-start", py: 1.5 }}
                            >
                              MANAGE_ORDERS
                            </Button>
                          </Grid>
                          <Grid item xs={6}>
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<VerifiedIcon />}
                              onClick={() => setActiveTab(3)}
                              sx={{ justifyContent: "flex-start", py: 1.5 }}
                            >
                              APPROVALS
                            </Button>
                          </Grid>
                          <Grid item xs={6}>
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<SettingsIcon />}
                              onClick={() => setActiveTab(4)}
                              sx={{ justifyContent: "flex-start", py: 1.5 }}
                            >
                              SYSTEM_CFG
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}

            {/* 1: User Management */}
            {activeTab === 1 && (
              <Card sx={{ bgcolor: "#0a0a0a" }}>
                <Box sx={{ p: 3, borderBottom: "1px solid #222" }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ sm: "center" }}
                    justifyContent="space-between"
                  >
                    <Tabs
                      value={userFilter}
                      onChange={(e, v) => setUserFilter(v)}
                      textColor="secondary"
                      indicatorColor="secondary"
                      sx={{
                        "& .MuiTab-root": {
                          color: "#666",
                          fontFamily: "monospace",
                          minWidth: "auto",
                          px: 2,
                        },
                        "& .Mui-selected": { color: "#00ff00" },
                      }}
                    >
                      <Tab
                        value="all"
                        label={`ALL (${usersPagination.total})`}
                      />
                      <Tab value="customer" label="CUSTOMERS" />
                      <Tab value="vendor" label="VENDORS" />
                      <Tab value="delivery_partner" label="AGENTS" />
                    </Tabs>
                    <TextField
                      size="small"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: "#666" }} />
                          </InputAdornment>
                        ),
                        sx: {
                          fontFamily: "monospace",
                          color: "#ddd",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#333",
                          },
                        },
                      }}
                      sx={{ minWidth: 250 }}
                    />
                  </Stack>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>IDENTITY</TableCell>
                        <TableCell>CONTACT</TableCell>
                        <TableCell>ACCESS_LEVEL</TableCell>
                        <TableCell>STATUS</TableCell>
                        <TableCell>JOINED</TableCell>
                        <TableCell align="right">ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            align="center"
                            sx={{ py: 4, color: "#666" }}
                          >
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow
                            key={user._id}
                            hover
                            sx={{
                              "&:hover": {
                                bgcolor: "rgba(0,255,0,0.05)!important",
                              },
                            }}
                          >
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                              >
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    fontSize: 14,
                                    bgcolor: "#222",
                                    color: "#00ff00",
                                    border: "1px solid #00ff00",
                                  }}
                                >
                                  {user.name?.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography
                                    variant="body2"
                                    fontWeight="medium"
                                    sx={{
                                      color: "#fff",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {user.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "#666" }}
                                  >
                                    {user.email}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell
                              sx={{ color: "#aaa", fontFamily: "monospace" }}
                            >
                              {user.phone || "—"}
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getRoleIcon(user.role)}
                                label={user.role?.toUpperCase()}
                                size="small"
                                sx={{ color: "#aaa", borderColor: "#444" }}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  user.isVerified ? "VERIFIED" : "UNVERIFIED"
                                }
                                size="small"
                                color={user.isVerified ? "success" : "warning"}
                              />
                            </TableCell>
                            <TableCell
                              sx={{ color: "#666", fontFamily: "monospace" }}
                            >
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">
                              <Stack
                                direction="row"
                                spacing={0.5}
                                justifyContent="flex-end"
                              >
                                {user.isVerified ? (
                                  <Tooltip title="Block user">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleUserAction(user._id, "block")
                                      }
                                      sx={{ color: "#ff9900" }}
                                    >
                                      <BlockIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Verify/Unblock user">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleUserAction(user._id, "verify")
                                      }
                                      sx={{ color: "#00ff00" }}
                                    >
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Delete user">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleDeleteUser(user._id, user.name)
                                    }
                                    sx={{ color: "#ff0000" }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {usersPagination.pages > 1 && (
                  <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                    <Pagination
                      count={usersPagination.pages}
                      page={usersPagination.page}
                      onChange={(e, p) => fetchUsers(p)}
                      sx={{
                        "& .MuiPaginationItem-root": {
                          color: "#666",
                          fontFamily: "monospace",
                          border: "1px solid #333",
                          "&.Mui-selected": {
                            bgcolor: "rgba(0,255,0,0.2)",
                            color: "#00ff00",
                            borderColor: "#00ff00",
                          },
                        },
                      }}
                    />
                  </Box>
                )}
              </Card>
            )}

            {/* 2: Order Management */}
            {activeTab === 2 && (
              <Card sx={{ bgcolor: "#0a0a0a" }}>
                {/* Role Toggle */}
                <Box
                  sx={{
                    p: 2,
                    borderBottom: "1px solid #222",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#666", fontFamily: "monospace", mr: 1 }}
                  >
                    &gt; VIEW_AS:
                  </Typography>
                  {[
                    {
                      value: "all",
                      label: "ALL_ORDERS",
                      icon: <OrderIcon fontSize="small" />,
                    },
                    {
                      value: "customer",
                      label: "CUSTOMER",
                      icon: <PersonIcon fontSize="small" />,
                    },
                    {
                      value: "vendor",
                      label: "VENDOR",
                      icon: <StoreIcon fontSize="small" />,
                    },
                    {
                      value: "delivery",
                      label: "DELIVERY",
                      icon: <LocalShippingIcon fontSize="small" />,
                    },
                  ].map((role) => (
                    <Button
                      key={role.value}
                      size="small"
                      variant={
                        orderRoleView === role.value ? "contained" : "outlined"
                      }
                      startIcon={role.icon}
                      onClick={() => setOrderRoleView(role.value)}
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        bgcolor:
                          orderRoleView === role.value
                            ? "rgba(0,255,0,0.2)"
                            : "transparent",
                        color:
                          orderRoleView === role.value ? "#00ff00" : "#666",
                        borderColor:
                          orderRoleView === role.value ? "#00ff00" : "#333",
                        "&:hover": {
                          bgcolor: "rgba(0,255,0,0.1)",
                          borderColor: "#00ff00",
                        },
                      }}
                    >
                      {role.label}
                    </Button>
                  ))}
                </Box>

                {/* Status Filter Tabs + Search */}
                <Box sx={{ p: 3, borderBottom: "1px solid #222" }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ sm: "center" }}
                    justifyContent="space-between"
                  >
                    <Tabs
                      value={orderFilter}
                      onChange={(e, v) => setOrderFilter(v)}
                      textColor="secondary"
                      indicatorColor="secondary"
                      variant="scrollable"
                      scrollButtons="auto"
                      sx={{
                        "& .MuiTab-root": {
                          color: "#666",
                          fontFamily: "monospace",
                          minWidth: "auto",
                          px: 1.5,
                        },
                        "& .Mui-selected": { color: "#00ff00" },
                      }}
                    >
                      <Tab
                        value="all"
                        label={`ALL (${ordersPagination.total})`}
                      />
                      <Tab value="pending" label="PENDING" />
                      <Tab value="confirmed" label="CONFIRMED" />
                      <Tab value="processing" label="PROCESSING" />
                      <Tab value="out_for_delivery" label="IN_TRANSIT" />
                      <Tab value="delivered" label="DELIVERED" />
                      <Tab value="cancelled" label="CANCELLED" />
                    </Tabs>
                    <TextField
                      size="small"
                      placeholder="Search by tracking #..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: "#666" }} />
                          </InputAdornment>
                        ),
                        sx: {
                          fontFamily: "monospace",
                          color: "#ddd",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#333",
                          },
                        },
                      }}
                      sx={{ minWidth: 220 }}
                    />
                  </Stack>
                </Box>

                {/* Orders Table */}
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ORDER_ID</TableCell>
                        <TableCell>CUSTOMER</TableCell>
                        {(orderRoleView === "all" ||
                          orderRoleView === "customer") && (
                          <TableCell>VENDOR</TableCell>
                        )}
                        {(orderRoleView === "all" ||
                          orderRoleView === "vendor") && (
                          <TableCell>ITEMS</TableCell>
                        )}
                        <TableCell>AMOUNT</TableCell>
                        {(orderRoleView === "all" ||
                          orderRoleView === "delivery") && (
                          <TableCell>DELIVERY_PARTNER</TableCell>
                        )}
                        <TableCell>STATUS</TableCell>
                        <TableCell>DATE</TableCell>
                        <TableCell align="right">ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            align="center"
                            sx={{ py: 4, color: "#666" }}
                          >
                            No orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => (
                          <TableRow
                            key={order._id}
                            hover
                            sx={{
                              "&:hover": {
                                bgcolor: "rgba(0,255,0,0.05)!important",
                              },
                            }}
                          >
                            <TableCell
                              sx={{ color: "#00ff00", fontFamily: "monospace" }}
                            >
                              #{order._id?.slice(-6).toUpperCase()}
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#fff",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {order.user?.name || "Unknown"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#666" }}
                                >
                                  {order.user?.email || ""}
                                </Typography>
                              </Box>
                            </TableCell>
                            {(orderRoleView === "all" ||
                              orderRoleView === "customer") && (
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#aaa",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {order.items?.[0]?.vendor?.vendorProfile
                                    ?.businessName ||
                                    order.items?.[0]?.vendor?.name ||
                                    "—"}
                                </Typography>
                              </TableCell>
                            )}
                            {(orderRoleView === "all" ||
                              orderRoleView === "vendor") && (
                              <TableCell sx={{ color: "#aaa" }}>
                                {order.items?.length || 0} items
                              </TableCell>
                            )}
                            <TableCell
                              sx={{
                                color: "#00ff00",
                                fontWeight: "bold",
                                fontFamily: "monospace",
                              }}
                            >
                              ₹{order.totalAmount?.toFixed(0) || "0"}
                            </TableCell>
                            {(orderRoleView === "all" ||
                              orderRoleView === "delivery") && (
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: order.deliveryPartner
                                      ? "#4dabf7"
                                      : "#666",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {order.deliveryPartner?.name ||
                                    "Not assigned"}
                                </Typography>
                              </TableCell>
                            )}
                            <TableCell>
                              <Chip
                                label={order.orderStatus
                                  ?.toUpperCase()
                                  .replace(/_/g, " ")}
                                size="small"
                                color={getStatusColor(order.orderStatus)}
                              />
                            </TableCell>
                            <TableCell
                              sx={{ color: "#666", fontFamily: "monospace" }}
                            >
                              {new Date(order.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">
                              <Stack
                                direction="row"
                                spacing={0.5}
                                justifyContent="flex-end"
                              >
                                {!["delivered", "cancelled"].includes(
                                  order.orderStatus,
                                ) && (
                                  <Tooltip title="Cancel order">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleCancelOrder(order._id)
                                      }
                                      sx={{ color: "#ff9900" }}
                                    >
                                      <RemoveIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Delete order">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteOrder(order._id)}
                                    sx={{ color: "#ff0000" }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {ordersPagination.pages > 1 && (
                  <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                    <Pagination
                      count={ordersPagination.pages}
                      page={ordersPagination.page}
                      onChange={(e, p) => fetchOrders(p)}
                      sx={{
                        "& .MuiPaginationItem-root": {
                          color: "#666",
                          fontFamily: "monospace",
                          border: "1px solid #333",
                          "&.Mui-selected": {
                            bgcolor: "rgba(0,255,0,0.2)",
                            color: "#00ff00",
                            borderColor: "#00ff00",
                          },
                        },
                      }}
                    />
                  </Box>
                )}

                {/* Delivery Assignments Section - Only when Delivery role is selected */}
                {orderRoleView === "delivery" && (
                  <Box sx={{ borderTop: "2px solid #00ff00", mt: 2 }}>
                    <Box
                      sx={{
                        p: 3,
                        borderBottom: "1px solid #222",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <LocalShippingIcon sx={{ color: "#ffa94d" }} />
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ color: "#ffa94d", fontFamily: "monospace" }}
                      >
                        ONGOING_DELIVERIES ({deliveryPagination.total})
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>ASSIGNMENT_ID</TableCell>
                            <TableCell>DELIVERY_PARTNER</TableCell>
                            <TableCell>ORDER</TableCell>
                            <TableCell>VENDOR</TableCell>
                            <TableCell>CUSTOMER</TableCell>
                            <TableCell>STATUS</TableCell>
                            <TableCell>FEE</TableCell>
                            <TableCell>ASSIGNED</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {deliveryAssignments.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={8}
                                align="center"
                                sx={{ py: 4, color: "#666" }}
                              >
                                No ongoing deliveries
                              </TableCell>
                            </TableRow>
                          ) : (
                            deliveryAssignments.map((assignment) => (
                              <TableRow
                                key={assignment._id}
                                hover
                                sx={{
                                  "&:hover": {
                                    bgcolor: "rgba(255,169,77,0.05)!important",
                                  },
                                }}
                              >
                                <TableCell
                                  sx={{
                                    color: "#ffa94d",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  #{assignment._id?.slice(-6).toUpperCase()}
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: "#fff",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      {assignment.deliveryPartner?.name ||
                                        "Unassigned"}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "#666" }}
                                    >
                                      {assignment.deliveryPartner?.phone || ""}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell
                                  sx={{
                                    color: "#00ff00",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  #
                                  {assignment.order?.trackingNumber ||
                                    assignment.order?._id
                                      ?.slice(-6)
                                      .toUpperCase() ||
                                    "—"}
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: "#aaa",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {assignment.vendor?.vendorProfile
                                      ?.businessName ||
                                      assignment.vendor?.name ||
                                      "—"}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: "#aaa",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {assignment.customer?.name || "—"}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={assignment.status
                                      ?.toUpperCase()
                                      .replace(/_/g, " ")}
                                    size="small"
                                    color={getStatusColor(assignment.status)}
                                    sx={{ fontFamily: "monospace" }}
                                  />
                                </TableCell>
                                <TableCell
                                  sx={{
                                    color: "#00ff00",
                                    fontWeight: "bold",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  ₹{assignment.deliveryFee || 0}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    color: "#666",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {new Date(
                                    assignment.assignedAt ||
                                      assignment.createdAt,
                                  ).toLocaleString()}
                                </TableCell>
                                <TableCell align="right">
                                  <Tooltip title="Delete assignment">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleDeleteAssignment(assignment._id)
                                      }
                                      sx={{ color: "#ff0000" }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {deliveryPagination.pages > 1 && (
                      <Box
                        sx={{ p: 2, display: "flex", justifyContent: "center" }}
                      >
                        <Pagination
                          count={deliveryPagination.pages}
                          page={deliveryPagination.page}
                          onChange={(e, p) => fetchDeliveryAssignments(p)}
                          sx={{
                            "& .MuiPaginationItem-root": {
                              color: "#666",
                              fontFamily: "monospace",
                              border: "1px solid #333",
                              "&.Mui-selected": {
                                bgcolor: "rgba(255,169,77,0.2)",
                                color: "#ffa94d",
                                borderColor: "#ffa94d",
                              },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Card>
            )}

            {/* 3: Approvals */}
            {activeTab === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: "#0a0a0a" }}>
                    <Box sx={{ p: 3, borderBottom: "1px solid #222" }}>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ color: "#00ff00" }}
                      >
                        VENDOR_REQUESTS ({pendingApprovals.vendors.length})
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>ENTITY</TableCell>
                            <TableCell>BUSINESS</TableCell>
                            <TableCell>DATE</TableCell>
                            <TableCell align="right">CMD</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingApprovals.vendors.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                align="center"
                                sx={{ py: 4, color: "#666" }}
                              >
                                No pending vendor requests
                              </TableCell>
                            </TableRow>
                          ) : (
                            pendingApprovals.vendors.map((v) => (
                              <TableRow key={v._id} hover>
                                <TableCell>
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: "#fff",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      {v.name}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "#666" }}
                                    >
                                      {v.email}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ color: "#aaa" }}>
                                  {v.vendorProfile?.businessName || "—"}
                                </TableCell>
                                <TableCell sx={{ color: "#666" }}>
                                  {new Date(v.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell align="right">
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    justifyContent="flex-end"
                                  >
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="success"
                                      onClick={() =>
                                        handleUserAction(v._id, "verify")
                                      }
                                    >
                                      ACCEPT
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      onClick={() =>
                                        handleUserAction(v._id, "reject")
                                      }
                                    >
                                      DENY
                                    </Button>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: "#0a0a0a" }}>
                    <Box sx={{ p: 3, borderBottom: "1px solid #222" }}>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ color: "#00ff00" }}
                      >
                        DELIVERY_REQUESTS ({pendingApprovals.delivery.length})
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>ENTITY</TableCell>
                            <TableCell>VEHICLE</TableCell>
                            <TableCell>DATE</TableCell>
                            <TableCell align="right">CMD</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingApprovals.delivery.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                align="center"
                                sx={{ py: 4, color: "#666" }}
                              >
                                No pending delivery requests
                              </TableCell>
                            </TableRow>
                          ) : (
                            pendingApprovals.delivery.map((d) => (
                              <TableRow key={d._id} hover>
                                <TableCell>
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: "#fff",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      {d.name}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "#666" }}
                                    >
                                      {d.email}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ color: "#aaa" }}>
                                  {d.deliveryProfile?.vehicleType?.toUpperCase() ||
                                    "—"}
                                </TableCell>
                                <TableCell sx={{ color: "#666" }}>
                                  {new Date(d.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell align="right">
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    justifyContent="flex-end"
                                  >
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="success"
                                      onClick={() =>
                                        handleUserAction(d._id, "verify")
                                      }
                                    >
                                      ACCEPT
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      onClick={() =>
                                        handleUserAction(d._id, "reject")
                                      }
                                    >
                                      DENY
                                    </Button>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* 4: Settings */}
            {activeTab === 4 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: "#0a0a0a" }}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ color: "#00ff00" }}
                      >
                        SYSTEM_CONFIG
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary="ALLOW_NEW_NODES"
                            secondary="Enable public registration"
                            primaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#eee",
                            }}
                            secondaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#666",
                            }}
                          />
                          <Chip label="TRUE" color="success" size="small" />
                        </ListItem>
                        <Divider component="li" sx={{ borderColor: "#222" }} />
                        <ListItem>
                          <ListItemText
                            primary="SYSTEM_LOCKDOWN"
                            secondary="Kill switch for all services"
                            primaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#eee",
                            }}
                            secondaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#666",
                            }}
                          />
                          <Chip
                            label="FALSE"
                            sx={{ borderColor: "#666", color: "#666" }}
                            variant="outlined"
                            size="small"
                          />
                        </ListItem>
                        <Divider component="li" sx={{ borderColor: "#222" }} />
                        <ListItem>
                          <ListItemText
                            primary="COD_ENABLED"
                            secondary="Allow cash on delivery"
                            primaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#eee",
                            }}
                            secondaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#666",
                            }}
                          />
                          <Chip label="TRUE" color="success" size="small" />
                        </ListItem>
                        <Divider component="li" sx={{ borderColor: "#222" }} />
                        <ListItem>
                          <ListItemText
                            primary="AUTO_ASSIGN_DELIVERY"
                            secondary="Auto-assign delivery partners"
                            primaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#eee",
                            }}
                            secondaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#666",
                            }}
                          />
                          <Chip label="TRUE" color="success" size="small" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: "#0a0a0a" }}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ color: "#00ff00" }}
                      >
                        DATABASE_INFO
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary="DB_ENGINE"
                            secondary="MongoDB Atlas"
                            primaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#eee",
                            }}
                            secondaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#666",
                            }}
                          />
                        </ListItem>
                        <Divider component="li" sx={{ borderColor: "#222" }} />
                        <ListItem>
                          <ListItemText
                            primary="SERVER_VERSION"
                            secondary="v4.2.0"
                            primaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#eee",
                            }}
                            secondaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#666",
                            }}
                          />
                        </ListItem>
                        <Divider component="li" sx={{ borderColor: "#222" }} />
                        <ListItem>
                          <ListItemText
                            primary="API_ENDPOINT"
                            secondary={API_BASE_URL}
                            primaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#eee",
                            }}
                            secondaryTypographyProps={{
                              fontFamily: "monospace",
                              color: "#666",
                            }}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Container>
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false })}
        PaperProps={{
          sx: { bgcolor: "#111", border: "1px solid #ff0000", borderRadius: 0 },
        }}
      >
        <DialogTitle
          sx={{ color: "#ff0000", fontFamily: "monospace", fontWeight: "bold" }}
        >
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#aaa", fontFamily: "monospace" }}>
            {confirmDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false })}
            sx={{ color: "#666" }}
          >
            ABORT
          </Button>
          <Button
            onClick={confirmDialog.onConfirm}
            variant="contained"
            color="error"
            sx={{ bgcolor: "#ff0000", fontFamily: "monospace" }}
          >
            EXECUTE
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          severity={notification.severity}
          sx={{ width: "100%", fontFamily: "monospace" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default AdminDashboard;
