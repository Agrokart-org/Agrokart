import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    IconButton,
    Button,
    Chip,
    useTheme,
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    Avatar,
    Fab,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Inventory as ProductsIcon,
    ShoppingCart as OrdersIcon,
    Person as ProfileIcon,
    Add as AddIcon,
    TrendingUp,
    AttachMoney,
    LocalShipping,
    MoreVert,
    ArrowForward,
    Notifications,
    Settings,
    ExitToApp
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const MobileVendorDashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [value, setValue] = useState(0);

    const stats = [
        { label: 'Revenue', value: '₹45k', icon: AttachMoney, color: '#1B5E20', bg: '#E8F5E9' },
        { label: 'Orders', value: '12', icon: OrdersIcon, color: '#1565C0', bg: '#E3F2FD' },
        { label: 'Products', value: '24', icon: ProductsIcon, color: '#E65100', bg: '#FFF3E0' },
        { label: 'Visits', value: '156', icon: TrendingUp, color: '#6A1B9A', bg: '#F3E5F5' }
    ];

    const recentOrders = [
        { id: '#101', customer: 'Ram Kumar', amount: '₹450', status: 'Pending', color: 'warning' },
        { id: '#102', customer: 'Priya S', amount: '₹1200', status: 'Delivered', color: 'success' },
        { id: '#103', customer: 'Rahul D', amount: '₹375', status: 'Processing', color: 'info' }
    ];

    const renderHome = () => (
        <Box sx={{ p: 2, pb: 10 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight="800" sx={{ color: theme.palette.text.primary }}>
                        Overview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Good Morning, {user?.name?.split(' ')[0] || 'Vendor'}!
                    </Typography>
                </Box>
                <IconButton sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
                    <Notifications />
                </IconButton>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {stats.map((stat, i) => (
                    <Grid item xs={6} key={i}>
                        <MotionCard
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            sx={{
                                bgcolor: stat.bg,
                                color: stat.color,
                                borderRadius: 4,
                                boxShadow: 'none',
                                height: '100%'
                            }}
                        >
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <stat.icon />
                                    {i === 0 && <Chip label="+15%" size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: 'white', color: stat.color, fontWeight: 'bold' }} />}
                                </Box>
                                <Typography variant="h5" fontWeight="800">{stat.value}</Typography>
                                <Typography variant="caption" fontWeight="600" sx={{ opacity: 0.8 }}>{stat.label}</Typography>
                            </CardContent>
                        </MotionCard>
                    </Grid>
                ))}
            </Grid>

            {/* Quick Actions */}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, scrollbarWidth: 'none' }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ borderRadius: 3, textTransform: 'none', whiteSpace: 'nowrap', minWidth: 'auto', px: 3 }}
                    onClick={() => navigate('/admin/add-product')}
                >
                    Add Product
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<LocalShipping />}
                    sx={{ borderRadius: 3, textTransform: 'none', whiteSpace: 'nowrap', minWidth: 'auto', px: 3 }}
                >
                    Manage Delivery
                </Button>
            </Box>

            {/* Recent Orders */}
            <Box sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Recent Orders</Typography>
                    <Button size="small" endIcon={<ArrowForward />}>View All</Button>
                </Box>
                {recentOrders.map((order, i) => (
                    <MotionCard
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        sx={{ mb: 2, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none' }}
                    >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: theme.palette.grey[100], color: theme.palette.text.secondary, width: 40, height: 40, fontSize: '0.9rem', fontWeight: 'bold' }}>
                                        {order.customer[0]}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="700">{order.customer}</Typography>
                                        <Typography variant="caption" color="text.secondary">Order {order.id}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="subtitle2" fontWeight="700">{order.amount}</Typography>
                                    <Chip label={order.status} size="small" color={order.color} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }} />
                                </Box>
                            </Box>
                        </CardContent>
                    </MotionCard>
                ))}
            </Box>
        </Box>
    );

    const renderProducts = () => (
        <Box sx={{ p: 2, pb: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <ProductsIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.2, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">Product Management</Typography>
            <Typography variant="body2" color="text.disabled">Functionality coming soon</Typography>
            <Fab color="primary" sx={{ position: 'fixed', bottom: 80, right: 20 }}>
                <AddIcon />
            </Fab>
        </Box>
    );

    const renderOrders = () => (
        <Box sx={{ p: 2, pb: 10 }}>
            <Typography variant="h5" fontWeight="800" sx={{ mb: 3 }}>My Orders</Typography>
            {recentOrders.map((order, i) => (
                <Card key={i} sx={{ mb: 2, borderRadius: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6">{order.id}</Typography>
                            <Typography variant="h6" color="primary">{order.amount}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">{order.customer}</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Chip label={order.status} color={order.color} size="small" />
                    </CardContent>
                </Card>
            ))}
        </Box>
    );

    const renderProfile = () => (
        <Box sx={{ p: 2, pb: 10 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, mt: 2 }}>
                <Avatar src={user?.avatar} sx={{ width: 80, height: 80, mb: 2, border: `3px solid ${theme.palette.primary.main}` }} />
                <Typography variant="h5" fontWeight="bold">{user?.name}</Typography>
                <Chip label="Verified Vendor" color="success" size="small" sx={{ mt: 1 }} />
            </Box>

            <List component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <ListItem button divider>
                    <ListItemIcon><Settings /></ListItemIcon>
                    <ListItemText primary="Settings" />
                </ListItem>
                <ListItem button divider>
                    <ListItemIcon><Notifications /></ListItemIcon>
                    <ListItemText primary="Notifications" />
                </ListItem>
                <ListItem button onClick={logout} sx={{ color: 'error.main' }}>
                    <ListItemIcon><ExitToApp color="error" /></ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
            {/* Content Area */}
            <Box sx={{ height: '100%', overflowY: 'auto' }}>
                {value === 0 && renderHome()}
                {value === 1 && renderProducts()}
                {value === 2 && renderOrders()}
                {value === 3 && renderProfile()}
            </Box>

            {/* Bottom Navigation */}
            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }} elevation={10}>
                <BottomNavigation
                    showLabels
                    value={value}
                    onChange={(event, newValue) => setValue(newValue)}
                    sx={{
                        height: 70,
                        bgcolor: 'white',
                        '& .Mui-selected': { color: theme.palette.primary.main }
                    }}
                >
                    <BottomNavigationAction label="Home" icon={<DashboardIcon />} />
                    <BottomNavigationAction label="Products" icon={<ProductsIcon />} />
                    <BottomNavigationAction label="Orders" icon={<OrdersIcon />} />
                    <BottomNavigationAction label="Profile" icon={<ProfileIcon />} />
                </BottomNavigation>
            </Paper>
        </Box>
    );
};

export default MobileVendorDashboard;
