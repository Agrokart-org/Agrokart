import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Home as HomeIcon,
  ShoppingBag as OrdersIcon,
  ShoppingCart as CartIcon,
  Person as ProfileIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  Favorite as WishlistIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandLess,
  ExpandMore,
  People as PeopleIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const DRAWER_WIDTH = 280; // Reduced from 320 for better mobile fit
const DRAWER_WIDTH_COLLAPSED = 80;
const DRAWER_WIDTH_MOBILE = 240; // Even smaller for mobile

const CustomerSidebar = ({ open, onClose, onOpen, mobileOpen, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState({});

  const cartCount = cart?.length || 0;

  const mainMenuItems = [
    {
      id: 'home',
      label: t('navigation.home'),
      icon: HomeIcon,
      path: '/customer/dashboard',
      badge: null
    },
    {
      id: 'products',
      label: t('navigation.products'),
      icon: CategoryIcon,
      path: '/products',
      badge: null
    },
    {
      id: 'labour',
      label: t('navigation.labour'),
      icon: PeopleIcon,
      path: '/customer/labour',
      badge: null
    },
    {
      id: 'cart',
      label: t('navigation.cart'),
      icon: CartIcon,
      path: '/cart',
      badge: cartCount > 0 ? cartCount : null
    },
    {
      id: 'orders',
      label: t('navigation.myOrders'),
      icon: OrdersIcon,
      path: '/my-orders',
      badge: null
    },
    {
      id: 'wishlist',
      label: t('navigation.wishlist'),
      icon: WishlistIcon,
      path: '/wishlist',
      badge: null
    }
  ];

  const accountMenuItems = [
    {
      id: 'profile',
      label: t('navigation.profile'),
      icon: ProfileIcon,
      path: '/profile'
    },
    {
      id: 'notifications',
      label: t('navigation.notifications'),
      icon: NotificationsIcon,
      path: '/notifications',
      badge: 3 // Mock notification count
    },
    {
      id: 'settings',
      label: t('navigation.settings'),
      icon: SettingsIcon,
      path: '/settings'
    }
  ];

  const supportMenuItems = [
    {
      id: 'help',
      label: t('navigation.help'),
      icon: HelpIcon,
      path: '/help'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onMobileClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (isMobile) {
      onMobileClose();
    }
  };

  const isActive = (path) => {
    if (path === '/customer/dashboard') {
      return location.pathname === '/customer/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const showContent = open || isMobile;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5
        }}
      >
        {showContent && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha('#fff', 0.15),
                backdropFilter: 'blur(10px)'
              }}
            >
              <Avatar
                src={user?.avatar}
                sx={{
                  width: 40,
                  height: 40,
                  border: '2px solid white'
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight="700" noWrap>
                  {user?.name || 'Customer'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }} noWrap>
                  {user?.role || 'Farmer'}
                </Typography>
              </Box>
            </Box>

            {!isMobile && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <IconButton
                  onClick={onClose}
                  size="small"
                  sx={{
                    color: 'white',
                    bgcolor: alpha('#fff', 0.2),
                    '&:hover': { bgcolor: alpha('#fff', 0.3) }
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </Box>
            )}
          </>
        )}

        {!showContent && !isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 60 }}>
            <IconButton
              onClick={onOpen}
              size="small"
              sx={{
                color: 'white',
                bgcolor: alpha('#fff', 0.2),
                '&:hover': { bgcolor: alpha('#fff', 0.3) }
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}


      </Box>

      {/* Main Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 2 }}>
        <List sx={{ px: 1.5 }}>
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    bgcolor: active ? alpha('#8B5CF6', 0.1) : 'transparent',
                    color: active ? '#8B5CF6' : 'text.primary',
                    '&:hover': {
                      bgcolor: active ? alpha('#8B5CF6', 0.15) : alpha('#8B5CF6', 0.05)
                    },
                    transition: 'all 0.2s ease',
                    ...(showContent ? {} : { justifyContent: 'center', px: 0 })
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: showContent ? 48 : 'auto',
                      color: active ? '#8B5CF6' : 'inherit',
                      justifyContent: showContent ? 'flex-start' : 'center'
                    }}
                  >
                    {item.badge ? (
                      <Badge badgeContent={item.badge} color="error">
                        <Icon />
                      </Badge>
                    ) : (
                      <Icon />
                    )}
                  </ListItemIcon>
                  {showContent && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: active ? 600 : 500,
                        fontSize: '0.95rem'
                      }}
                    />
                  )}
                  {!showContent && (
                    <Tooltip title={item.label} placement="right" arrow>
                      <Box />
                    </Tooltip>
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        {/* Account Section */}
        <List sx={{ px: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 1,
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              letterSpacing: 1,
              display: showContent ? 'block' : 'none'
            }}
          >
            {t('navigation.account')}
          </Typography>
          {accountMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    bgcolor: active ? alpha('#2E7D32', 0.1) : 'transparent',
                    color: active ? '#2E7D32' : 'text.primary',
                    '&:hover': {
                      bgcolor: active ? alpha('#2E7D32', 0.15) : alpha('#2E7D32', 0.05)
                    },
                    ...(showContent ? {} : { justifyContent: 'center', px: 0 })
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: showContent ? 48 : 'auto',
                      color: active ? '#8B5CF6' : 'inherit',
                      justifyContent: showContent ? 'flex-start' : 'center'
                    }}
                  >
                    {item.badge ? (
                      <Badge badgeContent={item.badge} color="error">
                        <Icon />
                      </Badge>
                    ) : (
                      <Icon />
                    )}
                  </ListItemIcon>
                  {showContent && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: active ? 600 : 500,
                        fontSize: '0.95rem'
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        {/* Support Section */}
        <List sx={{ px: 1.5 }}>
          {supportMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    bgcolor: active ? alpha('#2E7D32', 0.1) : 'transparent',
                    color: active ? '#2E7D32' : 'text.primary',
                    '&:hover': {
                      bgcolor: active ? alpha('#2E7D32', 0.15) : alpha('#2E7D32', 0.05)
                    },
                    ...(showContent ? {} : { justifyContent: 'center', px: 0 })
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: showContent ? 48 : 'auto',
                      color: active ? '#8B5CF6' : 'inherit',
                      justifyContent: showContent ? 'flex-start' : 'center'
                    }}
                  >
                    <Icon />
                  </ListItemIcon>
                  {showContent && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: active ? 600 : 500,
                        fontSize: '0.95rem'
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Logout Button */}
      <Box sx={{ p: 2, borderTop: `1px solid ${alpha('#000', 0.08)}` }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            minHeight: 48,
            color: 'error.main',
            '&:hover': {
              bgcolor: alpha('#d32f2f', 0.1)
            },
            ...(showContent ? {} : { justifyContent: 'center', px: 0 })
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: showContent ? 48 : 'auto',
              color: 'error.main',
              justifyContent: showContent ? 'flex-start' : 'center'
            }}
          >
            <LogoutIcon />
          </ListItemIcon>
          {showContent && (
            <ListItemText
              primary={t('navigation.logout')}
              primaryTypographyProps={{
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH_MOBILE,
            borderRight: `1px solid ${alpha('#000', 0.08)}`
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
            boxSizing: 'border-box',
            borderRight: `1px solid ${alpha('#000', 0.08)}`,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen
            }),
            overflowX: 'hidden',
            overflowX: 'hidden',
            top: 70,
            height: 'calc(100% - 70px)',
            borderRadius: 0
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default CustomerSidebar;

