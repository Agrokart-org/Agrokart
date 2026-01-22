import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Grid,
    Typography,
    Card,
    CardContent,
    CardMedia,
    Button,
    IconButton,
    Chip,
    Rating,
    alpha,
    Snackbar,
    Alert,
    keyframes,
    useTheme
} from '@mui/material';
import {
    FavoriteBorder as FavoriteIcon,
    Favorite as FavoriteFilled,
    ShoppingCart as CartIcon,
    ChevronLeft,
    ChevronRight,
    LocalOffer as OfferIcon,
    Spa,
    InvertColors,
    Grain,
    BugReport,
    Build,
    Science,
    EmojiNature,
    Agriculture,
    Add as AddIcon,
    Visibility as ViewIcon,
    LocalShipping,
    Verified,
    TrendingUp,
    AutoAwesome
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';

import { mockProducts } from '../data/mockProducts';

// Banner Images
import bannerSale from '../assets/banner_sale_field.png';
import bannerOrganic from '../assets/banner_organic_harvest.png';
import bannerBulk from '../assets/banner_bulk_supply.png';

// Keyframe animations
const float = keyframes`
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(2deg); }
`;

const pulse = keyframes`
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
`;

const shimmer = keyframes`
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

const glow = keyframes`
    0%, 100% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.3); }
    50% { box-shadow: 0 0 40px rgba(76, 175, 80, 0.6); }
