import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    IconButton,
    Button,
    Chip,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Drawer,
    AppBar,
    Toolbar,
    useMediaQuery,
    Menu,
    MenuItem,
    Stack,
    Divider,
    Tab,
    Tabs,
    LinearProgress
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    VerifiedUser as VerifiedIcon,
    Settings as SettingsIcon,
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    MoreVert as MoreVertIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Security as SecurityIcon,
    ShoppingBag as OrderIcon,
    Store as VendorIcon,
    LocalShipping as DeliveryIcon,
    Person as CustomerIcon,
    Terminal as TerminalIcon,
    Code as CodeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Hacker Theme for Admin
const hackerTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#00ff00', // Hacker Green
        },
        secondary: {
            main: '#00ff00',
        },
        background: {
            default: '#000000',
            paper: '#0a0a0a',
        },
        text: {
            primary: '#e0e0e0',
            secondary: '#00ff00', // Green text for secondary
        },
        divider: '#333',
    },
    typography: {
        fontFamily: "'Courier New', monospace",
        h4: { fontWeight: 700, letterSpacing: 1 },
        h6: { letterSpacing: 1 },
        button: { fontWeight: 700 },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    border: '1px solid #00ff00',
                    color: '#00ff00',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 255, 0, 0.1)',
                        boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)'
                    }
                },
                contained: {
                    backgroundColor: '#00ff00',
                    color: 'black',
                    '&:hover': {
                        backgroundColor: '#00cc00'
                    }
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    border: '1px solid #222',
                    borderRadius: 0
                }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #222',
                    fontFamily: 'monospace'
                },
                head: {
                    color: '#00ff00',
                    fontWeight: 'bold',
                    borderBottom: '2px solid #00ff00'
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    fontFamily: 'monospace',
                    border: '1px solid',
                    backgroundColor: 'transparent'
                },
                colorSuccess: {
                    borderColor: '#00ff00',
                    color: '#00ff00'
                },
                colorWarning: {
                    borderColor: '#ffff00',
                    color: '#ffff00'
                },
                colorError: {
                    borderColor: '#ff0000',
                    color: '#ff0000'
                }
            }
        }
    }
});

