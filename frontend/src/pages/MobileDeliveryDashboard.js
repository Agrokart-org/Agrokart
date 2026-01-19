import React, { useState, useRef } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    Button,
    Chip,
    useTheme,
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    Avatar,
    Stack,
    Switch,
    Grid,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Timeline as HistoryIcon,
    AccountBalanceWallet as WalletIcon,
    Person as ProfileIcon,
    LocalShipping,
    GpsFixed,
    Directions,
    Notifications,
    Settings,
    ExitToApp,
    CheckCircle,
    Close
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const MobileDeliveryDashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const socket = useSocket();
    const [value, setValue] = useState(0);

    const [isOnline, setIsOnline] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const simulationInterval = useRef(null);

    const simulationPath = [
        { lat: 18.5204, lng: 73.8567 },
        { lat: 18.5210, lng: 73.8570 },
        { lat: 18.5215, lng: 73.8575 },
        { lat: 18.5220, lng: 73.8580 },
        { lat: 18.5225, lng: 73.8585 },
        { lat: 18.5230, lng: 73.8590 },
        { lat: 18.5235, lng: 73.8595 },
        { lat: 18.5240, lng: 73.8600 },
        { lat: 18.5245, lng: 73.8605 },
        { lat: 18.5250, lng: 73.8610 },
    ];

    const handleOnlineToggle = (event) => {
        const online = event.target.checked;
        setIsOnline(online);
        if (online && socket) {
            socket.emit('join_tracking', '2024-889');
        } else if (socket) {
            socket.emit('leave_tracking', '2024-889');
            stopSimulation();
        }
    };

    const startSimulation = () => {
        if (!socket || !isOnline) return;
        if (isSimulating) {
            stopSimulation();
            return;
        }
        setIsSimulating(true);
        let index = 0;
        simulationInterval.current = setInterval(() => {
            if (index >= simulationPath.length) index = 0;
            const loc = simulationPath[index];
            socket.emit('update_location', {
                orderId: '2024-889',
                latitude: loc.lat,
                longitude: loc.lng,
                heading: 0,
                speed: 40
            });
            index++;
        }, 2000);
    };

    const stopSimulation = () => {
        setIsSimulating(false);
        if (simulationInterval.current) {
            clearInterval(simulationInterval.current);
            simulationInterval.current = null;
        }
    };

    const renderDashboard = () => (
        <Box sx={{ p: 2, pb: 10 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={user?.avatar} sx={{ border: '2px solid #4CAF50' }}>{user?.name?.[0]}</Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="800">{user?.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isOnline ? '#4CAF50' : '#B0BEC5' }} />
                            <Typography variant="caption" fontWeight="bold" color={isOnline ? 'success.main' : 'text.secondary'}>
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <Switch checked={isOnline} onChange={handleOnlineToggle} color="success" />
            </Box>

            {/* Offline State */}
            <AnimatePresence>
                {!isOnline && (
                    <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Card sx={{ bgcolor: '#263238', color: 'white', py: 4, borderRadius: 4, textAlign: 'center' }}>
                            <LocalShipping sx={{ fontSize: 48, mb: 2, opacity: 0.8 }} />
                            <Typography variant="h6" fontWeight="bold">You are Offline</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7, mb: 3 }}>Go online to start receiving orders.</Typography>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={() => handleOnlineToggle({ target: { checked: true } })}
                                sx={{ borderRadius: 10, px: 4 }}
                            >
                                Go Online
                            </Button>
                        </Card>
                    </MotionBox>
                )}
            </AnimatePresence>

            {/* Active Order */}
            {isOnline && (
                <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Current Order</Typography>
                    <Card sx={{ borderRadius: 4, overflow: 'visible', border: '1px solid #E0E0E0', boxShadow: 'none' }}>
                        <Box sx={{ bgcolor: '#4CAF50', color: 'white', p: 2, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography fontWeight="bold">#ORD-2024-889</Typography>
                                <Chip label="In Transit" size="small" sx={{ bgcolor: 'white', color: '#4CAF50', fontWeight: 'bold' }} />
                            </Box>
                        </Box>
                        <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Box>
                                    <Typography variant="h4" fontWeight="800">12 min</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">EST. TIME</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="h4" fontWeight="800" color="primary">₹85</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">EARNINGS</Typography>
                                </Box>
                            </Box>

                            {/* Timeline */}
                            <Box sx={{ position: 'relative', pl: 3, borderLeft: '2px dashed #ddd', ml: 1, mb: 3 }}>
                                <Box sx={{ position: 'absolute', left: -7, top: 0, width: 12, height: 12, borderRadius: '50%', bgcolor: '#4CAF50' }} />
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">PICKUP</Typography>
                                <Typography variant="body2" fontWeight="600" sx={{ mb: 3 }}>Green Fields Farm</Typography>

                                <Box sx={{ position: 'absolute', left: -7, bottom: 0, width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF5722' }} />
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">DROPOFF</Typography>
                                <Typography variant="body2" fontWeight="600">Blue Ridge Apartments</Typography>
                            </Box>

                            <Stack direction="row" spacing={2}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<Directions />}
                                    sx={{ borderRadius: 3 }}
                                >
                                    Navigate
                                </Button>
                                <Button
                                    fullWidth
                                    variant={isSimulating ? "contained" : "outlined"}
                                    color={isSimulating ? "error" : "primary"}
                                    onClick={startSimulation}
                                    startIcon={<GpsFixed />}
                                    sx={{ borderRadius: 3 }}
                                >
                                    {isSimulating ? "Stop" : "Simulate"}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </MotionBox>
            )}

            {/* Today's Stats */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Today's Performance</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Paper sx={{ p: 2, bgcolor: '#FFF3E0', borderRadius: 3, textAlign: 'center' }} elevation={0}>
                            <WalletIcon sx={{ color: '#FF9800', mb: 1 }} />
                            <Typography variant="h6" fontWeight="800">₹1,240</Typography>
                            <Typography variant="caption">Earnings</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6}>
                        <Paper sx={{ p: 2, bgcolor: '#E8F5E9', borderRadius: 3, textAlign: 'center' }} elevation={0}>
                            <CheckCircle sx={{ color: '#4CAF50', mb: 1 }} />
                            <Typography variant="h6" fontWeight="800">4</Typography>
                            <Typography variant="caption">Completed</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );

    const renderHistory = () => (
        <Box sx={{ p: 2, pb: 10 }}>
            <Typography variant="h5" fontWeight="800" sx={{ mb: 3 }}>History</Typography>
            <Typography variant="body2" color="text.secondary" align="center">No past orders yet.</Typography>
        </Box>
    );

    const renderWallet = () => (
        <Box sx={{ p: 2, pb: 10 }}>
            <Typography variant="h5" fontWeight="800" sx={{ mb: 3 }}>Wallet</Typography>
            <Card sx={{ bgcolor: theme.palette.primary.main, color: 'white', borderRadius: 4, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Available Balance</Typography>
                    <Typography variant="h3" fontWeight="bold">₹2,450</Typography>
                    <Button variant="contained" sx={{ mt: 2, bgcolor: 'white', color: theme.palette.primary.main, borderRadius: 10 }}>
                        Withdraw
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );

    const renderProfile = () => (
        <Box sx={{ p: 2, pb: 10 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, mt: 2 }}>
                <Avatar src={user?.avatar} sx={{ width: 80, height: 80, mb: 2, border: '3px solid #4CAF50' }} />
                <Typography variant="h5" fontWeight="bold">{user?.name}</Typography>
                <Chip label="4.8 ★" color="warning" size="small" sx={{ mt: 1, fontWeight: 'bold' }} />
            </Box>

            <List component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #f0f0f0' }}>
                <ListItem button divider>
                    <ListItemIcon><Settings /></ListItemIcon>
                    <ListItemText primary="Preferences" />
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
            <Box sx={{ height: '100%', overflowY: 'auto' }}>
                {value === 0 && renderDashboard()}
                {value === 1 && renderHistory()}
                {value === 2 && renderWallet()}
                {value === 3 && renderProfile()}
            </Box>

            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }} elevation={10}>
                <BottomNavigation
                    showLabels
                    value={value}
                    onChange={(event, newValue) => setValue(newValue)}
                    sx={{ height: 70, '& .Mui-selected': { color: theme.palette.primary.main } }}
                >
                    <BottomNavigationAction label="Dash" icon={<DashboardIcon />} />
                    <BottomNavigationAction label="History" icon={<HistoryIcon />} />
                    <BottomNavigationAction label="Wallet" icon={<WalletIcon />} />
                    <BottomNavigationAction label="Profile" icon={<ProfileIcon />} />
                </BottomNavigation>
            </Paper>
        </Box>
    );
};

export default MobileDeliveryDashboard;
