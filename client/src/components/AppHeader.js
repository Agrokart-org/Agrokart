import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  Container,
  InputBase,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  Dashboard as DashboardIcon,
  FavoriteOutlined as FavoriteIcon,
  SearchOutlined as SearchIcon,
  Agriculture as AgricultureIcon,
  Storefront as ShopIcon,
  ListAlt as OrdersIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Psychology as AIIcon,
} from "@mui/icons-material";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { cart } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const cartItemsCount = cart ? cart.reduce((total, item) => total + item.quantity, 0) : 0;

  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
    handleProfileMenuClose();
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const categories = [
    { label: "All Products", path: "/products" },
    { label: "Fertilizers", path: "/products?category=Fertilizers" },
    { label: "Seeds", path: "/products?category=Seeds" },
    { label: "Crop Protection", path: "/products?category=Pesticides" },
    { label: "Micronutrients", path: "/products?category=Micronutrients" },
    { label: "Dr. Agro", path: "/customer/dr-agro" },
  ];

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "#1B5E20",
          color: "white",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Toolbar disableGutters sx={{ minHeight: { xs: 58, md: 66 }, display: "flex", gap: 2 }}>
            {/* Mobile Menu Icon */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={() => setMobileDrawerOpen(true)}
                sx={{ mr: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Brand Logo */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onClick={() => navigate("/")}
            >
              <Avatar
                sx={{
                  bgcolor: "#2E7D32",
                  width: 38,
                  height: 38,
                  mr: 1.2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                <AgricultureIcon sx={{ color: "#A5D6A7", fontSize: 24 }} />
              </Avatar>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  color: "white",
                  fontSize: { xs: "1.2rem", sm: "1.4rem" },
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                AgroKart
              </Typography>
            </Box>

            {/* Flexible Search Bar */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                maxWidth: 600,
                mx: "auto",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  background: alpha("#FFFFFF", 0.15),
                  borderRadius: 3,
                  width: "100%",
                  px: 2,
                  py: 0.6,
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  transition: "all 0.2s ease",
                  "&:focus-within": {
                    background: alpha("#FFFFFF", 0.25),
                    borderColor: "#81C784",
                    boxShadow: "0 0 0 3px rgba(129, 199, 132, 0.3)",
                  },
                }}
              >
                <SearchIcon sx={{ color: "rgba(255,255,255,0.75)", mr: 1, fontSize: 20 }} />
                <InputBase
                  placeholder="Search fertilizers, crops, seeds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  sx={{
                    flex: 1,
                    fontSize: { xs: "0.85rem", sm: "0.92rem" },
                    color: "white",
                    fontWeight: 500,
                    "& .MuiInputBase-input::placeholder": {
                      color: "rgba(255,255,255,0.7)",
                      opacity: 1,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Desktop Actions / Mobile Icons */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, flexShrink: 0 }}>
              {/* AI Assistant Direct Link */}
              {!isMobile && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate("/customer/dr-agro")}
                  startIcon={<AIIcon sx={{ color: "#81C784" }} />}
                  sx={{
                    color: "white",
                    borderColor: "rgba(255,255,255,0.3)",
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 1.8,
                    "&:hover": {
                      borderColor: "#81C784",
                      bgcolor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  Dr. Agro
                </Button>
              )}

              {/* Cart Button */}
              <IconButton color="inherit" onClick={() => navigate("/cart")} sx={{ p: 1 }}>
                <Badge badgeContent={cartItemsCount} color="warning">
                  <CartIcon />
                </Badge>
              </IconButton>

              {/* User Profile / Login */}
              {isAuthenticated ? (
                <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: "#2E7D32",
                      color: "white",
                      width: 36,
                      height: 36,
                      fontWeight: 700,
                      border: "2px solid rgba(255,255,255,0.4)",
                    }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </Avatar>
                </IconButton>
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate("/login")}
                  startIcon={<PersonIcon />}
                  sx={{
                    background: "#81C784",
                    color: "#0F3811",
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2,
                    py: 0.6,
                    textTransform: "none",
                    "&:hover": { background: "#66BB6A" },
                  }}
                >
                  Login
                </Button>
              )}
            </Box>

            {/* Profile Dropdown */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 3,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                },
              }}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {user?.name || "User"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email || "user@agrokart.com"}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { navigate("/profile"); handleProfileMenuClose(); }}>
                <ListItemIcon><AccountIcon fontSize="small" /></ListItemIcon>
                <ListItemText>My Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { navigate("/my-orders"); handleProfileMenuClose(); }}>
                <ListItemIcon><OrdersIcon fontSize="small" /></ListItemIcon>
                <ListItemText>My Orders</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Toolbar>
        </Container>

        {/* Desktop Category Navigation Bar */}
        {!isMobile && (
          <Box
            sx={{
              background: "#14532D",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              py: 0.5,
            }}
          >
            <Container maxWidth="xl" disableGutters sx={{ px: 4, display: "flex", gap: 1.5, overflowX: "auto" }}>
              {categories.map((cat) => (
                <Button
                  key={cat.label}
                  onClick={() => navigate(cat.path)}
                  sx={{
                    color: location.pathname + location.search === cat.path ? "#81C784" : "rgba(255,255,255,0.85)",
                    fontWeight: location.pathname + location.search === cat.path ? 700 : 500,
                    fontSize: "0.85rem",
                    textTransform: "none",
                    px: 1.8,
                    borderRadius: 1.5,
                    whiteSpace: "nowrap",
                    "&:hover": { color: "#white", bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  {cat.label}
                </Button>
              ))}
            </Container>
          </Box>
        )}
      </AppBar>

      {/* Responsive Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: { width: 280, bgcolor: "#F8FBF8" },
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#1B5E20", color: "white" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AgricultureIcon sx={{ color: "#81C784" }} />
            <Typography variant="h6" fontWeight={700}>AgroKart</Typography>
          </Stack>
          <IconButton color="inherit" onClick={() => setMobileDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List sx={{ pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => { navigate("/"); setMobileDrawerOpen(false); }}>
              <ListItemIcon><HomeIcon sx={{ color: "#1B5E20" }} /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => { navigate("/products"); setMobileDrawerOpen(false); }}>
              <ListItemIcon><ShopIcon sx={{ color: "#1B5E20" }} /></ListItemIcon>
              <ListItemText primary="All Products" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => { navigate("/customer/dr-agro"); setMobileDrawerOpen(false); }}>
              <ListItemIcon><AIIcon sx={{ color: "#1B5E20" }} /></ListItemIcon>
              <ListItemText primary="Dr. Agro AI Assistant" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => { navigate("/my-orders"); setMobileDrawerOpen(false); }}>
              <ListItemIcon><OrdersIcon sx={{ color: "#1B5E20" }} /></ListItemIcon>
              <ListItemText primary="My Orders" />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" sx={{ px: 2, py: 1, color: "text.secondary", fontWeight: 700, display: "block" }}>
          CATEGORIES
        </Typography>
        <List disablePadding>
          {categories.slice(1, -1).map((cat) => (
            <ListItem key={cat.label} disablePadding>
              <ListItemButton onClick={() => { navigate(cat.path); setMobileDrawerOpen(false); }}>
                <ListItemText primary={cat.label} sx={{ pl: 2 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
};

export default AppHeader;
