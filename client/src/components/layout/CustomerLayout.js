import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  useTheme,
  useMediaQuery,
  Avatar,
  Typography,
  InputBase,
  alpha,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  Menu as MenuIcon,
  ShoppingCart as CartIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  LocationOn,
  Language,
  KeyboardArrowDown,
  Check,
  Home as HomeIcon,
  Receipt as OrdersIcon,
  Person as ProfileIcon,
  MedicalServices as DrAgroIcon,
  Agriculture as AgricultureIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationProvider";
import CustomerSidebar from "./CustomerSidebar";
import Footer from "./Footer";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";

const CustomerLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { cart } = useCart();
  const { user } = useAuth();
  const { getUnreadCount } = useNotifications();
  const { t, i18n } = useTranslation();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [anchorElLoc, setAnchorElLoc] = useState(null);
  const [anchorElLang, setAnchorElLang] = useState(null);
  const [location, setLocation] = useState("Mumbai 400001");
  const [language, setLanguage] = useState("EN");

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleOpenLoc = (event) => setAnchorElLoc(event.currentTarget);
  const handleCloseLoc = () => setAnchorElLoc(null);
  const handleSelectLoc = (loc) => {
    setLocation(loc);
    handleCloseLoc();
  };

  const handleOpenLang = (event) => setAnchorElLang(event.currentTarget);
  const handleCloseLang = () => setAnchorElLang(null);
  const handleSelectLang = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang.toLowerCase());
    handleCloseLang();
  };

  const cartCount = cart?.length || 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#F9FAFB",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      {/* Full-width Fixed Header */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "#1B5E20 !important",
          color: "white",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          height: 72,
          justifyContent: "center",
          width: "100%",
          left: 0,
          right: 0,
        }}
      >
        <Box sx={{ width: "100%", px: { xs: 2, sm: 3, md: 4 }, boxSizing: "border-box" }}>
          <Toolbar disableGutters sx={{ minHeight: 72, display: "flex", gap: 2, width: "100%" }}>
            {/* Mobile Drawer Button */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={() => setMobileSidebarOpen(true)}
                sx={{ mr: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Agrokart Brand Logo */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                gap: 1.2,
                mr: 2,
              }}
              onClick={() => navigate("/customer/dashboard")}
            >
              <Avatar sx={{ bgcolor: "#2E7D32", width: 38, height: 38, border: "1px solid rgba(255,255,255,0.3)" }}>
                <AgricultureIcon sx={{ color: "#A5D6A7", fontSize: 24 }} />
              </Avatar>
              <Typography
                variant="h6"
                component="div"
                sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1, display: { xs: "none", sm: "block" } }}
              >
                <span style={{ color: "white" }}>Agro</span>
                <span style={{ color: "#FFB300" }}>kart</span>
              </Typography>
            </Box>

            {/* Search Bar */}
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                position: "relative",
                borderRadius: "8px",
                backgroundColor: alpha(theme.palette.common.white, 0.14),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.common.white, 0.22),
                },
                flex: 1,
                maxWidth: { xs: "100%", sm: 480, md: 640 },
                mx: "auto",
                transition: "all 0.2s ease",
              }}
            >
              <Box
                sx={{
                  padding: theme.spacing(0, 2),
                  height: "100%",
                  position: "absolute",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SearchIcon sx={{ color: "rgba(255,255,255,0.7)" }} />
              </Box>
              <InputBase
                placeholder={t("app.search") || "Search fertilizers, seeds, pesticides..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  color: "inherit",
                  width: "100%",
                  "& .MuiInputBase-input": {
                    padding: theme.spacing(1, 1, 1, 0),
                    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  },
                }}
              />
            </Box>

            {/* Delivery Location Selector */}
            <Button
              startIcon={<LocationOn sx={{ color: "#FFB300" }} />}
              endIcon={<KeyboardArrowDown />}
              onClick={handleOpenLoc}
              sx={{
                color: "white",
                display: { xs: "none", lg: "flex" },
                textTransform: "none",
                bgcolor: alpha("#fff", 0.08),
                borderRadius: "8px",
                px: 1.8,
                py: 0.5,
                "&:hover": { bgcolor: alpha("#fff", 0.16) },
              }}
            >
              <Box sx={{ textAlign: "left", lineHeight: 1.1 }}>
                <Typography variant="caption" sx={{ display: "block", opacity: 0.75, fontSize: "0.64rem" }}>
                  Deliver to
                </Typography>
                <Typography variant="body2" fontWeight="700" sx={{ fontSize: "0.82rem" }}>
                  {location}
                </Typography>
              </Box>
            </Button>

            <Menu
              anchorEl={anchorElLoc}
              open={Boolean(anchorElLoc)}
              onClose={handleCloseLoc}
              PaperProps={{ sx: { mt: 1.5, borderRadius: 2, minWidth: 200 } }}
            >
              <MenuItem onClick={() => handleSelectLoc("Mumbai 400001")} selected={location === "Mumbai 400001"}>
                <ListItemIcon><LocationOn fontSize="small" /></ListItemIcon>
                <ListItemText primary="Mumbai 400001" secondary="Default" />
              </MenuItem>
              <MenuItem onClick={() => handleSelectLoc("Pune 411001")} selected={location === "Pune 411001"}>
                <ListItemIcon><LocationOn fontSize="small" /></ListItemIcon>
                <ListItemText primary="Pune 411001" secondary="Farm Location" />
              </MenuItem>
            </Menu>

            {/* Language Selector */}
            <Button
              startIcon={<Language />}
              endIcon={<KeyboardArrowDown />}
              onClick={handleOpenLang}
              sx={{
                color: "white",
                display: { xs: "none", md: "flex" },
                textTransform: "none",
                bgcolor: alpha("#fff", 0.08),
                borderRadius: "8px",
                px: 1.8,
                py: 0.5,
                "&:hover": { bgcolor: alpha("#fff", 0.16) },
              }}
            >
              {language}
            </Button>

            <Menu
              anchorEl={anchorElLang}
              open={Boolean(anchorElLang)}
              onClose={handleCloseLang}
              PaperProps={{ sx: { mt: 1.5, borderRadius: 2, minWidth: 140 } }}
            >
              {["EN", "HI", "MR"].map((lang) => (
                <MenuItem key={lang} onClick={() => handleSelectLang(lang)} selected={language === lang}>
                  <ListItemText primary={lang === "EN" ? "English" : lang === "HI" ? "हिंदी" : "मराठी"} />
                  {language === lang && <Check fontSize="small" sx={{ ml: 1 }} />}
                </MenuItem>
              ))}
            </Menu>

            {/* Right Action Icons */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.8, sm: 1.2 } }}>
              <IconButton
                sx={{ color: "white", bgcolor: alpha("#fff", 0.08), "&:hover": { bgcolor: alpha("#fff", 0.16) } }}
                onClick={() => navigate("/notifications")}
              >
                <Badge badgeContent={getUnreadCount()} color="warning">
                  <NotificationsIcon sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>

              <IconButton
                sx={{ color: "white", bgcolor: alpha("#fff", 0.08), "&:hover": { bgcolor: alpha("#fff", 0.16) } }}
                onClick={() => navigate("/cart")}
              >
                <Badge badgeContent={cartCount} color="warning">
                  <CartIcon sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>

              <IconButton
                onClick={() => navigate("/profile")}
                sx={{ p: 0, border: "2px solid rgba(255,255,255,0.4)", borderRadius: "50%" }}
              >
                <Avatar
                  src={user?.avatar}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: "white",
                    color: "#1B5E20",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </Box>
      </AppBar>

      {/* Persistent Desktop Sidebar (Flex Item 1: 250px) */}
      <CustomerSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Flex Item 2: flexGrow 1, starts IMMEDIATELY next to sidebar) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          pt: "72px", // Fixed height of AppBar
          pb: { xs: "85px", md: 0 },
          bgcolor: "#F9FAFB",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ flex: 1, width: "100%", boxSizing: "border-box" }}>{children}</Box>
        {!isMobile && <Footer />}
      </Box>

      {/* Mobile Bottom Navigation (< 1024px) */}
      {isMobile && (
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.drawer + 2,
            borderTop: "1px solid #E5E7EB",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          elevation={3}
        >
          <BottomNavigation
            value={
              routerLocation.pathname === "/customer/dashboard"
                ? 0
                : routerLocation.pathname === "/my-orders"
                  ? 1
                  : routerLocation.pathname.includes("/dr-agro")
                    ? 2
                    : routerLocation.pathname === "/cart"
                      ? 3
                      : routerLocation.pathname === "/profile"
                        ? 4
                        : 0
            }
            onChange={(event, newValue) => {
              switch (newValue) {
                case 0: navigate("/customer/dashboard"); break;
                case 1: navigate("/my-orders"); break;
                case 2: navigate("/customer/dr-agro"); break;
                case 3: navigate("/cart"); break;
                case 4: navigate("/profile"); break;
                default: navigate("/customer/dashboard");
              }
            }}
            sx={{ height: 60 }}
          >
            <BottomNavigationAction label="Home" icon={<HomeIcon />} />
            <BottomNavigationAction label="Orders" icon={<OrdersIcon />} />
            <BottomNavigationAction label="Dr. Agro" icon={<DrAgroIcon />} />
            <BottomNavigationAction
              label="Cart"
              icon={
                <Badge badgeContent={cartCount} color="error">
                  <CartIcon />
                </Badge>
              }
            />
            <BottomNavigationAction label="Profile" icon={<ProfileIcon />} />
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};

export default CustomerLayout;
