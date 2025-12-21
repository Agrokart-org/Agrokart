import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Box,
  Container,
  Grid,
  Paper,
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
  FormControlLabel,
  Fab,
  LinearProgress,
  Stack,
  Badge,
  Divider,
  useMediaQuery // Added useMediaQuery
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  Navigation as NavigationIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Notifications as NotificationsIcon,
  accountCircle as ProfileIcon, // Fixed typo
  AccountCircle as AccountCircleIcon, // Correct icon
  History as HistoryIcon,
  AccountBalanceWallet as WalletIcon,
  GpsFixed as GpsIcon,
  Directions as DirectionsIcon,
  CheckCircle as CheckCircleIcon,
  PowerSettingsNew as PowerIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import dashboardTheme from '../theme/dashboardTheme';

const DeliveryDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);

  // Use media query for responsive layout
  const isMobile = useMediaQuery(dashboardTheme.breakpoints.down('sm'));

  const handleOnlineToggle = (event) => {
    setIsOnline(event.target.checked);
  };

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

  // Modern Card Component Helper
  const StatCard = ({ icon: Icon, value, label, subtitle }) => (
    <Card sx={{
      height: '100%',
      borderRadius: 4,
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-4px)' }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: 3,
            bgcolor: 'action.hover',
            color: 'text.primary'
          }}>
            <Icon />
          </Box>
          <Typography variant="h4" fontWeight="800">
            {value}
          </Typography>
        </Box>
        <Typography variant="subtitle1" fontWeight="600" color="text.primary">
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <ThemeProvider theme={dashboardTheme}>
      <Box sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        pb: 4
      }}>
        {/* Modern App Header */}
        <AppBar position="sticky" color="inherit" elevation={0} sx={{
          bgcolor: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar src={user?.avatar} sx={{ width: 40, height: 40, border: '2px solid #000' }}>
                {user?.name?.charAt(0) || 'D'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
                  {user?.name || 'Delivery Partner'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ready to deliver
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{
                bgcolor: isOnline ? 'success.light' : 'action.disabledBackground',
                color: isOnline ? 'success.dark' : 'text.disabled',
                py: 0.5, px: 2,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}>
                <Box sx={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  bgcolor: 'currentColor',
                  boxShadow: isOnline ? '0 0 8px currentColor' : 'none'
                }} />
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Box>
              <Switch
                checked={isOnline}
                onChange={handleOnlineToggle}
                color="default"
              />
              <IconButton onClick={() => { logout(); navigate('/'); }}>
                <PowerIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 3 }}>
          {/* Status Overview */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              {!isOnline ? (
                <Card sx={{
                  borderRadius: 4,
                  bgcolor: 'black',
                  color: 'white',
                  textAlign: 'center',
                  py: 6,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      You are currently Offline
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.7, mb: 3 }}>
                      Go online to start receiving delivery requests nearby.
                    </Typography>
                    <Button
                      variant="contained"
                      color="inherit"
                      size="large"
                      onClick={() => setIsOnline(true)}
                      sx={{
                        color: 'black',
                        fontWeight: 'bold',
                        px: 4,
                        py: 1.5,
                        borderRadius: 50
                      }}
                    >
                      GO ONLINE
                    </Button>
                  </Box>
                  {/* Decorative circles */}
                  <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                  <Box sx={{ position: 'absolute', bottom: -50, left: -50, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                </Card>
              ) : (
                <Card sx={{
                  borderRadius: 4,
                  border: '1px solid rgba(0,0,0,0.1)',
                  overflow: 'visible'
                }}>
                  <Box sx={{ p: 2, bgcolor: 'black', color: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Current Order
                    </Typography>
                    <Chip
                      label="In Transit"
                      size="small"
                      sx={{ bgcolor: 'white', color: 'black', fontWeight: 'bold' }}
                    />
                  </Box>
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Box>
                          <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {activeOrder.timeRemaining}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Expected Delivery Time
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {activeOrder.earnings}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Estimated Earnings
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ position: 'relative', pl: 2, borderLeft: '2px dashed #ddd', ml: 1, my: 3 }}>
                        <Box sx={{ position: 'absolute', left: -7, top: -5, bgcolor: 'success.main', width: 12, height: 12, borderRadius: '50%' }} />
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>PICKUP</Typography>
                          <Typography variant="subtitle2" fontWeight="bold">{activeOrder.pickup}</Typography>
                        </Box>

                        <Box sx={{ position: 'absolute', left: -7, bottom: 5, bgcolor: 'error.main', width: 12, height: 12, borderRadius: '50%' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>DROPOFF</Typography>
                          <Typography variant="subtitle2" fontWeight="bold">{activeOrder.dropoff}</Typography>
                          <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>Customer: {activeOrder.customer}</Typography>
                        </Box>
                      </Box>

                      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<DirectionsIcon />}
                          sx={{ bgcolor: 'black', '&:hover': { bgcolor: '#333' }, py: 1.5, borderRadius: 2 }}
                        >
                          Navigate
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<PhoneIcon />}
                          sx={{ borderColor: '#ddd', color: 'black', py: 1.5, borderRadius: 2 }}
                        >
                          Call
                        </Button>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Quick Actions & earnings summary */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <StatCard
                  icon={WalletIcon}
                  value="₹1,240"
                  label="Today's Earnings"
                  subtitle="4 orders completed"
                />

                <Card sx={{ borderRadius: 4, p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      { icon: HistoryIcon, label: 'History' },
                      { icon: AccountCircleIcon, label: 'Profile' },
                      { icon: NotificationsIcon, label: 'Alerts' },
                      { icon: CheckCircleIcon, label: 'Support' }
                    ].map((action, i) => (
                      <Grid item xs={6} key={i}>
                        <Button
                          fullWidth
                          variant="outlined"
                          sx={{
                            flexDirection: 'column',
                            py: 2,
                            borderRadius: 3,
                            borderColor: '#eee',
                            color: 'text.primary',
                            '&:hover': { borderColor: 'black', bgcolor: 'transparent' }
                          }}
                        >
                          <action.icon sx={{ mb: 1, fontSize: 28 }} />
                          <Typography variant="caption" fontWeight="bold">{action.label}</Typography>
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default DeliveryDashboard;