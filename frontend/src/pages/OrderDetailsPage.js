import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  Avatar,
  Divider,
  IconButton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as DeliveredIcon,
  CheckCircle,
  Schedule as PendingIcon,
  Cancel as CancelledIcon,
  Inventory as PackedIcon,
  LocalShippingOutlined as OutForDeliveryIcon,
  HomeOutlined as DeliveredHomeIcon,
  Receipt as OrderIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CreditCard as PaymentIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { getOrderById } from '../services/api';
import TrackingMap from '../components/map/TrackingMap';
import { deliverySimulation } from '../services/deliverySimulation';

// Custom Animated Connector for Stepper
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        `linear-gradient( 95deg,${theme.palette.secondary.main} 0%,${theme.palette.primary.main} 50%,${theme.palette.success.main} 100%)`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        `linear-gradient( 95deg,${theme.palette.secondary.main} 0%,${theme.palette.primary.main} 50%,${theme.palette.success.main} 100%)`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
}));

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tracking State
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState('Calculating...');

  useEffect(() => {
    // Only start simulation if status implies movement
    if (order && (order.status === 'shipped' || order.status === 'out_for_delivery')) {
      const unsubscribe = deliverySimulation.subscribe((loc) => {
        setDriverLocation(loc);
        setEta(`${Math.floor(Math.random() * 10) + 10} mins`); // Mock ETA
      });

      deliverySimulation.startTracking();

      return () => {
        unsubscribe();
        deliverySimulation.stopTracking();
      };
    }
  }, [order]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const response = await getOrderById(orderId, token);
        setOrder(response.data || response);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId, token]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return theme.palette.success.main;
      case 'cancelled': return theme.palette.error.main;
      case 'shipped': return theme.palette.primary.main;
      case 'processing': return theme.palette.info.main;
      default: return theme.palette.warning.main;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'delivered': return alpha(theme.palette.success.main, 0.1);
      case 'cancelled': return alpha(theme.palette.error.main, 0.1);
      case 'shipped': return alpha(theme.palette.primary.main, 0.1);
      case 'processing': return alpha(theme.palette.info.main, 0.1);
      default: return alpha(theme.palette.warning.main, 0.1);
    }
  };

  const getTrackingSteps = (orderStatus) => {
    const baseSteps = [
      { label: 'Placed', icon: <OrderIcon />, date: order?.createdAt },
      { label: 'Confirmed', icon: <CheckCircle /> },
      { label: 'Shipped', icon: <ShippingIcon /> },
      { label: 'Delivered', icon: <DeliveredIcon /> }
    ];

    let activeIndex = 0;
    if (orderStatus === 'confirmed') activeIndex = 1;
    if (orderStatus === 'shipped') activeIndex = 2;
    if (orderStatus === 'delivered') activeIndex = 4; // All done

    return baseSteps.map((step, index) => ({
      ...step,
      completed: index < activeIndex,
      active: index === activeIndex
    }));
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.primary.main }} />
    </Box>
  );


  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.primary.main }} />
    </Box>
  );

  if (!order) return null;

  const statusColor = getStatusColor(order.status || order.orderStatus);
  const statusBg = getStatusBg(order.status || order.orderStatus);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 }, pb: { xs: 10, md: 12 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/my-orders')} sx={{ bgcolor: 'white', boxShadow: 1 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="800">Order Details</Typography>
      </Stack>

      {/* Main Content */}
      <Stack spacing={3} component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Status Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: statusBg,
            border: `1px solid ${alpha(statusColor, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary" fontWeight="600">
              ORDER ID
            </Typography>
            <Typography variant="h6" fontWeight="800">
              #{order.trackingNumber || order._id?.slice(-8).toUpperCase()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </Typography>
          </Box>
          <Chip
            label={(order.status || order.orderStatus || 'Pending').toUpperCase()}
            sx={{
              bgcolor: statusColor,
              color: 'white',
              fontWeight: 'bold',
              borderRadius: 2,
              px: 1,
              height: 32
            }}
          />
        </Paper>

        {/* Tracking Timeline */}
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 4 }}>Order Status</Typography>
          <Stepper alternativeLabel activeStep={order.status === 'delivered' ? 4 : order.status === 'shipped' ? 2 : 1} connector={<ColorlibConnector />}>
            {getTrackingSteps(order.status).map((step) => (
              <Step key={step.label}>
                <StepLabel StepIconComponent={() => (
                  <Avatar sx={{
                    bgcolor: step.completed || step.active ? theme.palette.primary.main : theme.palette.grey[200],
                    color: step.completed || step.active ? 'white' : theme.palette.grey[500],
                    width: 40, height: 40
                  }}>
                    {step.icon}
                  </Avatar>
                )}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>{step.label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Live Tracking Map */}
        {(order.status === 'shipped' || order.status === 'out_for_delivery') && (
          <Paper elevation={0} sx={{ height: 400, mb: 3, borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            {driverLocation ? (
              <TrackingMap
                deliveryLocation={driverLocation}
                pickupLocation={{ lat: 18.5204, lng: 73.8567 }} // Example Start
                dropoffLocation={{ lat: 18.5100, lng: 73.8460 }} // Example End
                partnerDetails={{
                  name: 'Ramesh Driver',
                  vehicleNumber: 'MH-12-DT-9999',
                  phone: '9876543210',
                  photo: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png'
                }}
                eta={eta}
              />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%" bgcolor="#f5f5f5">
                <Typography>Connecting to live tracking...</Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* Items */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Items ordered</Typography>
          <Stack spacing={3}>
            {order.items?.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2 }}>
                <Avatar
                  src={item.product?.images?.[0] || '/placeholder.png'}
                  variant="rounded"
                  sx={{ width: 80, height: 80, borderRadius: 3, bgcolor: '#f5f5f5' }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">{item.product?.name || item.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {item.quantity} &bull; {item.product?.unit || 'Unit'}
                  </Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ mt: 1 }}>
                    ₹{item.price * item.quantity}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* Delivery & Payment Info */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                  <LocationIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Delivery Address</Typography>
                  <Typography variant="body1" fontWeight="600" sx={{ mt: 0.5 }}>
                    {order.deliveryAddress?.street}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }}>
                  <PaymentIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Payment Info</Typography>
                  <Typography variant="body1" fontWeight="600" sx={{ mt: 0.5 }}>
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="800" sx={{ mt: 0.5, color: 'success.main' }}>
                    Total: ₹{order.totalAmount}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Help Section */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: '#f8f9fa',
            border: '1px dashed #ced4da',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            cursor: 'pointer'
          }}
          onClick={() => window.open('mailto:support@agrokart.com')}
        >
          <HelpIcon color="action" />
          <Typography variant="body2" fontWeight="600" color="text.secondary">
            Need help with this order? Contact Support
          </Typography>
        </Paper>

      </Stack>
    </Container>
  );
};

export default OrderDetailsPage;
