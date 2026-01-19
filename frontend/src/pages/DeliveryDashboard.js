import React, { useState, useRef } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Button,
  Chip,
  AppBar,
  Toolbar,
  Switch,
  Stack,
  useMediaQuery,
  Menu,
  MenuItem,
  Divider,
  Paper
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  Navigation as NavigationIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  History as HistoryIcon,
  AccountBalanceWallet as WalletIcon,
  GpsFixed as GpsIcon,
  Directions as DirectionsIcon,
  CheckCircle as CheckCircleIcon,
  PowerSettingsNew as PowerIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import theme from '../theme';
import MobileDeliveryDashboard from './MobileDeliveryDashboard';

// Animations
const MotionCard = motion(Card);
const MotionBox = motion(Box);



const DeliveryDashboard = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const simulationInterval = useRef(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return <MobileDeliveryDashboard />;
  }

  // Simulation Path
  const simulationPath = [
    { lat: 18.5204, lng: 73.8567 },
    { lat: 18.5210, lng: 73.8570 },
    { lat: 18.5215, lng: 73.8575 },
    { lat: 18.5220, lng: 73.8580 },
    { lat: 18.5225, lng: 73.8585 },
    { lat: 18.5230, lng: 73.8590 },
    { lat: 18.5235, lng: 73.8595 },
    { lat: 18.5240, lng: 73.8600 },
    { lat: 18.5245, lng: 73.8605 },
    { lat: 18.5250, lng: 73.8610 },
  ];

  const handleOnlineToggle = (event) => {
    const online = event.target.checked;
    setIsOnline(online);

    if (online && socket) {
      socket.emit('join_tracking', '2024-889');
    } else if (socket) {
      socket.emit('leave_tracking', '2024-889');
      stopSimulation();
    }
  };

  const startSimulation = () => {
    if (!socket || !isOnline) {
      alert("Please go ONLINE first!");
      return;
    }

    if (isSimulating) {
      stopSimulation();
      return;
    }

    setIsSimulating(true);
    let index = 0;

    simulationInterval.current = setInterval(() => {
      if (index >= simulationPath.length) index = 0;
      const loc = simulationPath[index];
      socket.emit('update_location', {
        orderId: '2024-889',
        latitude: loc.lat,
        longitude: loc.lng,
        heading: 0,
        speed: 40
      });
      index++;
    }, 2000);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
  };

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const activeOrder = {
    id: '#ORD-2024-889',
    customer: 'Rahul Kumar',
    pickup: 'Green Fields Farm, Sector 4',
    dropoff: 'Blue Ridge Apartments, Block C',
    distance: '4.2 km',
    earnings: '₹85',
    status: 'In Transit',
    timeRemaining: '12 mins'
  };

  const StatCard = ({ icon: Icon, value, label, subtitle, color }) => (
    <MotionCard
      whileHover={{ y: -5 }}
      sx={{
        height: '100%',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
      }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: `${color}15`, color: color }}>
            <Icon />
          </Box>
          <Typography variant="h4" fontWeight="800">{value}</Typography>
        </Box>
        <Typography variant="subtitle1" fontWeight="700">{label}</Typography>
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
      </CardContent>
    </MotionCard>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F4F7F5 0%, #E8F5E9 100%)',
        pb: 4
      }}>
        {/* Modern App Header */}
        <AppBar position="sticky" sx={{ ...theme.glass(0.9), boxShadow: 'none' }}>
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                src={user?.avatar}
                sx={{
                  width: 48,
                  height: 48,
                  border: `2px solid ${theme.palette.primary.main}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {user?.name?.charAt(0) || 'D'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="800" lineHeight={1.2}>
                  {user?.name || 'Delivery Partner'}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isOnline ? '#00C853' : '#B0BEC5' }} />
                  <Typography variant="caption" fontWeight="600" color={isOnline ? 'success.main' : 'text.secondary'}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={isOnline} onChange={handleOnlineToggle} color="success" />
              <IconButton onClick={handleProfileMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' } }}
        >
          <MenuItem onClick={logout}>Logout</MenuItem>
        </Menu>

        <Container maxWidth="md" sx={{ mt: 3 }}>
          <AnimatePresence mode="wait">
            {!isOnline ? (
              <MotionBox
                key="offline"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 100 }}
              >
                <Card sx={{
                  borderRadius: '32px',
                  background: 'linear-gradient(135deg, #263238 0%, #000000 100%)',
                  color: 'white',
                  textAlign: 'center',
                  py: 8,
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}>
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <DeliveryIcon sx={{ fontSize: 60, mb: 2, opacity: 0.8 }} />
                    </motion.div>
                    <Typography variant="h4" fontWeight="800" gutterBottom>You are Offline</Typography>
                    <Typography variant="body1" sx={{ opacity: 0.7, mb: 4 }}>Go online to start earning!</Typography>
                    <Button
                      variant="contained"
                      onClick={() => handleOnlineToggle({ target: { checked: true } })}
                      sx={{
                        background: 'white',
                        color: 'black',
                        fontWeight: '800',
                        fontSize: '1.1rem',
                        px: 4, py: 1.5,
                        borderRadius: '50px',
                        '&:hover': { background: '#f5f5f5', transform: 'scale(1.05)' }
                      }}
                    >
                      GO ONLINE
                    </Button>
                  </Box>
                </Card>
              </MotionBox>
            ) : (
              <MotionBox
                key="online"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ staggerChildren: 0.1 }}
              >
                {/* Active Order Card */}
                <MotionCard
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  sx={{
                    borderRadius: '24px',
                    overflow: 'visible',
                    boxShadow: '0 12px 32px rgba(46, 125, 50, 0.15)',
                    mb: 4,
                    border: '1px solid rgba(46, 125, 50, 0.2)'
                  }}
                >
                  <Box sx={{
                    p: 2,
                    background: 'linear-gradient(90deg, #2E7D32 0%, #43A047 100%)',
                    color: 'white',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="subtitle1" fontWeight="700">Current Order</Typography>
                    <Chip label="In Transit" size="small" sx={{ bgcolor: 'white', color: '#2E7D32', fontWeight: 'bold' }} />
                  </Box>

                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 3 }}>
                      {/* Time and Earnings */}
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                          <Typography variant="h4" fontWeight="800" color="text.primary">{activeOrder.timeRemaining}</Typography>
                          <Typography variant="caption" fontWeight="600" color="text.secondary">EST. TIME</Typography>
                        </Grid>
                        <Grid item xs={6} textAlign="right">
                          <Typography variant="h4" fontWeight="800" color="success.main">{activeOrder.earnings}</Typography>
                          <Typography variant="caption" fontWeight="600" color="text.secondary">EARNINGS</Typography>
                        </Grid>
                      </Grid>

                      {/* Timeline */}
                      <Box sx={{ position: 'relative', pl: 3, borderLeft: '3px dashed #E0E0E0', ml: 1, my: 3 }}>
                        <Box sx={{ position: 'absolute', left: -9, top: -5, bgcolor: '#4CAF50', width: 16, height: 16, borderRadius: '50%', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="700" letterSpacing={1}>PICKUP</Typography>
                          <Typography variant="subtitle1" fontWeight="700">{activeOrder.pickup}</Typography>
                        </Box>

                        <Box sx={{ position: 'absolute', left: -9, bottom: 5, bgcolor: '#FF5722', width: 16, height: 16, borderRadius: '50%', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight="700" letterSpacing={1}>DROPOFF</Typography>
                          <Typography variant="subtitle1" fontWeight="700">{activeOrder.dropoff}</Typography>
                          <Typography variant="body2" color="text.secondary">Customer: {activeOrder.customer}</Typography>
                        </Box>
                      </Box>

                      {/* Actions */}
                      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<DirectionsIcon />}
                          sx={{
                            bgcolor: '#1976D2',
                            py: 1.5,
                            borderRadius: '16px',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                          }}
                        >
                          Navigate
                        </Button>
                        <Button
                          fullWidth
                          variant={isSimulating ? "contained" : "outlined"}
                          color={isSimulating ? "error" : "primary"}
                          onClick={startSimulation}
                          startIcon={<GpsIcon />}
                          sx={{ py: 1.5, borderRadius: '16px', borderWidth: '2px' }}
                        >
                          {isSimulating ? "Stop" : "Simulate"}
                        </Button>
                      </Stack>
                    </Box>
                  </CardContent>
                </MotionCard>

                {/* Earnings & Actions Grid */}
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <StatCard icon={WalletIcon} value="₹1,240" label="Today's Earnings" subtitle="4 orders completed" color="#FF9800" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {/* Quick Actions Panel */}
                    <MotionCard whileHover={{ y: -5 }} sx={{ height: '100%', borderRadius: '24px', ...theme.glass(1) }}>
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 2 }}>Quick Actions</Typography>
                        <Grid container spacing={1}>
                          {[
                            { icon: HistoryIcon, label: 'History' },
                            { icon: NotificationsIcon, label: 'Alerts' },
                            { icon: CheckCircleIcon, label: 'Support' },
                            { icon: AccountCircleIcon, label: 'Profile' }
                          ].map((action, i) => (
                            <Grid item xs={6} key={i}>
                              <Paper
                                elevation={0}
                                component={motion.div}
                                whileTap={{ scale: 0.95 }}
                                sx={{
                                  p: 1.5,
                                  textAlign: 'center',
                                  bgcolor: '#F5F5F5',
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: '#EEEEEE' }
                                }}
                              >
                                <action.icon sx={{ fontSize: 24, mb: 0.5, color: 'text.secondary' }} />
                                <Typography variant="caption" display="block" fontWeight="600">{action.label}</Typography>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </MotionCard>
                  </Grid>
                </Grid>
              </MotionBox>
            )}
          </AnimatePresence>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default DeliveryDashboard;