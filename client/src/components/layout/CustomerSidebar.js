import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Typography,
  Badge,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";
import {
  Home as HomeIcon,
  ShoppingBag as OrdersIcon,
  ShoppingCart as CartIcon,
  Person as ProfileIcon,
  Category as CategoryIcon,
  Favorite as WishlistIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Science as ScienceIcon,
  Storefront as StorefrontIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

import SmartToyIcon from "@mui/icons-material/SmartToy";
import Chip from "@mui/material/Chip";

const DRAWER_WIDTH = 250;

const CustomerSidebar = ({
  open,
  onClose,
  mobileOpen,
  onMobileClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { t } = useTranslation();

  const cartCount = cart?.length || 0;

  const mainMenuItems = [
    { id: "home", label: t("navigation.home") || "Dashboard", icon: HomeIcon, path: "/customer/dashboard" },
    { id: "products", label: t("navigation.products") || "All Products", icon: CategoryIcon, path: "/products" },
    { id: "drAgro", label: "Dr. Agro", icon: SmartToyIcon, path: "/customer/dr-agro", isAi: true },
    { id: "mandiRates", label: "Mandi Rates", icon: StorefrontIcon, path: "/customer/mandi-rates" },
    { id: "labour", label: "Labour Services", icon: PeopleIcon, path: "/customer/labour" },
  ];

  const drAgroToolsItems = [
    { id: "soilAnalysis", label: "Crop & Soil Analysis", icon: ScienceIcon, path: "/customer/dr-agro?tool=soil" },
    { id: "fertilizerCalc", label: "Fertilizer Calculator", icon: CategoryIcon, path: "/customer/dr-agro?tool=fertilizer" },
    { id: "cropDiag", label: "Crop Diagnosis", icon: CategoryIcon, path: "/customer/dr-agro?tool=cropDiag" },
    { id: "irrigationAdv", label: "Irrigation Advisor", icon: ScienceIcon, path: "/customer/dr-agro?tool=irrigation" },
    { id: "weatherAdv", label: "Weather Advisor", icon: ScienceIcon, path: "/customer/dr-agro/weather" },
  ];

  const aiAssistantItems = [
    { id: "agroAiChat", label: "Agro AI Chat", icon: SmartToyIcon, path: "/customer/agro-ai", isRagAi: true, badge: "RAG" }
  ];

  const orderMenuItems = [
    { id: "cart", label: "Shopping Cart", icon: CartIcon, path: "/cart", badge: cartCount > 0 ? cartCount : null },
    { id: "orders", label: "My Orders", icon: OrdersIcon, path: "/my-orders" },
    { id: "wishlist", label: "Wishlist", icon: WishlistIcon, path: "/wishlist" },
  ];

  const accountMenuItems = [
    { id: "profile", label: "My Account", icon: ProfileIcon, path: "/profile" },
    { id: "notifications", label: "Notifications", icon: NotificationsIcon, path: "/notifications", badge: 2 },
    { id: "settings", label: "Settings", icon: SettingsIcon, path: "/settings" },
    { id: "help", label: "Help & Support", icon: HelpIcon, path: "/help" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) onMobileClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    if (isMobile) onMobileClose();
  };

  const isActive = (path) => {
    if (path === "/customer/dashboard") return location.pathname === "/customer/dashboard";
    return location.pathname.startsWith(path);
  };

  const renderNavGroup = (title, items) => (
    <Box sx={{ mb: 2 }}>
      {title && (
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 0.8,
            color: "#6B7280",
            fontWeight: 700,
            fontSize: "0.68rem",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            display: "block",
          }}
        >
          {title}
        </Typography>
      )}
      <List disablePadding>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <ListItem key={item.id} disablePadding sx={{ px: 1, py: 0.3 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: "8px",
                  minHeight: 40,
                  px: 1.5,
                  bgcolor: active ? (item.isAi ? "#ECFDF5" : "#E8F5E9") : "transparent",
                  color: active ? (item.isAi ? "#047857" : "#1B5E20") : "#374151",
                  borderLeft: active ? (item.isAi ? "3px solid #059669" : "3px solid #1B5E20") : "3px solid transparent",
                  "&:hover": {
                    bgcolor: active ? (item.isAi ? "#D1FAE5" : "#DCEDC8") : "#F3F4F6",
                    color: active ? (item.isAi ? "#047857" : "#1B5E20") : "#111827",
                  },
                  transition: "all 0.15s ease",
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: active ? (item.isAi ? "#059669" : "#1B5E20") : "#6B7280" }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error" sx={{ "& .MuiBadge-badge": { fontSize: 10, height: 16, minWidth: 16 } }}>
                      <Icon sx={{ fontSize: 20 }} />
                    </Badge>
                  ) : (
                    <Icon sx={{ fontSize: 20 }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.88rem",
                  }}
                />
                {item.isAi && (
                  <Chip
                    label="AI"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      bgcolor: active ? "#059669" : "#10B981",
                      color: "white",
                      px: 0.5,
                      ml: 1,
                      "& .MuiChip-label": { px: 0.8 }
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#FFFFFF" }}>
      {/* Top User Profile Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "#F9FAFB",
        }}
      >
        <Avatar
          src={user?.avatar}
          sx={{
            width: 40,
            height: 40,
            bgcolor: "#1B5E20",
            color: "white",
            fontWeight: 700,
            border: "2px solid #A5D6A7",
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ color: "#111827", fontSize: "0.9rem" }}>
            {user?.name || "Farmer Account"}
          </Typography>
          <Typography variant="caption" sx={{ color: "#6B7280", display: "block" }} noWrap>
            {user?.email || "customer@agrokart.com"}
          </Typography>
        </Box>
      </Box>

      {/* Navigation Groups */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", py: 1.5 }}>
        {renderNavGroup("Marketplace", mainMenuItems)}
        <Divider sx={{ my: 1, borderColor: "#F3F4F6" }} />
        {renderNavGroup("Dr. Agro Tools", drAgroToolsItems)}
        <Divider sx={{ my: 1, borderColor: "#F3F4F6" }} />
        {renderNavGroup("AI Assistant", aiAssistantItems)}
        <Divider sx={{ my: 1, borderColor: "#F3F4F6" }} />
        {renderNavGroup("My Orders & Cart", orderMenuItems)}
        <Divider sx={{ my: 1, borderColor: "#F3F4F6" }} />
        {renderNavGroup("Account & Settings", accountMenuItems)}
      </Box>

      {/* Footer Logout Button */}
      <Box sx={{ p: 1.5, borderTop: "1px solid #E5E7EB", bgcolor: "#F9FAFB" }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: "8px",
            minHeight: 40,
            color: "#DC2626",
            "&:hover": { bgcolor: "#FEE2E2" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: "#DC2626" }}>
            <LogoutIcon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary="Sign Out"
            primaryTypographyProps={{ fontWeight: 600, fontSize: "0.88rem" }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer (< 1024px) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          zIndex: (theme) => theme.zIndex.drawer + 3,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid #E5E7EB",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer (>= 1024px) */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid #E5E7EB",
            top: 72,
            height: "calc(100% - 72px)",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default CustomerSidebar;
