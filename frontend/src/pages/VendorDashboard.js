import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
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
  Menu,
  MenuItem,
  Stack,
  Divider,
  useTheme
} from '@mui/material';
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
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  TrendingUp,
  LocalShipping
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import theme from '../theme'; // Using the main theme we just updated

const drawerWidth = 280;

// Animated Components
const MotionCard = motion(Card);
const MotionBox = motion(Box);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const VendorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const themeInstance = useTheme(); // Access the active theme
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon /> },
    { text: 'Products', icon: <ProductsIcon /> },
    { text: 'Orders', icon: <OrdersIcon /> },
    { text: 'Analytics', icon: <AnalyticsIcon /> },
    { text: 'Settings', icon: <MoreVertIcon /> }
  ];

  const drawerContent = (
    <Box sx={{
      height: '100%',
      background: 'linear-gradient(180deg, #1B5E20 0%, #0D3310 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <MotionBox
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          sx={{
            width: 48,
            height: 48,
            bgcolor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            color: '#4CAF50',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}
        >
          V
        </MotionBox>
        <Typography variant="h5" fontWeight="800" sx={{ letterSpacing: '0.5px' }}>
          Vendor<span style={{ color: '#4CAF50' }}>Pro</span>
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={motion.div}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              selected={activeTab === index}
              onClick={() => setActiveTab(index)}
              sx={{
                borderRadius: '12px',
                py: 1.5,
                '&.Mui-selected': {
                  background: 'linear-gradient(90deg, #4CAF50 0%, rgba(76, 175, 80, 0) 100%)',
                  borderLeft: '4px solid #fff',
                  '&:hover': { background: 'linear-gradient(90deg, #4CAF50 0%, rgba(76, 175, 80, 0.2) 100%)' }
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.05)'
                }
              }}
            >
              <ListItemIcon sx={{ color: activeTab === index ? 'white' : 'rgba(255,255,255,0.6)', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: activeTab === index ? 700 : 500,
                  fontSize: '0.95rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 3 }}>
        <Card sx={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          color: 'white'
        }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ opacity: 0.7, mb: 1 }}>Monthly Revenue</Typography>
            <Typography variant="h4" fontWeight="bold">₹45,230</Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
              <TrendingUp sx={{ color: '#4CAF50', fontSize: '1.2rem' }} />
              <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>+15% vs last month</Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        display: 'flex', minHeight: '100vh', bgcolor: 'background.default',
        backgroundImage: 'radial-gradient(at 0% 0%, hsla(115,39%,90%,1) 0, transparent 50%), radial-gradient(at 50% 100%, hsla(258,40%,94%,1) 0, transparent 50%)'
      }}>

        {/* Top Navbar */}
        <AppBar position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            ...theme.glass(0.8),
            boxShadow: 'none',
            borderBottom: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <Toolbar sx={{ height: 80 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' }, color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" color="text.primary" fontWeight="800">
                Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome back, {user?.name || 'Partner'}! 👋
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: '12px', px: 3, background: theme.palette.primary.main }}>
                  Add Product
                </Button>
              </motion.div>

              <IconButton size="large" sx={{ bgcolor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <NotificationsIcon color="action" />
              </IconButton>

              <Box
                onClick={handleProfileMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  p: 0.5,
                  pr: 2,
                  borderRadius: '30px',
                  bgcolor: 'background.paper',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: '0.2s',
                  '&:hover': { bgcolor: 'background.white', transform: 'translateY(-1px)' }
                }}
              >
                <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                  {user?.name?.charAt(0) || 'V'}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="subtitle2" fontWeight="700" color="text.primary">
                    {user?.name || 'Vendor Name'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Verified Seller
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
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfileMenuClose} sx={{ py: 1.5, px: 2.5, fontWeight: 500 }}>Profile</MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 2.5, fontWeight: 500, color: 'error.main' }}>Logout</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
            }}
          >
            {drawerContent}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Main Content Area */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: 10 }}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Stats Overview */}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Overview</Typography>
            <Grid container spacing={3} sx={{ mb: 5 }}>
              {[
                { label: 'Total Revenue', value: '₹45,230', icon: MoneyIcon, color: '#1B5E20', bg: '#E8F5E9' },
                { label: 'Active Orders', value: '12', icon: LocalShipping, color: '#1565C0', bg: '#E3F2FD' },
                { label: 'Total Products', value: '24', icon: ProductsIcon, color: '#E65100', bg: '#FFF3E0' },
                { label: 'Total Customers', value: '156', icon: CustomersIcon, color: '#6A1B9A', bg: '#F3E5F5' }
              ].map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <MotionCard
                    variants={itemVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    sx={{ height: '100%', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar sx={{ bgcolor: stat.bg, color: stat.color, width: 48, height: 48, borderRadius: '12px' }}>
                          <stat.icon />
                        </Avatar>
                        <Chip label="+2.5%" size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 'bold' }} />
                      </Box>
                      <Typography variant="h4" fontWeight="800" sx={{ mb: 0.5 }}>{stat.value}</Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight="500">{stat.label}</Typography>
                    </CardContent>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>

            {/* Recent Orders Section */}
            <MotionCard variants={itemVariants}>
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                <Box>
                  <Typography variant="h6" fontWeight="700">Recent Orders</Typography>
                  <Typography variant="body2" color="text.secondary">Manage your latest transactions</Typography>
                </Box>
                <Button endIcon={<ArrowForwardIcon />} sx={{ fontWeight: 600 }}>View All</Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Order ID</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Customer</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Product</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Amount</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { id: '#ORD-001', customer: 'Ram Kumar', product: 'Organic Tomatoes', amount: '₹450', status: 'Pending', statusColor: 'warning' },
                      { id: '#ORD-002', customer: 'Priya Sharma', product: 'Fresh Potatoes', amount: '₹375', status: 'Processing', statusColor: 'info' },
                      { id: '#ORD-003', customer: 'Suresh Patel', product: 'Onions 5kg', amount: '₹300', status: 'Delivered', statusColor: 'success' },
                      { id: '#ORD-004', customer: 'Anjali Singh', product: 'Basmati Rice', amount: '₹1200', status: 'Delivered', statusColor: 'success' },
                    ].map((row, i) => (
                      <TableRow key={row.id} hover component={motion.tr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                        <TableCell fontWeight="600">{row.id}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>{row.customer[0]}</Avatar>
                            <Typography variant="body2" fontWeight="500">{row.customer}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{row.product}</TableCell>
                        <TableCell fontWeight="700">{row.amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            color={row.statusColor}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, borderRadius: '8px' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small"><MoreVertIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MotionCard>

          </motion.div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default VendorDashboard;