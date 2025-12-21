import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import {
  Box,
  Container,
  Grid,
  Paper,
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
  Tabs,
  Tab
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
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import dashboardTheme from '../theme/dashboardTheme';

// Sidebar width
const drawerWidth = 280;

const VendorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(dashboardTheme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Sidebar Content
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            color: 'black'
          }}
        >
          V
        </Box>
        <Typography variant="h6" fontWeight="bold" color="inherit">
          Vendor Panel
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
        {['Dashboard', 'Products', 'Orders', 'Analytics', 'Settings'].map((text, index) => (
          <ListItem key={text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={activeTab === index}
              onClick={() => setActiveTab(index)}
            >
              <ListItemIcon>
                {index === 0 ? <DashboardIcon /> :
                  index === 1 ? <ProductsIcon /> :
                    index === 2 ? <OrdersIcon /> :
                      index === 3 ? <AnalyticsIcon /> : <MoreVertIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2 }}>
        <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', border: 'none' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
              Monthly Revenue
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
              ₹45,230
            </Typography>
            <Chip
              label="+15% vs last month"
              size="small"
              sx={{ bgcolor: 'white', color: 'black', fontWeight: 'bold' }}
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={dashboardTheme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

        {/* Mobile AppBar */}
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" color="black" noWrap>
                Dashboard
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ display: { xs: 'none', sm: 'flex' }, mr: 1 }}
              >
                Add Product
              </Button>
              <IconButton size="large" color="inherit">
                <NotificationsIcon />
              </IconButton>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ bgcolor: 'black', width: 32, height: 32 }}>
                  {user?.name?.charAt(0) || 'V'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleProfileMenuClose}>Profile</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Sidebar Drawer */}
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
            p: 3,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            mt: 8
          }}
        >
          <Container maxWidth="xl" disableGutters>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                Store Performance
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Overview of your store's sales and inventory status.
              </Typography>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { label: 'Total Revenue', value: '₹45,230', icon: MoneyIcon },
                { label: 'Active Orders', value: '12', icon: OrdersIcon },
                { label: 'Total Products', value: '24', icon: ProductsIcon },
                { label: 'Total Customers', value: '156', icon: CustomersIcon }
              ].map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {stat.label}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {stat.value}
                        </Typography>
                      </Box>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(0,0,0,0.04)',
                        color: 'black'
                      }}>
                        <stat.icon />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Recent Orders Table */}
            <Card sx={{ mb: 4 }}>
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Recent Orders</Typography>
                <Button endIcon={<ArrowForwardIcon />} color="inherit">
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { id: 'ORD001', customer: 'Ram Kumar', product: 'Organic Tomatoes', amount: '₹450', status: 'Pending' },
                      { id: 'ORD002', customer: 'Priya Sharma', product: 'Fresh Potatoes', amount: '₹375', status: 'Processing' },
                      { id: 'ORD003', customer: 'Suresh Patel', product: 'Onions', amount: '₹300', status: 'Delivered' }
                    ].map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell fontWeight="medium">{row.id}</TableCell>
                        <TableCell>{row.customer}</TableCell>
                        <TableCell>{row.product}</TableCell>
                        <TableCell fontWeight="bold">{row.amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              bgcolor: row.status === 'Delivered' ? 'rgba(46, 125, 50, 0.1)' :
                                row.status === 'Processing' ? 'rgba(2, 136, 209, 0.1)' : 'rgba(237, 108, 2, 0.1)',
                              color: row.status === 'Delivered' ? 'success.main' :
                                row.status === 'Processing' ? 'info.main' : 'warning.main',
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small">
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default VendorDashboard;