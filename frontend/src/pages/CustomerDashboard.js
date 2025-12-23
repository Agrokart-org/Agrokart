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

// Data moved inside component for translation

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
            image: 'linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%)',
            cta: t('dashboard.banners.sale.cta')
        },
        {
            id: 2,
            title: t('dashboard.banners.organic.title'),
            subtitle: t('dashboard.banners.organic.subtitle'),
            image: 'linear-gradient(135deg, #388E3C 0%, #81C784 100%)',
            cta: t('dashboard.banners.organic.cta')
        },
        {
            id: 3,
            title: t('dashboard.banners.bulk.title'),
            subtitle: t('dashboard.banners.bulk.subtitle'),
            image: 'linear-gradient(135deg, #43A047 0%, #A5D6A7 100%)',
            cta: t('dashboard.banners.bulk.cta')
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

    // Products data
    const products = [
        {
            id: 1,
            name: `${t('dashboard.categories.npk')} 19-19-19`,
            weight: '50kg',
            image: 'https://via.placeholder.com/200x200/2E7D32/FFFFFF?text=NPK',
            price: 1299,
            originalPrice: 1599,
            discount: 19,
            rating: 4.5,
            reviews: 234,
            category: t('dashboard.categories.npk'),
            inStock: true
        },
        {
            id: 2,
            name: `${t('dashboard.categories.organic')} Vermicompost`,
            weight: '40kg',
            image: 'https://via.placeholder.com/200x200/388E3C/FFFFFF?text=Organic',
            price: 899,
            originalPrice: 1199,
            discount: 25,
            rating: 4.7,
            reviews: 456,
            category: t('dashboard.categories.organic'),
            inStock: true
        },
        {
            id: 3,
            name: `${t('dashboard.categories.urea')} Premium`,
            weight: '50kg',
            image: 'https://via.placeholder.com/200x200/43A047/FFFFFF?text=Urea',
            price: 799,
            originalPrice: 999,
            discount: 20,
            rating: 4.3,
            reviews: 189,
            category: t('dashboard.categories.urea'),
            inStock: true
        },
        {
            id: 4,
            name: 'DAP Fertilizer', // Keeping explicit names for some
            weight: '50kg',
            image: 'https://via.placeholder.com/200x200/66BB6A/FFFFFF?text=DAP',
            price: 1499,
            originalPrice: 1799,
            discount: 17,
            rating: 4.6,
            reviews: 312,
            category: t('dashboard.categories.npk'),
            inStock: true
        },
        {
            id: 5,
            name: 'Neem Cake Organic',
            weight: '25kg',
            image: 'https://via.placeholder.com/200x200/81C784/FFFFFF?text=Neem',
            price: 649,
            originalPrice: 849,
            discount: 24,
            rating: 4.8,
            reviews: 567,
            category: t('dashboard.categories.organic'),
            inStock: true
        },
        {
            id: 6,
            name: 'Potash Fertilizer',
            weight: '50kg',
            image: 'https://via.placeholder.com/200x200/A5D6A7/FFFFFF?text=Potash',
            price: 1199,
            originalPrice: 1499,
            discount: 20,
            rating: 4.4,
            reviews: 223,
            category: t('dashboard.categories.npk'),
            inStock: true
        },
        {
            id: 7,
            name: 'Zinc Sulphate',
            weight: '10kg',
            image: 'https://via.placeholder.com/200x200/2E7D32/FFFFFF?text=Zinc',
            price: 399,
            originalPrice: 499,
            discount: 20,
            rating: 4.5,
            reviews: 145,
            category: t('dashboard.categories.micro'),
            inStock: true
        },
        {
            id: 8,
            name: 'Bio NPK Fertilizer',
            weight: '20kg',
            image: 'https://via.placeholder.com/200x200/388E3C/FFFFFF?text=BioNPK',
            price: 899,
            originalPrice: 1099,
            discount: 18,
            rating: 4.7,
            reviews: 289,
            category: t('dashboard.categories.bio'),
            inStock: true
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
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
                        height: { xs: 200, sm: 280, md: 350 },
                        borderRadius: 1,
                        overflow: 'hidden',
                        mb: 3,
                        mt: 2
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentBanner}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            style={{ height: '100%' }}
                        >
                            <Box
                                sx={{
                                    height: '100%',
                                    background: banners[currentBanner].image,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    textAlign: 'center',
                                    px: 3
                                }}
                            >
                                <Box>
                                    <Typography variant="h3" fontWeight="700" sx={{ mb: 1, fontSize: { xs: '1.5rem', md: '3rem' } }}>
                                        {banners[currentBanner].title}
                                    </Typography>
                                    <Typography variant="h6" sx={{ mb: 3, fontSize: { xs: '0.9rem', md: '1.25rem' } }}>
                                        {banners[currentBanner].subtitle}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        sx={{
                                            bgcolor: 'white',
                                            color: '#2E7D32',
                                            fontWeight: 700,
                                            px: 4,
                                            '&:hover': { bgcolor: '#f5f5f5' }
                                        }}
                                    >
                                        {banners[currentBanner].cta}
                                    </Button>
                                </Box>
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
                            '&:hover': { bgcolor: 'white' }
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
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '&:hover': { bgcolor: 'white' }
                        }}
                    >
                        <ChevronRight />
                    </IconButton>

                    {/* Dots */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 1
                        }}
                    >
                        {banners.map((_, index) => (
                            <Box
                                key={index}
                                onClick={() => setCurrentBanner(index)}
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: index === currentBanner ? 'white' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                <Box sx={{ mb: 3, p: 1, position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={2} justifyContent="center" component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
                        {categories.map((category) => (
                            <Grid item xs={4} sm={3} md={2} lg={1.5} key={category.id} component={motion.div} variants={itemVariants}>
                                <Box
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

                    <Grid container spacing={2} component={motion.div} variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                        {products.map((product) => (
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

                    <Grid container spacing={2} component={motion.div} variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                        {products.filter(p => p.rating >= 4.5).slice(0, 5).map((product) => (
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
