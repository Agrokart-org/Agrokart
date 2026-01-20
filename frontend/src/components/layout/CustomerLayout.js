import React, { useState } from 'react';
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
  Container,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Menu as MenuIcon,
  ShoppingCart as CartIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  LocationOn,
  Language,
  KeyboardArrowDown,
  Check
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import CustomerSidebar from './CustomerSidebar';
import LogoImage from '../../assets/logo_green_no_bg.png';

import Footer from './Footer';

const CustomerLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { cart } = useCart();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [anchorElLoc, setAnchorElLoc] = useState(null);
  const [anchorElLang, setAnchorElLang] = useState(null);
  const [location, setLocation] = useState('Mumbai 400001');
  const [language, setLanguage] = useState('EN');

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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Horizontal Navigation Bar */}
      <AppBar
        position="fixed"
        elevation={4}
        sx={{
          background: 'linear-gradient(90deg, rgba(55, 71, 79, 0.95) 0%, rgba(46, 125, 50, 0.95) 100%) !important', // Semi-transparent gradient
          backdropFilter: 'blur(10px)',
          color: 'white',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderBottom: 'none',
          height: 70, // Reduced height to 70px
          justifyContent: 'center',
          '& .MuiToolbar-root': {
            minHeight: 70
          },
          borderRadius: 0
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ px: { xs: 0 }, minHeight: 70 }}>
            {/* Mobile Menu Button */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileSidebarOpen(true)}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo/Title */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                mr: 4,
                cursor: 'pointer',
                gap: 2
              }}
              onClick={() => navigate('/customer/dashboard')}
            >
              {/* Logo Icon */}
              <Box
                component="img"
                src={LogoImage}
                alt="Agrokart Logo"
                sx={{
                  width: 44,
                  height: 44,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.3))'
                }}
              />
              {/* Logo Text */}
              <Typography variant="h5" component="div" sx={{ fontWeight: 900, letterSpacing: 0.5, lineHeight: 1 }}>
                <span style={{ color: '#C084FC', textShadow: '0px 2px 2px rgba(0,0,0,0.3)' }}>Agro</span><span style={{ color: '#FB923C', textShadow: '0px 2px 2px rgba(0,0,0,0.3)' }}>kart</span>
              </Typography>
            </Box>

            {/* Search Bar */}
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                position: 'relative',
                borderRadius: 30, // More rounded/modern
                backgroundColor: alpha(theme.palette.common.white, 0.15),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.25),
                },
                marginRight: 2,
                marginLeft: 0,
                width: { xs: '100%', sm: 'auto' },
                flexGrow: { sm: 1 },
                maxWidth: { sm: 600 },
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              <Box
                sx={{
                  padding: theme.spacing(0, 3),
                  height: '100%',
                  position: 'absolute',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SearchIcon />
              </Box>
              <InputBase
                placeholder={t('app.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  color: 'inherit',
                  width: '100%',
                  '& .MuiInputBase-input': {
                    padding: theme.spacing(1.5, 1.5, 1.5, 0),
                    paddingLeft: `calc(1em + ${theme.spacing(5)})`,
                    transition: theme.transitions.create('width'),
                    width: '100%',
                  },
                }}
              />
            </Box>

            {/* Location Button */}
            <Button
              startIcon={<LocationOn />}
              endIcon={<KeyboardArrowDown />}
              onClick={handleOpenLoc}
              sx={{
                ml: 2,
                color: 'white',
                display: { xs: 'none', md: 'flex' },
                textTransform: 'none',
                minWidth: 'auto',
                bgcolor: alpha('#fff', 0.1),
                borderRadius: 20,
                px: 2,
                '&:hover': { bgcolor: alpha('#fff', 0.2) }
              }}
            >
              <Box sx={{ textAlign: 'left', lineHeight: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, fontSize: '0.65rem' }}>
                  {t('app.deliveryLoc')}
                </Typography>
                <Typography variant="body2" fontWeight="700">
                  Mumbai 400001
                </Typography>
              </Box>
            </Button>
            <Menu
              anchorEl={anchorElLoc}
              open={Boolean(anchorElLoc)}
              onClose={handleCloseLoc}
              PaperProps={{
                sx: { mt: 1.5, borderRadius: 2, minWidth: 200 }
              }}
            >
              <MenuItem onClick={() => handleSelectLoc('Mumbai 400001')} selected={location === 'Mumbai 400001'}>
                <ListItemIcon><LocationOn fontSize="small" /></ListItemIcon>
                <ListItemText primary="Mumbai 400001" secondary="Default" />
              </MenuItem>
              <MenuItem onClick={() => handleSelectLoc('Pune 411001')} selected={location === 'Pune 411001'}>
                <ListItemIcon><LocationOn fontSize="small" /></ListItemIcon>
                <ListItemText primary="Pune 411001" secondary="Home" />
              </MenuItem>
              <MenuItem onClick={handleCloseLoc}>
                <ListItemIcon><SearchIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Add New Address" />
              </MenuItem>
            </Menu>

            <Box sx={{ flexGrow: 1 }} />

            {/* Language Selector */}
            <Button
              startIcon={<Language />}
              endIcon={<KeyboardArrowDown />}
              onClick={handleOpenLang}
              sx={{
                mr: 2,
                color: 'white',
                display: { xs: 'none', md: 'flex' },
                textTransform: 'none',
                bgcolor: alpha('#fff', 0.1),
                borderRadius: 20,
                px: 2,
                '&:hover': { bgcolor: alpha('#fff', 0.2) }
              }}
            >
              {language}
            </Button>
            <Menu
              anchorEl={anchorElLang}
              open={Boolean(anchorElLang)}
              onClose={handleCloseLang}
              PaperProps={{
                sx: { mt: 1.5, borderRadius: 2, minWidth: 150 }
              }}
            >
              {['EN', 'HI', 'MR'].map((lang) => (
                <MenuItem key={lang} onClick={() => handleSelectLang(lang)} selected={language === lang}>
                  <ListItemText primary={lang === 'EN' ? 'English' : lang === 'HI' ? 'Hindi' : 'Marathi'} />
                  {language === lang && <Check fontSize="small" sx={{ ml: 1 }} />}
                </MenuItem>
              ))}
            </Menu>

            {/* Right Side Icons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Notifications */}
              <IconButton
                sx={{
                  color: 'white',
                  bgcolor: alpha('#fff', 0.1),
                  '&:hover': { bgcolor: alpha('#fff', 0.2) }
                }}
                onClick={() => navigate('/notifications')}
              >
                <Badge badgeContent={3} color="warning">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              {/* Cart */}
              <IconButton
                sx={{
                  color: 'white',
                  bgcolor: alpha('#fff', 0.1),
                  '&:hover': { bgcolor: alpha('#fff', 0.2) }
                }}
                onClick={() => navigate('/cart')}
              >
                <Badge badgeContent={cartCount} color="warning">
                  <CartIcon />
                </Badge>
              </IconButton>

              {/* Profile Avatar */}
              <IconButton
                onClick={() => navigate('/profile')}
                sx={{
                  p: 0,
                  ml: 1,
                  border: '2px solid rgba(255,255,255,0.5)',
                  borderRadius: '50%'
                }}
              >
                <Avatar
                  src={user?.avatar}
                  sx={{
                    width: 45,
                    height: 45,
                    bgcolor: 'white',
                    color: theme.palette.primary.main,
                    fontWeight: 700
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar >

      {/* Sidebar */}
      < CustomerSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          bgcolor: '#f5f5f5',
          minHeight: '100vh',
          width: { sm: `calc(100% - ${sidebarOpen ? 280 : 80}px)` },
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Spacer for Fixed AppBar */}
        <Box sx={{ flex: 1 }}>
          {children}
        </Box>
        {!isMobile && <Footer />}
      </Box>
    </Box >
  );
};

export default CustomerLayout;
