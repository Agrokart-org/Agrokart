import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import {
    Box,
    Container,
    Grid,
    Typography,
    Card,
    CardContent,
    Avatar,
    IconButton,
    Button,
    Chip,
    Stack,
    Paper,
    Divider,
    useEquipment
} from '@mui/material';
import {
    ArrowForward as ArrowForwardIcon,
    Grass as CropIcon,
    Agriculture as ToolIcon,
    Science as FertilizerIcon,
    PestControl as PesticideIcon,
    WaterDrop as WaterIcon,
    LocalFlorist as SeedsIcon,
    FilterVintage as OrganicIcon,
    Terrain as SoilIcon,
    Monitor as MonitorIcon,
    MoreHoriz as MoreHorizIcon,
    ArrowBackIos as ArrowBackIosIcon,
    ArrowForwardIos as ArrowForwardIosIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import dashboardTheme from '../theme/dashboardTheme';
import { motion } from 'framer-motion';

// Mock Data
const categories = [
    { id: 'fertilizers', name: 'Fertilizers', icon: FertilizerIcon },
    { id: 'seeds', name: 'Seeds', icon: SeedsIcon },
    { id: 'pesticides', name: 'Pesticides', icon: PesticideIcon },
    { id: 'tools', name: 'Tools', icon: ToolIcon },
    { id: 'soil', name: 'Soil', icon: SoilIcon },
    { id: 'organic', name: 'Organic', icon: OrganicIcon },
    { id: 'electronics', name: 'Electronics', icon: MonitorIcon },
    { id: 'bio', name: 'Bio Agents', icon: WaterIcon },
    { id: 'more', name: 'More', icon: MoreHorizIcon },
];

const bannerData = [
    { id: 1, color: '#2E7D32', title: '50% OFF on Organic Seeds', sub: 'Monsoon Special' },
    { id: 2, color: '#FBC02D', title: 'New Farming Tools', sub: 'Heavy Duty' },
    { id: 3, color: '#795548', title: 'Best Soil Nutrients', sub: 'For Healthy Crops' },
];

const products = [
    { id: 1, name: 'Urea Gold', price: '₹266', off: '10% Off', image: 'https://placehold.co/150x150?text=Urea' },
    { id: 2, name: 'DAP 18-46-0', price: '₹1,350', off: '5% Off', image: 'https://placehold.co/150x150?text=DAP' },
    { id: 3, name: 'Tomato Seeds', price: '₹450', off: '20% Off', image: 'https://placehold.co/150x150?text=Seeds' },
    { id: 4, name: 'Neem Oil', price: '₹299', off: '15% Off', image: 'https://placehold.co/150x150?text=Neem' },
    { id: 5, name: 'Sprayer Pump', price: '₹1,200', off: '30% Off', image: 'https://placehold.co/150x150?text=Pump' },
    { id: 6, name: 'Potash', price: '₹800', off: '12% Off', image: 'https://placehold.co/150x150?text=Potash' },
];

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const [activeBanner, setActiveBanner] = useState(0);

    const handleNextBanner = () => {
        setActiveBanner((prev) => (prev + 1) % bannerData.length);
    };

    const handlePrevBanner = () => {
        setActiveBanner((prev) => (prev - 1 + bannerData.length) % bannerData.length);
    };

    return (
        <ThemeProvider theme={dashboardTheme}>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#F1F3F6' }}>

                {/* 1. White Categories Strip (Flipkart Style) */}
                <Paper elevation={1} sx={{ bgcolor: 'white', py: 2, mb: 1, borderRadius: 0 }}>
                    <Container maxWidth="xl">
                        <Stack
                            direction="row"
                            spacing={4}
                            sx={{
                                overflowX: 'auto',
                                pb: 0.5,
                                justifyContent: { md: 'center', xs: 'flex-start' }, // Center on desktop, scroll on mobile
                                '&::-webkit-scrollbar': { display: 'none' } // Hide scrollbar
                            }}
                        >
                            {categories.map((cat) => (
                                <Box
                                    key={cat.id}
                                    onClick={() => navigate(`/products?category=${cat.name}`)}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        minWidth: 70,
                                        '&:hover .MuiTypography-root': { color: '#2E7D32' }
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 60,
                                            height: 60,
                                            bgcolor: 'white',
                                            border: '1px solid #e0e0e0',
                                            color: '#2E7D32',
                                            mb: 1,
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'scale(1.1)' }
                                        }}
                                    >
                                        <cat.icon fontSize="large" />
                                    </Avatar>
                                    <Typography variant="body2" fontWeight="600" color="textSecondary" sx={{ fontSize: '0.85rem' }}>
                                        {cat.name}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Container>
                </Paper>

                {/* 2. Hero Carousel (Full Width with Arrows) */}
                <Box sx={{ position: 'relative', mb: 2, bgcolor: 'white', p: 1 }}>
                    <Container maxWidth="xl" disableGutters>
                        <Box sx={{
                            position: 'relative',
                            height: { xs: 180, md: 280 },
                            overflow: 'hidden',
                            borderRadius: 0
                        }}>
                            {/* Slide Content */}
                            <motion.div
                                key={activeBanner}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                style={{ height: '100%' }}
                            >
                                <Box sx={{
                                    height: '100%',
                                    width: '100%',
                                    bgcolor: bannerData[activeBanner].color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    textAlign: 'center'
                                }}>
                                    <Box>
                                        <Typography variant="h3" fontWeight="800" sx={{ mb: 1, fontSize: { xs: '1.5rem', md: '3rem' } }}>
                                            {bannerData[activeBanner].title}
                                        </Typography>
                                        <Typography variant="h6">{bannerData[activeBanner].sub}</Typography>
                                        <Button
                                            variant="contained"
                                            sx={{ mt: 3, bgcolor: 'white', color: 'black', fontWeight: 'bold' }}
                                        >
                                            Check Now
                                        </Button>
                                    </Box>
                                </Box>
                            </motion.div>

                            {/* Arrows */}
                            <IconButton
                                onClick={handlePrevBanner}
                                sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', bgcolor: 'white', '&:hover': { bgcolor: 'white' } }}
                            >
                                <ArrowBackIosIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                onClick={handleNextBanner}
                                sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', bgcolor: 'white', '&:hover': { bgcolor: 'white' } }}
                            >
                                <ArrowForwardIosIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Container>
                </Box>

                {/* 3. Product Rails Layout (Flipkart Style) */}
                <Container maxWidth="xl" sx={{ pb: 4 }}>

                    {/* Section 1: Best of Agriculture (Box Layout) */}
                    <Paper sx={{ mb: 2, borderRadius: 1, overflow: 'hidden' }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2,
                            borderBottom: '1px solid #f0f0f0',
                            backgroundImage: 'linear-gradient(90deg, #2E7D32 0%, #a5d6a7 100%)',
                            color: 'white'
                        }}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">Best of Agriculture</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.9 }}>Best Devices & Tools</Typography>
                            </Box>
                            <Button
                                variant="contained"
                                sx={{ bgcolor: 'white', color: '#2E7D32', textTransform: 'none', fontWeight: 'bold' }}
                                endIcon={<ArrowForwardIcon />}
                            >
                                View All
                            </Button>
                        </Box>

                        {/* Horizontal Scroll Container */}
                        <Box sx={{ display: 'flex', overflowX: 'auto', p: 2, gap: 2, '&::-webkit-scrollbar': { height: 6 } }}>
                            {products.map((product) => (
                                <Box
                                    key={product.id}
                                    sx={{
                                        minWidth: 200,
                                        p: 2,
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        '&:hover': { boxShadow: 3 }
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={product.image}
                                        alt={product.name}
                                        sx={{ height: 120, objectFit: 'contain', mb: 2 }}
                                    />
                                    <Typography variant="body2" fontWeight="500">{product.name}</Typography>
                                    <Typography variant="body2" color="success.main" fontWeight="bold">{product.off}</Typography>
                                    <Typography variant="body2" color="text.secondary">{product.price}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>

                    {/* Section 2: Featured Brands (Grid Layout) */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        {[1, 2, 3].map((item) => (
                            <Grid item xs={12} md={4} key={item}>
                                <Paper sx={{ p: 0, borderRadius: 1, overflow: 'hidden', cursor: 'pointer' }}>
                                    <Box sx={{ height: 200, bgcolor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography variant="h5" color="text.secondary">Promotional Banner {item}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Section 3: Recommended for You */}
                    <Paper sx={{ mb: 2, borderRadius: 1 }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
                            <Typography variant="h6" fontWeight="bold">Recommended for You</Typography>
                            <Typography variant="caption" color="text.secondary">Based on your interest</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', overflowX: 'auto', p: 2, gap: 2 }}>
                            {[...products].reverse().map((product) => (
                                <Box
                                    key={product.id}
                                    sx={{
                                        minWidth: 180,
                                        p: 1.5,
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        '&:hover': { boxShadow: 2, borderColor: '#2E7D32' }
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={product.image}
                                        alt={product.name}
                                        sx={{ height: 100, objectFit: 'contain', mb: 1.5 }}
                                    />
                                    <Typography variant="body2" fontWeight="500" noWrap>{product.name}</Typography>
                                    <Typography variant="body2" fontWeight="bold">{product.price}</Typography>
                                    <Typography variant="caption" color="text.secondary">Free Delivery</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>

                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default CustomerDashboard;
