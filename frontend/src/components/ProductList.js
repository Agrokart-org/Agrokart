import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Container,
    Chip,
    Rating,
    IconButton,
    Snackbar,
    Alert,
    Skeleton,
    Stack,
    useTheme,
    alpha,
    keyframes
} from '@mui/material';
import {
    Add,
    Remove,
    ShoppingCart,
    Image,
    Favorite,
    FavoriteBorder,
    Visibility,
    FlashOn,
    LocalFireDepartment,
    Nature // Changed from Eco to Nature
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { getProducts } from '../services/api';

// Add pulse animation for featured products
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantities, setQuantities] = useState({});
    const [favorites, setFavorites] = useState(new Set());
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { t } = useLanguage();
    const theme = useTheme();

    // Available product images for fallback
    const availableImages = [
        '/images/products/organic-fertilizer.jpg',
        '/images/products/npk.jpg',
        '/images/products/urea.jpg',
        '/images/products/dap.jpg',
        '/images/products/organic compost.jpeg'
    ];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const productsData = await getProducts();
            // Filter to show only fertilizer products on home page
            const fertilizerProducts = productsData.filter(product =>
                product.category.includes('Fertilizers') ||
                product.category === 'Fertilizers'
            );
            setProducts(fertilizerProducts);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (productId, change) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: Math.max(1, (prev[productId] || 1) + change)
        }));
    };

    const handleAddToCart = (product) => {
        const quantity = quantities[product._id] || 1;
        addToCart(product, quantity);
        setSnackbar({
            open: true,
            message: t('products.addToCart') + ' - ' + product.name,
            severity: 'success'
        });
    };

    const handleToggleFavorite = (productId) => {
        setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(productId)) {
                newFavorites.delete(productId);
            } else {
                newFavorites.add(productId);
            }
            return newFavorites;
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const getDiscountPercentage = (originalPrice, currentPrice) => {
        return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    };

    const handleImageError = (event, productIndex) => {
        // Use a fallback image from available images
        const fallbackImage = availableImages[productIndex % availableImages.length];
        event.target.src = fallbackImage;
    };

    const getProductImage = (product, index) => {
        // Try to get image from product data, otherwise use fallback
        if (product.images && product.images.length > 0) {
            return `/uploads/${product.images[0]}`;
        }
        if (product.image) {
            return `/uploads/${product.image}`;
        }
        // Use fallback based on product category or index
        return availableImages[index % availableImages.length];
    };

    // Modern loading skeleton
    const ProductSkeleton = () => (
        <Card sx={{
            height: '100%',
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            animation: `${pulse} 2s infinite`
        }}>
            <Skeleton variant="rectangular" height={160} />
            <CardContent sx={{ p: 1.5 }}>
                <Skeleton variant="text" height={24} width="80%" />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Skeleton variant="rounded" width={40} height={20} />
                    <Skeleton variant="rounded" width={50} height={20} />
                </Box>
                <Skeleton variant="text" height={24} width="40%" sx={{ mt: 1 }} />
                <Skeleton variant="rectangular" height={32} sx={{ mt: 1.5, borderRadius: 1.5 }} />
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ mt: 2, mb: 4, px: { xs: 1, sm: 2 } }}>
                <Grid container spacing={1.5}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                        <Grid item xs={6} sm={4} md={3} lg={2.4} key={item}>
                            <ProductSkeleton />
                        </Grid>
                    ))}
                </Grid>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button
                    variant="contained"
                    onClick={fetchProducts}
                    sx={{ mt: 2 }}
                >
                    Retry
                </Button>
            </Container>
        );
    }

    if (products.length === 0) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Image sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No products available
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Check back later for new products
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4, px: { xs: 1, sm: 2 } }}>
            {/* Stats */}
            <Stack direction="row" spacing={3} sx={{ mb: 3, justifyContent: 'center', display: { xs: 'none', md: 'flex' } }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        {products.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Products Available
                    </Typography>
                </Box>
                {/* ... other stats only on desktop ... */}
            </Stack>

            {localStorage.getItem('userRole') === 'admin' && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/admin/products/add')}
                    sx={{ mb: 2 }}
                >
                    Add New Product
                </Button>
            )}
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {products.map((product, index) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={product._id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 3,
                                overflow: 'hidden',
                                position: 'relative',
                                border: '1px solid #f0f0f0',
                                backgroundColor: '#fff',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                maxWidth: 280,
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 24px -10px rgba(0,0,0,0.15)',
                                    borderColor: theme.palette.primary.main,
                                    '& .product-image': {
                                        transform: 'scale(1.05)'
                                    }
                                }
                            }}
                        >
                            {/* Badges */}
                            <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                <Stack direction="column" spacing={0.5}>
                                    {product.discount && (
                                        <Chip
                                            label={`-${getDiscountPercentage(product.originalPrice, product.price)}%`}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                bgcolor: alpha(theme.palette.error.main, 0.9),
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '0.65rem',
                                                backdropFilter: 'blur(4px)',
                                                '& .MuiChip-label': { px: 1 }
                                            }}
                                        />
                                    )}
                                </Stack>
                            </Box>

                            {/* Favorite Button */}
                            <IconButton
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    zIndex: 2,
                                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(4px)',
                                    '&:hover': { bgcolor: '#fff', transform: 'scale(1.1)' },
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => handleToggleFavorite(product._id)}
                            >
                                {favorites.has(product._id) ? (
                                    <Favorite sx={{ fontSize: 18, color: theme.palette.error.main }} />
                                ) : (
                                    <FavoriteBorder sx={{ fontSize: 18, color: theme.palette.grey[600] }} />
                                )}
                            </IconButton>
                            <Box sx={{ overflow: 'hidden', height: 140, bgcolor: 'grey.50' }}>
                                <CardMedia
                                    component="img"
                                    height="140"
                                    className="product-image"
                                    image={product.images?.[0] || getProductImage(product, index)}
                                    alt={product.name}
                                    onError={(e) => handleImageError(e, index)}
                                    sx={{
                                        objectFit: 'cover',
                                        transition: 'transform 0.5s ease'
                                    }}
                                />
                            </Box>
                            {/* Move Content Box wrapper to handle content overflow/padding safely if Card is visible */}
                            <CardContent sx={{ flexGrow: 1, p: 1.5, pb: 2 }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 600,
                                        mb: 0.5,
                                        lineHeight: 1.2,
                                        height: '2.4em',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                    }}
                                >
                                    {product.name}
                                </Typography>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        display: 'block',
                                        mb: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {product.category}
                                </Typography>

                                {/* Price Section */}
                                <Box sx={{ mb: 1 }}>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontWeight: 700,
                                                color: theme.palette.primary.main
                                            }}
                                        >
                                            ₹{product.price}
                                        </Typography>
                                        {product.originalPrice && product.originalPrice > product.price && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    textDecoration: 'line-through',
                                                    color: theme.palette.text.disabled
                                                }}
                                            >
                                                ₹{product.originalPrice}
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>

                                {/* Rating */}
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                    <Rating
                                        value={Number(product.averageRating) || 0}
                                        precision={0.5}
                                        readOnly
                                        size="small"
                                        sx={{ fontSize: '1rem', mr: 0.5 }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        {product.averageRating ? Number(product.averageRating).toFixed(1) : 'New'}
                                        <span style={{ marginLeft: 4, color: theme.palette.text.disabled }}>
                                            ({product.ratings?.length || 0})
                                        </span>
                                    </Typography>
                                </Box>

                                {/* Add to Cart Section */}
                                <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                                    {/* Simplified Quantity Selector */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1.5,
                                        height: 32
                                    }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleQuantityChange(product._id, -1)}
                                            disabled={quantities[product._id] <= 1}
                                            sx={{ p: 0.5 }}
                                        >
                                            <Remove sx={{ fontSize: 14 }} />
                                        </IconButton>
                                        <Typography sx={{ mx: 0.5, fontSize: '0.875rem', fontWeight: 600 }}>
                                            {quantities[product._id] || 1}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleQuantityChange(product._id, 1)}
                                            disabled={quantities[product._id] >= product.stock}
                                            sx={{ p: 0.5 }}
                                        >
                                            <Add sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </Box>

                                    <Button
                                        variant="contained"
                                        size="small"
                                        fullWidth
                                        onClick={() => handleAddToCart(product)}
                                        disabled={product.stock === 0}
                                        sx={{
                                            borderRadius: 1.5,
                                            height: 32,
                                            minWidth: 0,
                                            textTransform: 'none',
                                            fontSize: '0.8rem',
                                            p: 0,
                                            bgcolor: theme.palette.primary.main,
                                            boxShadow: 'none',
                                            '&:hover': {
                                                bgcolor: theme.palette.primary.dark,
                                                boxShadow: 'none'
                                            }
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ProductList;