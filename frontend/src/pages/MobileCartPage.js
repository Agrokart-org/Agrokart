import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Divider,
  Paper,
  Chip,
  useTheme,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  DeleteOutline as DeleteIcon,
  ShoppingBag as EmptyCartIcon,
  ArrowBack,
  LocalOffer
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const MotionCard = motion(Card);

const MobileCartPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, getCartTotal, cartCount } = useCart();

  if (cartCount === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          px: 3,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #F4F7F5 0%, #E8F5E9 100%)'
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <Box sx={{ p: 4, bgcolor: 'white', borderRadius: '50%', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', mb: 3 }}>
            <EmptyCartIcon sx={{ fontSize: 60, color: '#CFD8DC' }} />
          </Box>
        </motion.div>
        <Typography variant="h5" fontWeight="800" gutterBottom sx={{ color: 'text.primary' }}>
          Your cart is empty
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, maxWidth: 250 }}>
          Looks like you haven't added anything to your cart yet.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/products')}
          size="large"
          sx={{
            py: 1.5,
            px: 4,
            borderRadius: 4,
            fontWeight: 'bold',
            boxShadow: '0 8px 24px rgba(46, 125, 50, 0.3)'
          }}
        >
          Start Shopping
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#FFF', minHeight: '100vh', pb: 12 }}>
      {/* Header */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        ...theme.glass(0.9),
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" fontWeight="800">
          My Cart <span style={{ color: theme.palette.primary.main }}>({cartCount})</span>
        </Typography>
      </Box>

      {/* Cart Items */}
      <Box sx={{ px: 2, pt: 2 }}>
        <AnimatePresence>
          {cart.map((item) => (
            <MotionCard
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              sx={{
                mb: 2,
                borderRadius: 4,
                border: '1px solid #F0F0F0',
                boxShadow: 'none',
                overflow: 'visible'
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Product Image */}
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={item.image || '/api/placeholder/100/100'}
                      alt={item.name}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 3,
                        objectFit: 'cover',
                        bgcolor: '#F5F5F5'
                      }}
                    />
                  </Box>

                  {/* Product Details */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle1" fontWeight="700" sx={{ lineHeight: 1.3, mb: 0.5 }}>
                        {item.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeFromCart(item.id)}
                        sx={{ mt: -1, mr: -1, color: 'text.disabled' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      50kg Bag
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="h6" fontWeight="800" color="primary">
                        ₹{item.price}
                      </Typography>

                      {/* Quantity Controls */}
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: '#F5F5F5',
                        borderRadius: 3,
                        p: 0.5
                      }}>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          sx={{ width: 28, height: 28, bgcolor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                        >
                          <RemoveIcon sx={{ fontSize: 16 }} />
                        </IconButton>

                        <Typography variant="body2" fontWeight="700" sx={{ minWidth: 30, textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>

                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          sx={{ width: 28, height: 28, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                        >
                          <AddIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </MotionCard>
          ))}
        </AnimatePresence>
      </Box>

      {/* Bill Details */}
      <Box sx={{ px: 2, mt: 3 }}>
        <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 1.5, ml: 1, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
          Bill Details
        </Typography>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, bgcolor: '#FAFAFA', border: '1px solid #F0F0F0' }}>
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Item Total</Typography>
              <Typography variant="body2" fontWeight="600">₹{getCartTotal()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Delivery Fee</Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">FREE</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Platform Fee</Typography>
              <Typography variant="body2" fontWeight="600">₹10</Typography>
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="800">To Pay</Typography>
              <Typography variant="h6" fontWeight="800" color="primary">₹{parseInt(getCartTotal()) + 10}</Typography>
            </Box>
          </Stack>
        </Paper>

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#E8F5E9', borderRadius: 2, border: '1px dashed #4CAF50' }}>
          <LocalOffer sx={{ color: '#2E7D32', fontSize: 20 }} />
          <Typography variant="caption" fontWeight="600" color="#2E7D32">
            You saved ₹140 on this order!
          </Typography>
        </Box>
      </Box>

      {/* Checkout Footer */}
      <Paper sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        pb: 3,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        boxShadow: '0 -8px 32px rgba(0,0,0,0.08)'
      }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={() => navigate('/delivery-details')}
          endIcon={<Box component="span" sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1, px: 1, fontSize: '0.85rem' }}>₹{parseInt(getCartTotal()) + 10}</Box>}
          sx={{
            py: 1.8,
            borderRadius: 3,
            fontSize: '1rem',
            fontWeight: '800',
            textTransform: 'none',
            justifyContent: 'space-between',
            pl: 4, pr: 2,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: '0 8px 24px rgba(46, 125, 50, 0.4)'
          }}
        >
          Place Order
        </Button>
      </Paper>
    </Box>
  );
};

export default MobileCartPage;