// Sidebar width
const drawerWidth = 280;

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(hackerTheme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [userFilter, setUserFilter] = useState('all');

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Mock Data
    const stats = [
        { label: 'SYSTEM_USERS', value: '12,450', icon: PeopleIcon },
        { label: 'ACTIVE_THREADS', value: '450', icon: OrderIcon },
        { label: 'PENDING_AUTH', value: '12', icon: VerifiedIcon },
        { label: 'NET_REVENUE', value: '₹4.2M', icon: SecurityIcon }
    ];

    const recentUsers = [
        { id: 1, name: 'Rahul_Farmer', role: 'vendor', status: 'Active', date: '2024-12-19' },
        { id: 2, name: 'Speedy_Del', role: 'delivery_partner', status: 'Pending', date: '2024-12-18' },
        { id: 3, name: 'Amit_Kumar', role: 'customer', status: 'Active', date: '2024-12-18' },
        { id: 4, name: 'Green_Grocers', role: 'vendor', status: 'Active', date: '2024-12-17' },
        { id: 5, name: 'John_Doe', role: 'delivery_partner', status: 'Blocked', date: '2024-12-16' },
    ];

    const pendingApprovals = [
        { id: 101, name: 'Fresh_Farms_Ltd', type: 'Vendor', submitted: '2h ago' },
        { id: 102, name: 'Quick_Force', type: 'Delivery', submitted: '5h ago' },
        { id: 103, name: 'Org_Spices', type: 'Vendor', submitted: '1d ago' },
    ];

    // Sidebar Content
    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#000', borderRight: '1px solid #333' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <TerminalIcon sx={{ color: '#00ff00', fontSize: 32 }} />
                <Box>
                    <Typography variant="h6" fontWeight="bold" color="#00ff00" lineHeight={1} sx={{ fontFamily: 'monospace' }}>
                        SYS_ADMIN
                    </Typography>
                    <Typography variant="caption" color="#666" sx={{ fontFamily: 'monospace' }}>
                        v4.2.0-stable
                    </Typography>
                </Box>
            </Box>
            <Divider sx={{ borderColor: '#333' }} />
            <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
                {[
                    { text: 'OVERVIEW', icon: DashboardIcon },
                    { text: 'USER_DB', icon: PeopleIcon },
                    { text: 'APPROVALS', icon: VerifiedIcon },
                    { text: 'CONFIG', icon: SettingsIcon }
                ].map((item, index) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            selected={activeTab === index}
                            onClick={() => setActiveTab(index)}
                            sx={{
                                borderRadius: 0,
                                borderLeft: activeTab === index ? '4px solid #00ff00' : '4px solid transparent',
                                '&.Mui-selected': { bgcolor: 'rgba(0,255,0,0.1)', color: '#00ff00' },
                                '&:hover': { bgcolor: 'rgba(0,255,0,0.05)' }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: activeTab === index ? '#00ff00' : '#666' }}>
                                <item.icon />
                            </ListItemIcon>
                            <ListItemText primary={item.text} primaryTypographyProps={{ fontFamily: 'monospace', fontWeight: 'bold' }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Box sx={{ p: 2, borderTop: '1px solid #333' }}>
                <Typography variant="caption" sx={{ color: '#444', fontFamily: 'monospace', display: 'block', mb: 1 }}>
                    SYS_STATUS: ONLINE
                </Typography>
                <LinearProgress variant="determinate" value={88} sx={{ bgcolor: '#222', '& .MuiLinearProgress-bar': { bgcolor: '#00ff00' } }} />
            </Box>
        </Box>
    );

    return (
        <ThemeProvider theme={hackerTheme}>
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

                {/* AppBar */}
                <AppBar
                    position="fixed"
                    sx={{
                        width: { md: `calc(100% - ${drawerWidth}px)` },
                        ml: { md: `${drawerWidth}px` },
                        boxShadow: 'none',
                        borderBottom: '1px solid #333',
                        bgcolor: 'rgba(0,0,0,0.9)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { md: 'none' }, color: '#00ff00' }}
                        >
                            <MenuIcon />
                        </IconButton>

                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" color="#00ff00" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                                {activeTab === 0 ? 'root@agrokart:~# view overview' :
                                    activeTab === 1 ? 'root@agrokart:~# view users' :
                                        activeTab === 2 ? 'root@agrokart:~# view approvals' : 'root@agrokart:~# config sys'}
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconButton size="large" sx={{ color: '#00ff00' }}>
                                <NotificationsIcon />
                            </IconButton>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CodeIcon />}
                                onClick={handleLogout}
                                sx={{ fontFamily: 'monospace' }}
                            >
                                LOGOUT
                            </Button>
                        </Stack>
                    </Toolbar>
                </AppBar>

                {/* Drawer */}
                <Box
                    component="nav"
                    sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
                >
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            display: { xs: 'block', md: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                    >
                        {drawer}
                    </Drawer>
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: 'none', md: 'block' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                        open
                    >
                        {drawer}
                    </Drawer>
                </Box>

                {/* Main Content */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        width: { md: `calc(100% - ${drawerWidth}px)` },
                        mt: 8,
                        color: '#e0e0e0'
                    }}
                >
                    <Container maxWidth="xl" disableGutters>

                        {/* 0: Overview */}
                        {activeTab === 0 && (
                            <>
                                <Grid container spacing={3} sx={{ mb: 4 }}>
                                    {stats.map((stat, index) => (
                                        <Grid item xs={12} sm={6} md={3} key={index}>
                                            <Card sx={{ height: '100%', bgcolor: '#0a0a0a' }}>
                                                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Box>
                                                        <Typography variant="caption" color="#666" gutterBottom sx={{ fontFamily: 'monospace' }}>
                                                            &gt; {stat.label}
                                                        </Typography>
                                                        <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff', fontFamily: 'monospace' }}>
                                                            {stat.value}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ p: 1.5, border: '1px solid #333', color: '#00ff00' }}>
                                                        <stat.icon />
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Grid container spacing={3}>
                                    {/* Approvals Widget */}
                                    <Grid item xs={12} md={6}>
                                        <Card sx={{ height: '100%', bgcolor: '#0a0a0a' }}>
                                            <Box sx={{ p: 3, borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="h6" fontWeight="bold" sx={{ color: '#00ff00' }}>PENDING_APPROVALS</Typography>
                                                <Button size="small" onClick={() => setActiveTab(2)}>VIEW_ALL</Button>
                                            </Box>
                                            <List>
                                                {pendingApprovals.map((item) => (
                                                    <ListItem key={item.id} divider sx={{ borderColor: '#222' }}>
                                                        <ListItemIcon sx={{ color: '#666' }}>
                                                            <TerminalIcon fontSize="small" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={item.name}
                                                            secondary={`TYPE: ${item.type} | T: ${item.submitted}`}
                                                            primaryTypographyProps={{ fontFamily: 'monospace', color: '#ddd' }}
                                                            secondaryTypographyProps={{ fontFamily: 'monospace', color: '#666', fontSize: '0.75rem' }}
                                                        />
                                                        <Stack direction="row" spacing={1}>
                                                            <IconButton size="small" sx={{ color: '#00ff00' }}><CheckCircleIcon /></IconButton>
                                                            <IconButton size="small" sx={{ color: '#ff0000' }}><CancelIcon /></IconButton>
                                                        </Stack>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Card>
                                    </Grid>

                                    {/* Recent Users Widget */}
                                    <Grid item xs={12} md={6}>
                                        <Card sx={{ height: '100%', bgcolor: '#0a0a0a' }}>
                                            <Box sx={{ p: 3, borderBottom: '1px solid #222' }}>
                                                <Typography variant="h6" fontWeight="bold" sx={{ color: '#00ff00' }}>SYS_LOGS: NEW_USERS</Typography>
                                            </Box>
                                            <TableContainer>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>USR_ID</TableCell>
                                                            <TableCell>ROLE_TAG</TableCell>
                                                            <TableCell align="right">STATE</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {recentUsers.slice(0, 4).map((user) => (
                                                            <TableRow key={user.id}>
                                                                <TableCell sx={{ color: '#ddd' }}>{user.name}</TableCell>
                                                                <TableCell>
                                                                    <Typography component="span" variant="caption" sx={{ border: '1px solid #444', px: 1, color: '#aaa' }}>
                                                                        {user.role}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Chip
                                                                        label={user.status.toUpperCase()}
                                                                        size="small"
                                                                        color={user.status === 'Active' ? 'success' : user.status === 'Pending' ? 'warning' : 'error'}
                                                                        sx={{ fontWeight: 'bold' }}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </>
                        )}

                        {/* 1: User Management */}
                        {activeTab === 1 && (
                            <Card sx={{ bgcolor: '#0a0a0a' }}>
                                <Box sx={{ p: 3, borderBottom: '1px solid #222' }}>
                                    <Tabs value={userFilter} onChange={(e, v) => setUserFilter(v)} textColor="secondary" indicatorColor="secondary"
                                        sx={{ '& .MuiTab-root': { color: '#666', fontFamily: 'monospace' }, '& .Mui-selected': { color: '#00ff00' } }}
                                    >
                                        <Tab value="all" label="ALL_NODES" />
                                        <Tab value="customer" label="CUSTOMERS" />
                                        <Tab value="vendor" label="VENDORS" />
                                        <Tab value="delivery_partner" label="AGENTS" />
                                    </Tabs>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>IDENTITY</TableCell>
                                                <TableCell>ACCESS_LEVEL</TableCell>
                                                <TableCell>TIMESTAMP</TableCell>
                                                <TableCell>STATUS</TableCell>
                                                <TableCell align="right">CMD</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {recentUsers.filter(u => userFilter === 'all' || u.role === userFilter).map((user) => (
                                                <TableRow key={user.id} hover sx={{ '&:hover': { bgcolor: 'rgba(0,255,0,0.05)!important' } }}>
                                                    <TableCell fontWeight="medium">
                                                        <Stack direction="row" spacing={2} alignItems="center">
                                                            <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: '#222', color: '#00ff00', border: '1px solid #00ff00' }}>{user.name.charAt(0)}</Avatar>
                                                            <Typography variant="body2" fontWeight="medium" sx={{ color: '#fff', fontFamily: 'monospace' }}>{user.name}</Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell sx={{ textTransform: 'uppercase', color: '#aaa' }}>{user.role}</TableCell>
                                                    <TableCell sx={{ color: '#666' }}>{user.date}</TableCell>
                                                    <TableCell>
                                                        <Chip label={user.status.toUpperCase()} size="small" color={user.status === 'Active' ? 'success' : user.status === 'Pending' ? 'warning' : 'error'} />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small" sx={{ color: '#666' }}><MoreVertIcon /></IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        )}

                        {/* 2: Approvals */}
                        {activeTab === 2 && (
                            <Card sx={{ bgcolor: '#0a0a0a' }}>
                                <Box sx={{ p: 3, borderBottom: '1px solid #222' }}>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#00ff00' }}>INCOMING_REQUESTS</Typography>
                                    <Typography variant="caption" color="#666" sx={{ fontFamily: 'monospace' }}>AWAITING_AUTH_TOKEN</Typography>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>ENTITY</TableCell>
                                                <TableCell>CLASS</TableCell>
                                                <TableCell>PAYLOAD</TableCell>
                                                <TableCell>LATENCY</TableCell>
                                                <TableCell align="right">EXECUTE</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pendingApprovals.map((item) => (
                                                <TableRow key={item.id} hover sx={{ '&:hover': { bgcolor: 'rgba(0,255,0,0.05)!important' } }}>
                                                    <TableCell fontWeight="medium" sx={{ color: '#fff', fontFamily: 'monospace' }}>{item.name}</TableCell>
                                                    <TableCell>
                                                        <Chip label={item.type.toUpperCase()} size="small" sx={{ color: '#aaa', borderColor: '#444' }} variant="outlined" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button size="small" variant="text" startIcon={<CodeIcon />} sx={{ color: '#00ff00' }}>VIEW_DATA</Button>
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#666' }}>{item.submitted}</TableCell>
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                            <Button size="small" variant="contained" color="success">ACCEPT</Button>
                                                            <Button size="small" variant="outlined" color="error">DENY</Button>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        )}

                        {/* 3: Settings */}
                        {activeTab === 3 && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ bgcolor: '#0a0a0a' }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#00ff00' }}>ROOT_CONFIG</Typography>
                                            <List>
                                                <ListItem>
                                                    <ListItemText
                                                        primary="ALLOW_NEW_NODES"
                                                        secondary="Enable public registration"
                                                        primaryTypographyProps={{ fontFamily: 'monospace', color: '#eee' }}
                                                        secondaryTypographyProps={{ fontFamily: 'monospace', color: '#666' }}
                                                    />
                                                    <Chip label="TRUE" color="success" size="small" />
                                                </ListItem>
                                                <Divider component="li" sx={{ borderColor: '#222' }} />
                                                <ListItem>
                                                    <ListItemText
                                                        primary="SYSTEM_LOCKDOWN"
                                                        secondary="Kill switch for all services"
                                                        primaryTypographyProps={{ fontFamily: 'monospace', color: '#eee' }}
                                                        secondaryTypographyProps={{ fontFamily: 'monospace', color: '#666' }}
                                                    />
                                                    <Chip label="FALSE" sx={{ borderColor: '#666', color: '#666' }} variant="outlined" size="small" />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}

                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default AdminDashboard;
