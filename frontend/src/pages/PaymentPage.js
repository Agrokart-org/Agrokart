import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Card,
  CardContent,
  IconButton,
  useTheme,
  Alert,
  Snackbar,
  Stack,
  alpha,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  LocalAtm as CashIcon,
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  LocalShipping as ShippingIcon,
  Support as SupportIcon,
  VerifiedUser as VerifiedUserIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createPaymentOrder, verifyPayment } from '../services/api';

const PaymentPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { cart, getCartTotal } = useCart();
  const { user, token } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 5000 ? 0 : 200;
  const total = subtotal + deliveryFee;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      if (paymentMethod === 'cod') {
        // Handle COD directly
        proceedToOrderCreation('cod');
        return;
      }

      // Handle Online Payment (Razorpay)
      // 0. CHECK CONFIGURATION
      const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
      if (!razorpayKey || razorpayKey === 'rzp_test_PLACEHOLDER') {
        console.error('Razorpay key is missing or invalid');
        setSnackbar({
          open: true,
          message: 'Payment system configuration error (Missing Key). Please contact support.',
          severity: 'error'
        });
        setIsProcessing(false);
        return;
      }

      const res = await loadRazorpayScript();

      if (!res) {
        setSnackbar({ open: true, message: 'Razorpay SDK failed to load. Are you online?', severity: 'error' });
        setIsProcessing(false);
        return;
      }

      // 1. Create Order on Backend
      const order = await createPaymentOrder(total, token);

      if (!order || !order.id) {
        setSnackbar({ open: true, message: 'Server error. Are you online?', severity: 'error' });
        setIsProcessing(false);
        return;
      }

      // 2. Initialize Razorpay Options
      const options = {
        key: razorpayKey, // Use the validated key
        amount: order.amount,
        currency: order.currency,
        name: 'Agrokart',
        description: 'Fertilizer Purchase',
        image: '/logo192.png', // Ensure this exists or use a URL
        order_id: order.id,
        handler: async function (response) {
          // 3. Verify Payment
          try {
            const verification = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, token);

            if (verification.status === 'success') {
              proceedToOrderCreation('online');
            } else {
              setSnackbar({ open: true, message: 'Payment verification failed', severity: 'error' });
              setIsProcessing(false);
            }
          } catch (error) {
            console.error('Verification Error:', error);
            setSnackbar({ open: true, message: 'Payment verification failed', severity: 'error' });
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: theme.palette.primary.main
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      try {
        const paymentObject = new window.Razorpay(options);

        // Handle Razorpay modal close and failures
        paymentObject.on('payment.failed', function (response) {
          console.error('Razorpay Payment Failed:', response.error);
          setSnackbar({
            open: true,
            message: response.error.description || 'Payment Failed. Please try again.',
            severity: 'error'
          });
          setIsProcessing(false);
        });

        paymentObject.open();
      } catch (razorpayError) {
        console.error('Razorpay Initialization Error:', razorpayError);
        setSnackbar({
          open: true,
          message: 'Failed to initialize payment gateway. Please try again.',
          severity: 'error'
        });
        setIsProcessing(false);
      }

    } catch (error) {
      console.error('Payment Error:', error);
      // Ensure we don't show a generic alert, use Snackbar
      setSnackbar({ open: true, message: error.message || 'Payment processing failed', severity: 'error' });
      setIsProcessing(false);
    }
  };

  const proceedToOrderCreation = (method) => {
    // Store payment info for OrderConfirmationPage
    localStorage.setItem('paymentMethod', method);

    // We don't clear the cart here; OrderConfirmationPage handles the actual API call to create the internal order
    // and then clears the cart. 
    // NOTE: Ideally, the verification backend step should also create the order to ensure atomicity,
    // but keeping with the existing architecture where OrderConfirmationPage creates the order.

    localStorage.setItem('orderCartItems', JSON.stringify(cart));

    setPaymentSuccess(true);
    setTimeout(() => {
      navigate('/order-confirmation');
    }, 1500);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const features = [
    {
      icon: <SecurityIcon color="primary" />,
      title: 'Secure Payment',
      description: 'Your payment information is encrypted and secure'
    },
    {
      icon: <ShippingIcon color="primary" />,
      title: 'Fast Delivery',
      description: 'Get your fertilizers delivered to your farm'
    },
    {
      icon: <SupportIcon color="primary" />,
      title: '24/7 Support',
      description: 'Our team is always here to help you'
    }
  ];

  // Show payment success screen
  if (paymentSuccess) {
    return (
      <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="success.main">
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Processing your order and redirecting to confirmation page...
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress color="primary" />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: '#e8f5e9',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f1f8e9' } }}>
            <ArrowBackIcon color="primary" />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700, color: '#2E7D32' }}>
            <PaymentIcon />
            Secure Payment
          </Typography>
        </Paper>

        <Grid container spacing={4}>
          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                position: 'sticky',
                top: 20,
                bgcolor: '#e8f5e9',
                borderRadius: 3,
                border: '1px solid #c8e6c9'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: '#2E7D32' }}>
                <VerifiedUserIcon />
                Order Summary
              </Typography>
              <Stack spacing={2}>
                {cart.map((item) => (
                  <Box
                    key={item.cartItemId}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'rgba(46, 125, 50, 0.05)'
                      }
                    }}
                  >
                    <Typography>
                      {item.name} x {item.quantity}
                    </Typography>
                    <Typography>₹{item.price * item.quantity}</Typography>
                  </Box>
                ))}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Subtotal</Typography>
                  <Typography>₹{subtotal}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Delivery</Typography>
                  <Typography color={deliveryFee === 0 ? 'success.main' : 'inherit'}>
                    {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6" color="primary">
                    ₹{total}
                  </Typography>
                </Box>
                {deliveryFee > 0 && (
                  <Alert severity="info">
                    Add ₹{5000 - subtotal} more to get free delivery!
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Payment Form */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                mb: 3,
                bgcolor: 'white',
                borderRadius: 3
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, mb: 3 }}>
                <PaymentIcon color="primary" />
                Select Payment Method
              </Typography>
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      mb: 2.5,
                      border: paymentMethod === 'online' ? '2px solid #2E7D32' : '1px solid #e0e0e0',
                      bgcolor: paymentMethod === 'online' ? '#f1f8e9' : 'white',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: '#f1f8e9',
                        borderColor: '#2E7D32',
                        cursor: 'pointer',
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => setPaymentMethod('online')}
                  >
                    <CardContent sx={{ pb: '16px !important', display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        value="online"
                        control={<Radio sx={{ color: '#2E7D32', '&.Mui-checked': { color: '#2E7D32' } }} />}
                        label=""
                        sx={{ mr: 1, ml: 0 }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{ bgcolor: 'white', p: 1, borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                          <WalletIcon color="primary" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="700" color={paymentMethod === 'online' ? 'primary.main' : 'text.primary'}>
                            Pay Online
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Cards, UPI, Netbanking (Powered by Razorpay)
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card
                    variant="outlined"
                    sx={{
                      border: paymentMethod === 'cod' ? '2px solid #2E7D32' : '1px solid #e0e0e0',
                      bgcolor: paymentMethod === 'cod' ? '#f1f8e9' : 'white',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: '#f1f8e9',
                        borderColor: '#2E7D32',
                        cursor: 'pointer',
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <CardContent sx={{ pb: '16px !important', display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        value="cod"
                        control={<Radio sx={{ color: '#2E7D32', '&.Mui-checked': { color: '#2E7D32' } }} />}
                        label=""
                        sx={{ mr: 1, ml: 0 }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{ bgcolor: 'white', p: 1, borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                          <CashIcon color="primary" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="700" color={paymentMethod === 'cod' ? 'primary.main' : 'text.primary'}>
                            Cash on Delivery
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Pay cash when order is delivered
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </FormControl>

              <Box sx={{ mt: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
                  onClick={handlePayment}
                  disabled={isProcessing}
                  sx={{
                    py: 1.8,
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    bgcolor: '#2E7D32',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.4)',
                    '&:hover': {
                      bgcolor: '#1B5E20',
                      boxShadow: '0 6px 16px rgba(46, 125, 50, 0.6)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  {isProcessing ? 'Processing Payment...' : `Pay ₹${total}`}
                </Button>
                <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 2, color: 'text.secondary' }}>
                  <SecurityIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Secure SSL Payment. Your data is protected.
                </Typography>
              </Box>
            </Paper>

            {/* Features Section */}
            <Grid container spacing={2} sx={{ mt: 4 }}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'white',
                      borderRadius: 3,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        transition: 'transform 0.2s ease-in-out',
                        boxShadow: 2
                      }
                    }}
                  >
                    {feature.icon}
                    <Typography variant="h6">{feature.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default PaymentPage;
