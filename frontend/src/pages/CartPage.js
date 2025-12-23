import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Divider,
  Paper,
  useTheme,
  Snackbar,
  Alert,
  Stack,
  alpha,
  Chip,
  Fade,
  Grow,
  Zoom
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  ArrowBack as ArrowBackIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  RemoveShoppingCart as EmptyCartIcon
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

const CartPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { cart = [], removeFromCart, updateQuantity, getCartTotal } = useCart();

  const handleQuantityChange = (cartItemId, change) => {
    if (!cart || cart.length === 0) return;
    const item = cart.find(item => item.cartItemId === cartItemId);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity > 0) {
        updateQuantity(cartItemId, newQuantity);
      }
    }
  };

  const handleRemoveItem = (cartItemId) => {
    removeFromCart(cartItemId);
    setSnackbar({
      open: true,
      message: 'Item removed from cart',
      severity: 'success'
    });
  };

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 5000 ? 0 : 200;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    navigate('/delivery-details');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F7FA', py: 4 }}>
      <Container maxWidth="lg">
        {/* Modern Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => navigate(-1)} 
              sx={{
                bgcolor: 'white',
                color: '#2E7D32',
                '&:hover': {
                  bgcolor: alpha('#2E7D32', 0.1),
                  transform: 'translateX(-4px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="700" sx={{ mb: 0.5 }}>
                Shopping Cart
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {cart?.length || 0} {cart?.length === 1 ? 'item' : 'items'} in your cart
              </Typography>
            </Box>
          </Box>
          {cart && cart.length > 0 && (
            <Button
              variant="outlined"
              onClick={() => navigate('/products')}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#2E7D32',
                color: '#2E7D32',
                '&:hover': {
                  borderColor: '#1B5E20',
                  bgcolor: alpha('#2E7D32', 0.05)
                }
              }}
            >
              Continue Shopping
            </Button>
          )}
        </Box>

      <Grid container spacing={3}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          {!cart || cart.length === 0 ? (
            <Fade in={true}>
              <Paper sx={{ 
                p: 6, 
                textAlign: 'center', 
                bgcolor: 'white',
                borderRadius: 4,
                border: `2px dashed ${alpha('#2E7D32', 0.3)}`
              }}>
                <EmptyCartIcon sx={{ fontSize: 80, color: alpha('#2E7D32', 0.3), mb: 2 }} />
                <Typography variant="h5" fontWeight="600" gutterBottom>
                  Your cart is empty
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Looks like you haven't added anything to your cart yet
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CartIcon />}
                  onClick={() => navigate('/products')}
                  sx={{
                    bgcolor: '#2E7D32',
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#1B5E20',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 16px rgba(46, 125, 50, 0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Start Shopping
                </Button>
              </Paper>
            </Fade>
          ) : (
            <Stack spacing={2.5}>
              {cart.map((item, index) => (
                <Grow in={true} timeout={300 + index * 100} key={item.cartItemId}>
                  <Card
                    elevation={0}
                    sx={{
                      p: 0,
                      borderRadius: 3,
                      bgcolor: 'white',
                      border: `1px solid ${alpha('#000', 0.08)}`,
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                        borderColor: '#2E7D32'
                      }
                    }}
                  >
                    <Grid container spacing={0} alignItems="stretch">
                      {/* Product Image */}
                      <Grid item xs={12} sm={4} md={3}>
                        <Box sx={{
                          height: { xs: 200, sm: '100%' },
                          minHeight: { sm: 180 },
                          bgcolor: alpha('#2E7D32', 0.03),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          p: 2
                        }}>
                          <Box
                            component="img"
                            src={item.images && item.images[0] ? `/images/products/${item.images[0]}` : item.image || 'https://placehold.co/200x200/2E7D32/FFFFFF?text=No+Image'}
                            alt={item.name}
                            sx={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              borderRadius: 2
                            }}
                          />
                        </Box>
                      </Grid>

                      {/* Product Details */}
                      <Grid item xs={12} sm={8} md={9}>
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                          {/* Header */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight="600" gutterBottom>
                                {item.name}
                              </Typography>
                              <Chip
                                label={item.category}
                                size="small"
                                sx={{
                                  bgcolor: alpha('#2E7D32', 0.1),
                                  color: '#2E7D32',
                                  fontWeight: 500,
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Box>
                            <IconButton
                              onClick={() => handleRemoveItem(item.cartItemId)}
                              sx={{
                                color: 'error.main',
                                bgcolor: alpha('#d32f2f', 0.1),
                                '&:hover': {
                                  bgcolor: alpha('#d32f2f', 0.2),
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>

                          {/* Price and Quantity Controls */}
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mt: 'auto',
                            flexWrap: 'wrap',
                            gap: 2
                          }}>
                            <Box>
                              <Typography variant="h5" fontWeight="700" color="primary" gutterBottom>
                                ₹{item.price}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" fontWeight="600">
                                Total: ₹{item.price * item.quantity}
                              </Typography>
                            </Box>
                            
                            {/* Modern Quantity Controls */}
                            <Paper
                              elevation={0}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                border: `1px solid ${alpha('#2E7D32', 0.3)}`,
                                borderRadius: 3,
                                p: 0.5,
                                bgcolor: alpha('#2E7D32', 0.05)
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleQuantityChange(item.cartItemId, -1)}
                                disabled={item.quantity <= 1}
                                sx={{
                                  color: '#2E7D32',
                                  '&:hover': {
                                    bgcolor: alpha('#2E7D32', 0.1)
                                  },
                                  '&.Mui-disabled': {
                                    color: alpha('#2E7D32', 0.3)
                                  }
                                }}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography
                                variant="h6"
                                fontWeight="700"
                                sx={{
                                  minWidth: 40,
                                  textAlign: 'center',
                                  color: '#2E7D32'
                                }}
                              >
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleQuantityChange(item.cartItemId, 1)}
                                sx={{
                                  color: '#2E7D32',
                                  '&:hover': {
                                    bgcolor: alpha('#2E7D32', 0.1)
                                  }
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Paper>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Grow>
              ))}
            </Stack>
          )}
        </Grid>

        {/* Modern Order Summary */}
        <Grid item xs={12} md={4}>
          <Zoom in={true}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                position: 'sticky', 
                top: 20,
                borderRadius: 4,
                bgcolor: 'white',
                border: `1px solid ${alpha('#2E7D32', 0.2)}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
              }}
            >
              <Typography variant="h5" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
                Order Summary
              </Typography>
              
              <Stack spacing={2} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" color="text.secondary">
                    Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    ₹{subtotal}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShippingIcon sx={{ fontSize: 18, color: deliveryFee === 0 ? 'success.main' : 'text.secondary' }} />
                    <Typography variant="body1" color="text.secondary">
                      Delivery
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body1" 
                    fontWeight="600"
                    color={deliveryFee === 0 ? 'success.main' : 'inherit'}
                  >
                    {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                  </Typography>
                </Box>
                
                <Divider />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="700">
                    Total
                  </Typography>
                  <Typography variant="h5" fontWeight="700" color="primary">
                    ₹{total}
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<PaymentIcon />}
                onClick={handleCheckout}
                disabled={cart.length === 0}
                sx={{
                  bgcolor: '#2E7D32',
                  color: 'white',
                  borderRadius: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  mb: 2,
                  boxShadow: '0 4px 16px rgba(46, 125, 50, 0.3)',
                  '&:hover': {
                    bgcolor: '#1B5E20',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)'
                  },
                  '&.Mui-disabled': {
                    bgcolor: alpha('#2E7D32', 0.3)
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Proceed to Checkout
              </Button>

              {deliveryFee === 0 ? (
                <Alert 
                  severity="success" 
                  icon={<CheckIcon />}
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: alpha('#4CAF50', 0.1),
                    color: '#2E7D32',
                    border: `1px solid ${alpha('#4CAF50', 0.3)}`
                  }}
                >
                  <Typography variant="body2" fontWeight="600">
                    🎉 Free delivery applied!
                  </Typography>
                </Alert>
              ) : (
                <Alert 
                  severity="info"
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: alpha('#2196F3', 0.1),
                    border: `1px solid ${alpha('#2196F3', 0.3)}`
                  }}
                >
                  <Typography variant="body2">
                    Add <strong>₹{5000 - subtotal}</strong> more for free delivery
                  </Typography>
                </Alert>
              )}
            </Paper>
          </Zoom>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{
            borderRadius: 3,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Container>
    </Box>
  );
};

export default CartPage; 