import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Tab,
  Tabs,
  useTheme,
  Chip,
  LinearProgress,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Tooltip,
  useMediaQuery,
  TextField,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Payment as PaymentIcon,
  Favorite as FavoriteIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  ArrowForward as ArrowForwardIcon,
  ShoppingBag as OrderIcon,
  Notifications as NotificationsIcon,
  Star as StarIcon,
  Agriculture as AgricultureIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  CameraAlt as CameraIcon,
  VerifiedUser as VerifiedIcon,
  Logout as LogoutIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import bannerOrganic from '../assets/banner_organic_harvest.png';

const OrderCard = ({ order }) => {
  return (
    <Paper
      elevation={0}
      component={motion.div}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.3 }}
      sx={{
        mb: 3,
        border: 'none',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        background: '#ffffff'
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Order #{order.id}
          </Typography>
          <Chip
            label={order.status}
            size="small"
            sx={{
              bgcolor: order.color === 'success' ? '#e8f5e9' : order.color === 'warning' ? '#fff3e0' : '#e3f2fd',
              color: order.color === 'success' ? '#2e7d32' : order.color === 'warning' ? '#ef6c00' : '#1565c0',
              fontWeight: 'bold',
              borderRadius: 1
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Placed on {order.date}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Items */}
        <Box sx={{ mb: 2 }}>
          {order.items.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.primary">{item.name} x {item.quantity}</Typography>
              <Typography variant="body2" fontWeight="bold">₹{item.price}</Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Total */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">Total Amount</Typography>
          <Typography variant="h6" fontWeight="bold" color="primary.main">{order.total}</Typography>
        </Box>

        {/* Tracking Info Text */}
        {order.trackingText && (
          <Typography variant="caption" sx={{ color: order.color === 'success' ? 'success.main' : 'primary.main', display: 'flex', alignItems: 'center', mb: 2 }}>
            {order.status === 'Delivered' ? '✓ ' : '🚚 '}{order.trackingText}
          </Typography>
        )}

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="success"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
          >
            View Details
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="success"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', bgcolor: '#4caf50', '&:hover': { bgcolor: '#43a047' } }}
          >
            {order.status === 'Delivered' ? 'Reorder' : 'Track Order'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};



const ProfilePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, logout, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState('All Orders'); // New Filter State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size should be less than 5MB.');
      return;
    }

    setUploading(true);

    // Create a reference to 'profile_images/UID_TIMESTAMP'
    const storageRef = ref(storage, `profile_images/${user.id}_${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Promise to handle the upload completion or error
    const uploadPromise = new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // You could track progress here if needed
          // const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            if (uploadTask.snapshot.ref) {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } else {
              reject(new Error("Upload failed: No ref found"));
            }
          } catch (err) { reject(err); }
        }
      );
    });

    try {
      if (!user?.id) throw new Error('User ID not found');

      // Race the upload against a 15s timeout to catch "hanging" CORS/Network issues
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timed out. Check your network or CORS settings.')), 15000)
      );

      const photoURL = await Promise.race([uploadPromise, timeoutPromise]);

      // Update user profile immediately
      await updateUserProfile({ photoURL });

      alert('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      let msg = 'Failed to upload image.';
      if (error.message.includes('timed out')) {
        msg = 'Upload timed out. This is often due to CORS issues on localhost. Please configure Firebase Storage CORS.';
      } else if (error.code === 'storage/unauthorized') {
        msg = 'Permission denied. Please check your storage rules.';
      }
      alert(msg);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Initialize form data when user loads or dialog opens
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  // Statistics
  const stats = [
    { label: 'Orders', value: '12', icon: OrderIcon, color: '#4CAF50' },
    { label: 'Points', value: '850', icon: StarIcon, color: '#FFC107' },
    { label: 'Saved', value: '₹2.4k', icon: FavoriteIcon, color: '#f44336' },
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      // Call update function from AuthContext
      await updateUserProfile({
        name: formData.name,
        // photoURL: formData.photoURL // Support for photo upload could be added here
      });
      setEditDialogOpen(false);
      // Optional: Add a toast notification here
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          {/* Left Column: Profile Card */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={4}
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                mb: 3
              }}
            >
              {/* Cover Image */}
              <Box
                sx={{
                  height: 140,
                  backgroundImage: `url(${bannerOrganic})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))'
                  }}
                />
              </Box>

              <CardContent sx={{ pt: 0, position: 'relative', textAlign: 'center' }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        border: '2px solid white',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                      onClick={() => setEditDialogOpen(true)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <Avatar
                    src={user?.avatar}
                    sx={{
                      width: 100,
                      height: 100,
                      border: '4px solid white',
                      mt: -6,
                      fontSize: '2.5rem',
                      bgcolor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </Avatar>
                </Badge>

                <Typography variant="h5" fontWeight="700" sx={{ mt: 1 }}>
                  {user?.name || 'Agro User'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user?.role === 'customer' ? 'Premium Farmer' : 'User'}
                  {user?.isVerified && (
                    <Tooltip title="Verified">
                      <VerifiedIcon sx={{ fontSize: 16, color: 'primary.main', ml: 0.5, verticalAlign: 'middle' }} />
                    </Tooltip>
                  )}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, my: 2 }}>
                  <Chip
                    label="Gold Member"
                    size="small"
                    sx={{
                      bgcolor: 'orange',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.75rem'
                    }}
                  />
                  <Chip
                    label="Verified"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </Box>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {stats.map((stat, idx) => (
                    <Grid item xs={4} key={idx}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'action.hover' }}>
                        <stat.icon sx={{ color: stat.color, fontSize: 24, mb: 0.5 }} />
                        <Typography variant="h6" fontWeight="bold" lineHeight={1}>
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setEditDialogOpen(true)}
                  sx={{ mt: 3, borderRadius: 20, textTransform: 'none' }}
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Farm Details Card */}
            <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <AgricultureIcon sx={{ mr: 1, color: 'primary.main' }} /> Farm Details
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={75}
                  sx={{ height: 8, borderRadius: 4, mb: 1, bgcolor: 'grey.200' }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">Total Size</Typography>
                  <Typography variant="body2" fontWeight="bold">15 Acres</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Active Crops
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {['Wheat', 'Cotton', 'Sugarcane'].map((crop) => (
                    <Chip key={crop} label={crop} size="small" variant="outlined" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Content Tabs */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', minHeight: 400 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant={isMobile ? "scrollable" : "fullWidth"}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    minHeight: 60
                  }
                }}
              >
                <Tab icon={<OrderIcon />} iconPosition="start" label="My Orders" />
                <Tab icon={<FavoriteIcon />} iconPosition="start" label="Favorites" />
                <Tab icon={<SettingsIcon />} iconPosition="start" label="Settings" />
              </Tabs>

              <Box sx={{ p: 3, bgcolor: '#fafafa', minHeight: 500 }}>
                <AnimatePresence mode="wait">
                  {/* Orders Tab */}
                  {activeTab === 0 && (
                    <motion.div
                      key="orders"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>My Orders</Typography>
                        {/* Sub-tabs for filtering */}
                      </Box>

                      <Tabs
                        value={filterStatus}
                        onChange={(e, val) => setFilterStatus(val)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                          mb: 3,
                          minHeight: 40,
                          '& .MuiTabs-indicator': { display: 'none' },
                          '& .MuiTab-root': {
                            py: 1,
                            px: 2,
                            minHeight: 40,
                            fontSize: '0.85rem',
                            textTransform: 'capitalize',
                            fontWeight: 'bold',
                            borderRadius: 20,
                            mr: 1,
                            transition: '0.3s',
                            '&.Mui-selected': {
                              bgcolor: 'primary.main',
                              color: 'white',
                              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)'
                            },
                            '&:hover:not(.Mui-selected)': {
                              bgcolor: 'action.hover'
                            }
                          }
                        }}
                      >
                        <Tab value="All Orders" label="All Orders" />
                        <Tab value="Processing" label="Processing" />
                        <Tab value="Shipped" label="Shipped" />
                        <Tab value="Delivered" label="Delivered" />
                      </Tabs>

                      {/* Interactive Order List */}
                      <LayoutGroup>
                        <motion.div layout>
                          {[
                            {
                              id: 'ORD001',
                              date: 'Jan 15, 2024',
                              total: '₹1,250',
                              status: 'Delivered',
                              color: 'success',
                              trackingText: 'Delivered on Jan 18, 2024',
                              items: [
                                { name: 'NPK Fertilizer Premium', quantity: 2, price: 850 },
                                { name: 'Organic Compost', quantity: 1, price: 400 }
                              ]
                            },
                            {
                              id: 'ORD002',
                              date: 'Jan 20, 2024',
                              total: '₹680',
                              status: 'Shipped',
                              color: 'primary',
                              trackingText: 'Expected delivery: Jan 23, 2024',
                              items: [
                                { name: 'Wheat Seeds Premium', quantity: 1, price: 320 },
                                { name: 'Plant Growth Booster', quantity: 1, price: 280 }
                              ]
                            },
                            {
                              id: 'ORD003',
                              date: 'Jan 22, 2024',
                              total: '₹450',
                              status: 'Processing',
                              color: 'warning',
                              trackingText: 'Packing in progress',
                              items: [
                                { name: 'Garden Tools Set', quantity: 1, price: 450 }
                              ]
                            }
                          ]
                            .filter(order => filterStatus === 'All Orders' || order.status === filterStatus)
                            .map((order) => (
                              <OrderCard key={order.id} order={order} />
                            ))}

                          <Button fullWidth variant="outlined" onClick={() => navigate('/my-orders')} sx={{ mt: 2 }}>
                            View All Orders
                          </Button>
                        </motion.div>
                      </LayoutGroup>
                    </motion.div>
                  )}

                  {/* Favorites Tab */}
                  {activeTab === 1 && (
                    <motion.div
                      key="favorites"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Box
                          sx={{
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            bgcolor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 3
                          }}
                        >
                          <FavoriteIcon sx={{ fontSize: 60, color: 'grey.300' }} />
                        </Box>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No favorites yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 300, mx: 'auto' }}>
                          Save items you want to buy later by clicking the heart icon on any product.
                        </Typography>
                        <Button variant="contained" onClick={() => navigate('/products')}>
                          Start Shopping
                        </Button>
                      </Box>
                    </motion.div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 2 && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <List>
                        <ListItem button sx={{ bgcolor: 'white', mb: 1, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                          <ListItemIcon><LocationIcon color="primary" /></ListItemIcon>
                          <ListItemText primary="Addresses" secondary="Manage delivery locations" />
                          <ArrowForwardIcon color="action" fontSize="small" />
                        </ListItem>
                        <ListItem button sx={{ bgcolor: 'white', mb: 1, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                          <ListItemIcon><PaymentIcon color="primary" /></ListItemIcon>
                          <ListItemText primary="Payment Methods" secondary="Cards & UPI" />
                          <ArrowForwardIcon color="action" fontSize="small" />
                        </ListItem>
                        <ListItem button sx={{ bgcolor: 'white', mb: 1, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                          <ListItemIcon><NotificationsIcon color="primary" /></ListItemIcon>
                          <ListItemText primary="Notifications" secondary="Manage alerts" />
                          <Switch defaultChecked />
                        </ListItem>
                        <ListItem button sx={{ bgcolor: 'white', mb: 1, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                          <ListItemIcon><LanguageIcon color="primary" /></ListItemIcon>
                          <ListItemText primary="Language" secondary="English (US)" />
                          <ArrowForwardIcon color="action" fontSize="small" />
                        </ListItem>
                        <ListItem button sx={{ bgcolor: 'white', mb: 3, borderRadius: 2, border: '1px solid #f0f0f0' }}>
                          <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
                          <ListItemText primary="Security" secondary="Password & 2FA" />
                          <ArrowForwardIcon color="action" fontSize="small" />
                        </ListItem>

                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          startIcon={<LogoutIcon />}
                          onClick={handleLogout}
                        >
                          Log Out
                        </Button>
                      </List>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">Edit Profile</Typography>
          <IconButton onClick={() => setEditDialogOpen(false)} size="small">
            {/* Close Icon could go here */}
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageChange}
              />
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    size="small"
                    disabled={uploading}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      border: '2px solid white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '&:disabled': { bgcolor: 'grey.400' }
                    }}
                    onClick={handleImageClick}
                  >
                    {uploading ? <CircularProgress size={20} color="inherit" /> : <CameraIcon fontSize="small" />}
                  </IconButton>
                }
              >
                <Avatar
                  src={user?.avatar || user?.photoURL}
                  sx={{ width: 100, height: 100, fontSize: '2.5rem' }}
                >
                  {formData.name?.charAt(0) || 'U'}
                </Avatar>
              </Badge>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                disabled
                variant="filled"
                helperText="Email cannot be changed"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                disabled
                variant="filled"
                helperText="Verified phone number"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                To update your email or phone number, please contact customer support or visit verification settings.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveChanges}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;