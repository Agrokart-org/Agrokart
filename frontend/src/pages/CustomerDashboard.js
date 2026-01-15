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
    alpha
} from '@mui/material';
import {
    FavoriteBorder as FavoriteIcon,
    Favorite as FavoriteFilled,
    ShoppingCart as CartIcon,
    ChevronLeft,
    ChevronRight,
    LocalOffer as OfferIcon,
    Grass,
    Spa,
    InvertColors,
    Grain,
    BugReport,
    Build,
    Science,
    EmojiNature,
    Agriculture
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { mockProducts } from '../data/mockProducts';

// Data moved inside component for translation

// Banner Images
import bannerSale from '../assets/banner_sale_field.png';
import bannerOrganic from '../assets/banner_organic_harvest.png';
import bannerBulk from '../assets/banner_bulk_supply.png';

const CustomerDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [currentBanner, setCurrentBanner] = useState(0);
    const [wishlist, setWishlist] = useState([]);

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

    // ... (categories and products arrays remain the same) ...

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
        inStock: p.stock > 0
    }));

    const containerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 0, opacity: 1 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    // Auto-rotate banner
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleWishlist = (productId) => {
        setWishlist(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const nextBanner = () => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
    };

    const prevBanner = () => {
        setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
    };

    return (
        <Box sx={{ bgcolor: '#f1f3f6', minHeight: '100vh', pb: 4 }}>
            <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
                {/* Banner Carousel */}
                <Box
                    sx={{
                        position: 'relative',
                        height: { xs: 300, sm: 400, md: 500 }, // Increased height for cinematic feel
                        borderRadius: { xs: 2, md: 4 },
                        overflow: 'hidden',
                        mb: 4,
                        mt: 2,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentBanner}
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            style={{ height: '100%', width: '100%', position: 'absolute' }}
                        >
                            {/* Background Image */}
                            <Box
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
                                    background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)',
                                }}
                            />

                            {/* Content Content - Glassmorphism Card */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: { xs: '50%', md: '5%' },
                                    transform: { xs: 'translate(-50%, -50%)', md: 'translate(0, -50%)' },
                                    width: { xs: '90%', md: '500px' },
                                    textAlign: { xs: 'center', md: 'left' },
                                    zIndex: 2
                                }}
                            >
                                <motion.div
                                    initial={{ opacity: 1, x: 0 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                >
                                    <Box
                                        sx={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            backdropFilter: 'blur(10px)',
                                            borderRadius: 4,
                                            p: { xs: 3, md: 5 },
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                                        }}
                                    >
                                        <Typography
                                            variant="h2"
                                            sx={{
                                                mb: 2,
                                                fontSize: { xs: '2rem', md: '3.5rem' },
                                                fontWeight: 800,
                                                background: 'linear-gradient(45deg, #FFFFFF 30%, #E2E8F0 90%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                lineHeight: 1.1,
                                                letterSpacing: -0.5
                                            }}
                                        >
                                            {banners[currentBanner].title}
                                        </Typography>

                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 4,
                                                color: 'rgba(255,255,255,0.9)',
                                                fontSize: { xs: '1rem', md: '1.2rem' },
                                                fontWeight: 300,
                                                lineHeight: 1.6
                                            }}
                                        >
                                            {banners[currentBanner].subtitle}
                                        </Typography>

                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={() => navigate('/products')}
                                            sx={{
                                                bgcolor: '#4CAF50',
                                                color: 'white',
                                                fontWeight: 700,
                                                px: 4,
                                                py: 1.5,
                                                borderRadius: 50,
                                                fontSize: '1.1rem',
                                                textTransform: 'none',
                                                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                                                '&:hover': {
                                                    bgcolor: '#43A047',
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)'
                                                },
                                                transition: 'all 0.3s'
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
                            bgcolor: 'rgba(0,0,0,0.3)',
                            color: 'white',
                            backdropFilter: 'blur(5px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                        }}
                    >
                        <ChevronLeft />
                    </IconButton>
                    <IconButton
                        onClick={nextBanner}
                        sx={{
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.3)',
                            color: 'white',
                            backdropFilter: 'blur(5px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                        }}
                    >
                        <ChevronRight />
                    </IconButton>

                    {/* Dots */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 24,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 1.5,
                            zIndex: 3
                        }}
                    >
                        {banners.map((_, index) => (
                            <Box
                                key={index}
                                onClick={() => setCurrentBanner(index)}
                                sx={{
                                    width: index === currentBanner ? 24 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: index === currentBanner ? '#4CAF50' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                <Box sx={{ mb: 3, p: 1, position: 'relative', zIndex: 1 }}>
                    {/* Active Order Simulation */}
                    <Card sx={{ mb: 4, bgcolor: '#e8f5e9', border: '1px solid #4CAF50', borderRadius: 3 }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" color="#2E7D32">
                                    Order #ORD-2024-889 is On the Way!
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Arriving in 12 mins • Rahul Kumar (Delivery Partner)
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={() => navigate('/customer/tracking/2024-889')}
                                startIcon={<Agriculture />} // Using existing icon for now, or add LocalShipping
                                sx={{ borderRadius: 20, px: 3 }}
                            >
                                Track Now
                            </Button>
                        </CardContent>
                    </Card>

                    <Grid container spacing={2} justifyContent="center" component={motion.div} variants={containerVariants} initial="visible" animate="visible">
                        {categories.map((category) => (
                            <Grid item xs={4} sm={3} md={2} lg={1.5} key={category.id} component={motion.div} variants={itemVariants}>
                                <Box
                                    onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
                                    sx={{
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)' },
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 70,
                                            height: 70,
                                            borderRadius: '20px',
                                            bgcolor: alpha(category.color, 0.1),
                                            color: category.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 1.5,
                                            transition: 'all 0.3s ease',
                                            boxShadow: `0 0 15px ${alpha(category.color, 0.3)}`,
                                            '&:hover': {
                                                bgcolor: category.color,
                                                color: 'white',
                                                boxShadow: `0 0 25px ${alpha(category.color, 0.6)}`,
                                                transform: 'translateY(-2px)'
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
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight="700">
                            {t('dashboard.sections.bestDeals')}
                        </Typography>
                        <Button sx={{ color: '#2E7D32', fontWeight: 600 }}>{t('dashboard.sections.viewAll')}</Button>
                    </Box>

                    <Grid container spacing={2} component={motion.div} variants={containerVariants} initial="visible" whileInView="visible" viewport={{ once: true }}>
                        {products.slice(0, 12).map((product) => (
                            <Grid item xs={6} sm={4} md={3} lg={2.4} key={product.id} component={motion.div} variants={itemVariants}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                        }
                                    }}
                                >
                                    <Box sx={{ position: 'relative' }}>
                                        <CardMedia
                                            component="img"
                                            height="180"
                                            image={product.image}
                                            alt={product.name}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                        <IconButton
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleWishlist(product.id);
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                bgcolor: 'white',
                                                '&:hover': { bgcolor: '#f5f5f5' }
                                            }}
                                            size="small"
                                        >
                                            {wishlist.includes(product.id) ? (
                                                <FavoriteFilled sx={{ color: '#e91e63' }} />
                                            ) : (
                                                <FavoriteIcon />
                                            )}
                                        </IconButton>
                                        {product.discount > 0 && (
                                            <Chip
                                                label={`${product.discount}% OFF`}
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 8,
                                                    left: 8,
                                                    bgcolor: '#2E7D32',
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem'
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 500,
                                                mb: 0.5,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                minHeight: 40
                                            }}
                                        >
                                            {product.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                            {product.weight}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                            <Rating value={product.rating} precision={0.5} size="small" readOnly />
                                            <Typography variant="caption" color="text.secondary">
                                                ({product.reviews})
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                                            <Typography variant="h6" fontWeight="700">
                                                ₹{product.price}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                                            >
                                                ₹{product.originalPrice}
                                            </Typography>
                                        </Box>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="small"
                                            startIcon={<CartIcon />}
                                            sx={{
                                                bgcolor: '#2E7D32',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                '&:hover': { bgcolor: '#1B5E20' }
                                            }}
                                        >
                                            Add to Cart
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Top Rated Section */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight="700">
                            {t('dashboard.sections.topRated')}
                        </Typography>
                        <Button sx={{ color: '#2E7D32', fontWeight: 600 }}>{t('dashboard.sections.viewAll')}</Button>
                    </Box>

                    <Grid container spacing={2} component={motion.div} variants={containerVariants} initial="visible" whileInView="visible" viewport={{ once: true }}>
                        {products.filter(p => p.rating >= 4.5).slice(0, 12).map((product) => (
                            <Grid item xs={6} sm={4} md={3} lg={2.4} key={product.id} component={motion.div} variants={itemVariants}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                        }
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        height="180"
                                        image={product.image}
                                        alt={product.name}
                                    />
                                    <CardContent sx={{ p: 1.5 }}>
                                        <Typography variant="body2" fontWeight="500" sx={{ mb: 0.5, minHeight: 40 }}>
                                            {product.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                            <Rating value={product.rating} precision={0.5} size="small" readOnly />
                                            <Typography variant="caption" color="text.secondary">
                                                ({product.reviews})
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6" fontWeight="700" color="#2E7D32">
                                            ₹{product.price}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
};

export default CustomerDashboard;
