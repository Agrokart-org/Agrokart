import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  IconButton,
  Box,
  Chip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide
} from '@mui/material';
import {
  Add,
  Remove,
  ShoppingCart,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import { useMobile } from '../context/MobileContext';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MobileProductCard = ({
  product,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  compact = false
}) => {
  const { vibrate, showToast } = useMobile();
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(false);

  const handleAddToCart = async () => {
    try {
      await vibrate('light');
      if (onAddToCart) {
        await onAddToCart(product, quantity);
        await showToast(`Added ${quantity} ${product.name} to cart`);
        await vibrate('success');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      await showToast('Failed to add item to cart');
      await vibrate('error');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await vibrate('light');
      if (onToggleFavorite) {
        await onToggleFavorite(product);
        await showToast(isFavorite ? 'Removed from favorites' : 'Added to favorites');
        await vibrate('success');
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      await vibrate('error');
    }
  };



  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const isDiscounted = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = isDiscounted
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <>
      <Card
        sx={{
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid #f0f0f0',
          boxShadow: 'none',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            borderColor: '#4CAF50',
            transition: 'all 0.3s ease'
          }
        }}
      >
        {/* Discount Badge */}
        {isDiscounted && (
          <Chip
            label={`${discountPercentage}% OFF`}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 1,
              bgcolor: '#d32f2f',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.65rem',
              height: 20,
              '& .MuiChip-label': { px: 1 }
            }}
          />
        )}

        {/* Favorite Button */}
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 1,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(4px)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 1)'
            }
          }}
          onClick={handleToggleFavorite}
        >
          {isFavorite ? (
            <Favorite color="error" sx={{ fontSize: 18 }} />
          ) : (
            <FavoriteBorder sx={{ fontSize: 18, color: 'text.secondary' }} />
          )}
        </IconButton>

        {/* Product Image */}
        <Box sx={{ overflow: 'hidden', height: compact ? 100 : 140 }}>
          <CardMedia
            component="img"
            height={compact ? 100 : 140}
            image={product.image || '/api/placeholder/300/300'}
            alt={product.name}
            onClick={() => setShowDetails(true)}
            sx={{
              cursor: 'pointer',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
              '&:hover': { transform: 'scale(1.1)' }
            }}
          />
        </Box>

        <CardContent sx={{ p: 1.5, pb: '8px !important', flexGrow: 1 }}>
          {/* Product Name */}
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 0.5,
              lineHeight: 1.2,
              height: '2.4em'
            }}
          >
            {product.name}
          </Typography>

          {/* Rating */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Rating
              value={Number(product.rating) || 0}
              precision={0.5}
              size="small"
              readOnly
              sx={{ fontSize: 14 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, fontSize: '0.7rem' }}>
              {product.rating ? Number(product.rating).toFixed(1) : 'New'}
            </Typography>
          </Box>

          {/* Price */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
            <Typography variant="body1" color="primary" fontWeight="700">
              {formatPrice(product.price)}
            </Typography>
            {isDiscounted && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                {formatPrice(product.originalPrice)}
              </Typography>
            )}
          </Box>


          <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
            {/* Quantity Selector - Simplified */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #e0e0e0',
              borderRadius: 1.5,
              height: 32
            }}>
              <IconButton
                size="small"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                sx={{ p: 0.5 }}
              >
                <Remove sx={{ fontSize: 14 }} />
              </IconButton>
              <Typography sx={{ mx: 0.5, fontSize: '0.8rem', fontWeight: 600, minWidth: 16, textAlign: 'center' }}>
                {quantity}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setQuantity(quantity + 1)}
                sx={{ p: 0.5 }}
              >
                <Add sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>

            {/* Add Button */}
            <Button
              variant="contained"
              onClick={handleAddToCart}
              disabled={!(
                (product.stock && product.stock > 0) ||
                (product.countInStock && product.countInStock > 0) ||
                product.inStock === true ||
                product.availability === 'In Stock'
              )}
              sx={{
                flexGrow: 1,
                borderRadius: 1.5,
                textTransform: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxShadow: 'none',
                height: 32,
                minWidth: 0,
                p: 0
              }}
              size="small"
            >
              Add
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Product Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            {product.name}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <img
              src={product.image || '/api/placeholder/300/300'}
              alt={product.name}
              style={{
                width: '100%',
                maxWidth: 300,
                height: 'auto',
                borderRadius: 8
              }}
            />
          </Box>

          <Typography variant="body1" paragraph>
            {product.description || 'Fresh and high-quality agricultural product.'}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {formatPrice(product.price)}
            </Typography>
            {isDiscounted && (
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                {formatPrice(product.originalPrice)}
              </Typography>
            )}
          </Box>

          {product.specifications && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Specifications:
              </Typography>
              {Object.entries(product.specifications).map(([key, value]) => (
                <Typography key={key} variant="body2" color="text.secondary">
                  <strong>{key}:</strong> {value}
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<ShoppingCart />}
            onClick={() => {
              handleAddToCart();
              setShowDetails(false);
            }}
            disabled={!(
              (product.stock && product.stock > 0) ||
              (product.countInStock && product.countInStock > 0) ||
              product.inStock === true ||
              product.availability === 'In Stock'
            )}
          >
            Add to Cart
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MobileProductCard;