`;

const gradientMove = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const CustomerDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [currentBanner, setCurrentBanner] = useState(0);
    const [wishlist, setWishlist] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Banner data
    const banners = [
        {
            id: 1,
            title: t('dashboard.banners.sale.title'),
            subtitle: t('dashboard.banners.sale.subtitle'),
            image: bannerSale,
            cta: t('dashboard.banners.sale.cta'),
            color: '#ffffff'
        },
        {
            id: 2,
            title: t('dashboard.banners.organic.title'),
            subtitle: t('dashboard.banners.organic.subtitle'),
            image: bannerOrganic,
            cta: t('dashboard.banners.organic.cta'),
            color: '#ffffff'
        },
        {
            id: 3,
            title: t('dashboard.banners.bulk.title'),
            subtitle: t('dashboard.banners.bulk.subtitle'),
            image: bannerBulk,
            cta: t('dashboard.banners.bulk.cta'),
            color: '#ffffff'
        }
    ];

    // Categories
    const categories = [
        { id: 1, name: t('dashboard.categories.npk'), icon: <Agriculture sx={{ fontSize: 32 }} />, color: '#2E7D32' },
        { id: 2, name: t('dashboard.categories.organic'), icon: <Spa sx={{ fontSize: 30 }} />, color: '#388E3C' },
        { id: 3, name: t('dashboard.categories.urea'), icon: <InvertColors sx={{ fontSize: 30 }} />, color: '#0288D1' },
        { id: 4, name: t('dashboard.categories.seeds'), icon: <Grain sx={{ fontSize: 30 }} />, color: '#F57F17' },
        { id: 5, name: t('dashboard.categories.pesticides'), icon: <BugReport sx={{ fontSize: 30 }} />, color: '#D32F2F' },
        { id: 6, name: t('dashboard.categories.tools'), icon: <Build sx={{ fontSize: 28 }} />, color: '#5D4037' },
        { id: 7, name: t('dashboard.categories.micro'), icon: <Science sx={{ fontSize: 30 }} />, color: '#7B1FA2' },
        { id: 8, name: t('dashboard.categories.bio'), icon: <EmojiNature sx={{ fontSize: 32 }} />, color: '#388E3C' }
    ];

    // Products data from shared source
    const products = mockProducts.map(p => ({
        id: p._id,
        name: p.name,
        weight: p.unit || '1kg',
        image: p.images?.[0] || 'https://via.placeholder.com/200',
        price: p.price,
        originalPrice: p.originalPrice,
        discount: p.discount,
        rating: p.averageRating,
        reviews: p.ratings?.length || 0,
        category: p.category,
        inStock: p.stock > 0,
        _id: p._id
    }));

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        }
    };

    // Auto-rotate banner
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    const handleWishlist = (productId) => {
        setWishlist(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleAddToCart = (e, product) => {
        e.stopPropagation();
        addToCart({
            _id: product.id || product._id,
            id: product.id || product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            images: [product.image]
        }, 1);
        setSnackbar({
            open: true,
            message: `${product.name} added to cart!`,
            severity: 'success'
        });
    };

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    const handleViewAll = () => {
        navigate('/products');
    };

    const nextBanner = () => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
    };

    const prevBanner = () => {
        setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Modern Product Card Component
    const ProductCard = ({ product, index }) => {
        const theme = useTheme();
        return (
            <Card
                component={motion.div}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleProductClick(product.id)}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: 'none',
                    background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(145deg, #1e1e1e 0%, #2d2d2d 100%)'
                        : 'linear-gradient(145deg, #ffffff 0%, #f8faf8 100%)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, #2E7D32, #4CAF50, #81C784)',
                        backgroundSize: '200% 100%',
                        animation: `${gradientMove} 3s ease infinite`,
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                    },
                    '&:hover': {
                        boxShadow: '0 20px 40px rgba(46, 125, 50, 0.15)',
                        '&::before': {
                            opacity: 1
                        },
                        '& .product-img': {
                            transform: 'scale(1.1)'
                        },
                        '& .action-buttons': {
                            opacity: 1,
                            transform: 'translateY(0)'
                        }
                    }
                }}
            >
                <Box sx={{ position: 'relative', overflow: 'hidden', height: 160 }}>
                    <CardMedia
                        component="img"
                        height="160"
                        className="product-img"
                        image={product.image}
                        alt={product.name}
                        sx={{
                            objectFit: 'cover',
                            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    />

                    {/* Overlay Gradient */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '60%',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                            '.MuiCard-root:hover &': {
                                opacity: 1
                            }
                        }}
                    />

                    {/* Wishlist Button */}
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation();
                            handleWishlist(product.id);
                        }}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(8px)',
                            width: 36,
                            height: 36,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            '&:hover': {
                                bgcolor: '#fff',
                                transform: 'scale(1.15)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                        size="small"
                    >
                        {wishlist.includes(product.id) ? (
                            <FavoriteFilled sx={{ color: '#e91e63', fontSize: 20 }} />
                        ) : (
                            <FavoriteIcon sx={{ fontSize: 20, color: '#666' }} />
                        )}
                    </IconButton>

                    {/* Discount Badge */}
                    {product.discount > 0 && (
                        <Chip
                            icon={<OfferIcon sx={{ fontSize: 14, color: '#fff !important' }} />}
                            label={`${product.discount}% OFF`}
                            size="small"
                            sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                height: 24,
                                background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                boxShadow: '0 2px 8px rgba(211, 47, 47, 0.4)',
                                '& .MuiChip-label': { px: 1 },
                                '& .MuiChip-icon': { ml: 0.5 }
                            }}
                        />
                    )}

                    {/* Quick Action Buttons */}
                    <Box
                        className="action-buttons"
                        sx={{
                            position: 'absolute',
                            bottom: 12,
                            left: '50%',
                            transform: 'translateX(-50%) translateY(20px)',
                            display: 'flex',
                            gap: 1,
                            opacity: 0,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <IconButton
                            onClick={(e) => handleAddToCart(e, product)}
                            sx={{
                                bgcolor: '#4CAF50',
                                color: '#fff',
                                width: 40,
                                height: 40,
                                '&:hover': {
                                    bgcolor: '#2E7D32',
                                    transform: 'scale(1.1)'
                                },
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <AddIcon />
                        </IconButton>
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(product.id);
                            }}
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.95)',
                                color: '#333',
                                width: 40,
                                height: 40,
                                '&:hover': {
                                    bgcolor: '#fff',
                                    transform: 'scale(1.1)'
                                },
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <ViewIcon />
                        </IconButton>
                    </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 2, pb: 2.5 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 600,
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            minHeight: 40,
                            lineHeight: 1.3,
                            color: 'text.primary',
                            fontSize: '0.9rem'
                        }}
                    >
                        {product.name}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                bgcolor: alpha('#4CAF50', 0.1),
                                borderRadius: 1,
                                px: 0.8,
                                py: 0.3
                            }}
                        >
                            <Rating value={1} max={1} readOnly size="small" sx={{ fontSize: '0.9rem' }} />
                            <Typography variant="caption" sx={{ ml: 0.3, fontWeight: 600, color: '#2E7D32' }}>
                                {Number(product.rating).toFixed(1)}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', ml: 1 }}>
                            ({product.reviews} reviews)
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 800,
                                color: '#2E7D32',
                                fontSize: '1.1rem'
                            }}
                        >
                            ₹{product.price}
                        </Typography>
                        {product.originalPrice && (
                            <Typography
                                variant="body2"
                                sx={{
                                    textDecoration: 'line-through',
                                    color: 'text.secondary',
                                    fontSize: '0.8rem'
                                }}
                            >
                                ₹{product.originalPrice}
                            </Typography>
                        )}
                    </Box>

                    <Button
                        fullWidth
                        variant="contained"
                        size="medium"
                        startIcon={<CartIcon sx={{ fontSize: 18 }} />}
                        onClick={(e) => handleAddToCart(e, product)}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                            color: '#fff',
                            height: 40,
                            fontSize: '0.85rem',
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                                boxShadow: '0 6px 16px rgba(46, 125, 50, 0.4)',
                                transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Add to Cart
                    </Button>
                </CardContent>
            </Card>
        )
    };


    // Log products for debugging
    useEffect(() => {
        console.log('CustomerDashboard loaded. Product count:', products.length);
        console.log('Sample product:', products[0]);
    }, [products]);

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
            <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>

                {/* Hero Banner Carousel */}
                <Box
                    sx={{
                        position: 'relative',
                        height: { xs: 320, sm: 420, md: 520 },
                        borderRadius: { xs: 3, md: 5 },
                        overflow: 'hidden',
                        mb: 4,
                        mt: 2,
                        boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(45deg, rgba(46, 125, 50, 0.1) 0%, transparent 50%)',
                            zIndex: 1,
                            pointerEvents: 'none'
                        }
                    }}
                >
                    {/* Floating Particles */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '15%',
                            left: '10%',
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(76, 175, 80, 0.3) 0%, transparent 70%)',
                            animation: `${float} 6s ease-in-out infinite`,
                            zIndex: 2
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '60%',
                            right: '15%',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(255, 193, 7, 0.4) 0%, transparent 70%)',
                            animation: `${float} 8s ease-in-out infinite 2s`,
                            zIndex: 2
                        }}
                    />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentBanner}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            style={{ height: '100%', width: '100%', position: 'absolute' }}
                        >
                            {/* Background Image with Ken Burns Effect */}
                            <Box
                                component={motion.div}
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                                sx={{
                                    height: '100%',
                                    width: '100%',
                                    backgroundImage: `url(${banners[currentBanner].image})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />

                            {/* Overlay Gradient */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
                                }}
                            />

                            {/* Content - Modern Glassmorphism Card */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: { xs: '50%', md: '5%' },
                                    transform: { xs: 'translate(-50%, -50%)', md: 'translate(0, -50%)' },
                                    width: { xs: '90%', md: '520px' },
                                    textAlign: { xs: 'center', md: 'left' },
                                    zIndex: 3
                                }}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                >
                                    <Box
                                        sx={{
                                            background: 'rgba(255, 255, 255, 0.12)',
                                            backdropFilter: 'blur(20px)',
                                            borderRadius: 5,
                                            p: { xs: 3, md: 5 },
                                            border: '1px solid rgba(255, 255, 255, 0.25)',
                                            boxShadow: '0 15px 50px 0 rgba(0, 0, 0, 0.3)',
                                        }}
                                    >
                                        {/* Badge */}
                                        <Chip
                                            icon={<Verified sx={{ color: '#4CAF50 !important' }} />}
                                            label="Premium Quality"
                                            sx={{
                                                mb: 2,
                                                bgcolor: 'rgba(255,255,255,0.9)',
                                                color: '#2E7D32',
                                                fontWeight: 600,
                                                '& .MuiChip-icon': { color: '#4CAF50' }
                                            }}
                                        />

                                        <Typography
                                            variant="h2"
                                            sx={{
                                                mb: 2,
                                                fontSize: { xs: '2rem', md: '3.2rem' },
                                                fontWeight: 800,
                                                background: 'linear-gradient(135deg, #FFFFFF 0%, #E8F5E9 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                lineHeight: 1.1,
                                                letterSpacing: -1
                                            }}
                                        >
                                            {banners[currentBanner].title}
                                        </Typography>

                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 4,
                                                color: 'rgba(255,255,255,0.9)',
                                                fontSize: { xs: '1rem', md: '1.15rem' },
                                                fontWeight: 400,
                                                lineHeight: 1.6
                                            }}
                                        >
                                            {banners[currentBanner].subtitle}
                                        </Typography>

                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={() => navigate('/products')}
                                            endIcon={<TrendingUp />}
                                            sx={{
                                                background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                                                color: 'white',
                                                fontWeight: 700,
                                                px: 5,
                                                py: 1.8,
                                                borderRadius: 50,
                                                fontSize: '1.1rem',
                                                textTransform: 'none',
                                                boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
                                                animation: `${glow} 2s ease-in-out infinite`,
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                                                    transform: 'translateY(-3px) scale(1.02)',
                                                    boxShadow: '0 12px 35px rgba(76, 175, 80, 0.5)'
                                                },
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {banners[currentBanner].cta}
                                        </Button>
                                    </Box>
                                </motion.div>
                            </Box>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Arrows */}
                    <IconButton
                        onClick={prevBanner}
                        sx={{
                            position: 'absolute',
                            left: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255,255,255,0.9)',
                            color: '#2E7D32',
                            backdropFilter: 'blur(10px)',
                            width: 48,
                            height: 48,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            '&:hover': {
                                bgcolor: '#fff',
                                transform: 'translateY(-50%) scale(1.1)'
                            },
                            transition: 'all 0.3s ease',
                            zIndex: 4
                        }}
                    >
                        <ChevronLeft sx={{ fontSize: 28 }} />
                    </IconButton>
                    <IconButton
                        onClick={nextBanner}
                        sx={{
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255,255,255,0.9)',
                            color: '#2E7D32',
                            backdropFilter: 'blur(10px)',
                            width: 48,
                            height: 48,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            '&:hover': {
                                bgcolor: '#fff',
                                transform: 'translateY(-50%) scale(1.1)'
                            },
                            transition: 'all 0.3s ease',
                            zIndex: 4
                        }}
                    >
                        <ChevronRight sx={{ fontSize: 28 }} />
                    </IconButton>

                    {/* Progress Dots */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 24,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 1.5,
                            zIndex: 4
                        }}
                    >
                        {banners.map((_, index) => (
                            <Box
                                key={index}
                                onClick={() => setCurrentBanner(index)}
                                sx={{
                                    width: index === currentBanner ? 32 : 10,
                                    height: 10,
                                    borderRadius: 5,
                                    bgcolor: index === currentBanner ? '#4CAF50' : 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: index === currentBanner
                                        ? '0 2px 10px rgba(76, 175, 80, 0.5)'
                                        : '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Active Order Card */}
                <Card
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{
                        mb: 4,
                        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                        border: '2px solid #4CAF50',
                        borderRadius: 4,
                        overflow: 'hidden',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'linear-gradient(90deg, #2E7D32, #4CAF50, #81C784, #4CAF50, #2E7D32)',
                            backgroundSize: '200% 100%',
                            animation: `${shimmer} 2s linear infinite`
                        }
                    }}
                >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, py: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                sx={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 2,
                                    bgcolor: '#4CAF50',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    animation: `${pulse} 2s ease-in-out infinite`
                                }}
                            >
                                <LocalShipping sx={{ color: '#fff', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" color="#1B5E20">
                                    Order #ORD-2024-889 is On the Way!
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Arriving in 12 mins • Rahul Kumar (Delivery Partner)
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/customer/tracking/2024-889')}
                            startIcon={<LocalShipping />}
                            sx={{
                                borderRadius: 3,
                                px: 4,
                                py: 1.2,
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)'
                                }
                            }}
                        >
                            Track Now
                        </Button>
                    </CardContent>
                </Card>

                {/* Categories Section */}
                <Box sx={{ mb: 5, p: 2, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <AutoAwesome sx={{ color: '#4CAF50', mr: 1 }} />
                        <Typography variant="h5" fontWeight="700" color="#1a1a1a">
                            Shop by Category
                        </Typography>
                    </Box>

                    <Grid
                        container
                        spacing={2}
                        justifyContent="center"
                        component={motion.div}
                        variants={containerVariants}
                        initial="visible"
                        animate="visible"
                    >
                        {categories.map((category) => (
                            <Grid item xs={4} sm={3} md={2} lg={1.5} key={category.id} component={motion.div} variants={itemVariants}>
                                <Box
                                    component={motion.div}
                                    whileHover={{ scale: 1.08, y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
                                    sx={{
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        p: 1
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 75,
                                            height: 75,
                                            borderRadius: '22px',
                                            bgcolor: alpha(category.color, 0.08),
                                            color: category.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 1.5,
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            border: `2px solid ${alpha(category.color, 0.2)}`,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: `radial-gradient(circle at center, ${alpha(category.color, 0.3)} 0%, transparent 70%)`,
                                                opacity: 0,
                                                transition: 'opacity 0.3s ease'
                                            },
                                            '&:hover': {
                                                bgcolor: category.color,
                                                color: 'white',
                                                boxShadow: `0 8px 30px ${alpha(category.color, 0.5)}`,
                                                border: `2px solid ${category.color}`,
                                                '&::before': {
                                                    opacity: 1
                                                }
                                            }
                                        }}
                                    >
                                        {category.icon}
                                    </Box>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            color: '#374151',
                                            display: 'block',
                                            lineHeight: 1.2
                                        }}
                                    >
                                        {category.name}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Best Deals Section */}
                <Box sx={{ mb: 5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                                sx={{
                                    width: 4,
                                    height: 28,
                                    borderRadius: 2,
                                    background: 'linear-gradient(180deg, #4CAF50 0%, #2E7D32 100%)',
                                    mr: 2
                                }}
                            />
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 800,
                                    background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                {t('dashboard.sections.bestDeals')}
                            </Typography>
                        </Box>
                        <Button
                            onClick={handleViewAll}
                            endIcon={<ChevronRight />}
                            sx={{
                                color: '#2E7D32',
                                fontWeight: 700,
                                '&:hover': {
                                    bgcolor: alpha('#4CAF50', 0.1),
                                    transform: 'translateX(4px)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {t('dashboard.sections.viewAll')}
                        </Button>
                    </Box>

                    <Grid
                        container
                        spacing={2.5}
                        component={motion.div}
                        variants={containerVariants}
                        initial="visible"
                        animate="visible"
                    >
                        {products.slice(0, 12).map((product, index) => (
                            <Grid item xs={6} sm={4} md={3} lg={2.4} key={product.id}>
                                <ProductCard product={product} index={index} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Top Rated Section */}
                <Box sx={{ mb: 5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                                sx={{
                                    width: 4,
                                    height: 28,
                                    borderRadius: 2,
                                    background: 'linear-gradient(180deg, #FFD700 0%, #FFA000 100%)',
                                    mr: 2
                                }}
                            />
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 800,
                                    background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                {t('dashboard.sections.topRated')}
                            </Typography>
                        </Box>
                        <Button
                            onClick={handleViewAll}
                            endIcon={<ChevronRight />}
                            sx={{
                                color: '#2E7D32',
                                fontWeight: 700,
                                '&:hover': {
                                    bgcolor: alpha('#4CAF50', 0.1),
                                    transform: 'translateX(4px)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {t('dashboard.sections.viewAll')}
                        </Button>
                    </Box>

                    <Grid
                        container
                        spacing={2.5}
                        component={motion.div}
                        variants={containerVariants}
                        initial="visible"
                        animate="visible"
                    >
                        {products.filter(p => p.rating >= 4.5).slice(0, 12).map((product, index) => (
                            <Grid item xs={6} sm={4} md={3} lg={2.4} key={product.id}>
                                <ProductCard product={product} index={index} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>

            </Container>

            {/* Snackbar for Cart Feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: 3,
                        boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                        fontWeight: 600
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CustomerDashboard;
