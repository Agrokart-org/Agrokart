import React, { useState } from 'react';
import {
    Box,
    Container,
    Grid,
    Typography,
    Card,
    CardContent,
    Button,
    Avatar,
    Chip,
    Rating,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    alpha,
    IconButton,
    Divider
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Star as StarIcon,
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Work as WorkIcon,
    CalendarToday as CalendarIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Mock data for labourers
const labourers = [
    {
        id: 1,
        name: 'Rajesh Kumar',
        avatar: 'https://i.pravatar.cc/150?img=12',
        rating: 4.8,
        reviews: 45,
        skills: ['Harvesting', 'Planting', 'Irrigation'],
        experience: '5 years',
        hourlyRate: '₹150/hr',
        location: 'Pune, Maharashtra',
        availability: 'Available',
        availabilityColor: '#10B981',
        phone: '+91 98765 43210',
        completedJobs: 120
    },
    {
        id: 2,
        name: 'Suresh Patil',
        avatar: 'https://i.pravatar.cc/150?img=33',
        rating: 4.6,
        reviews: 32,
        skills: ['Pesticide Spraying', 'Weeding'],
        experience: '3 years',
        hourlyRate: '₹120/hr',
        location: 'Nashik, Maharashtra',
        availability: 'Available',
        availabilityColor: '#10B981',
        phone: '+91 98765 43211',
        completedJobs: 85
    },
    {
        id: 3,
        name: 'Amit Deshmukh',
        avatar: 'https://i.pravatar.cc/150?img=51',
        rating: 4.9,
        reviews: 67,
        skills: ['Tractor Operation', 'Land Preparation'],
        experience: '8 years',
        hourlyRate: '₹200/hr',
        location: 'Solapur, Maharashtra',
        availability: 'Busy',
        availabilityColor: '#F59E0B',
        phone: '+91 98765 43212',
        completedJobs: 200
    },
    {
        id: 4,
        name: 'Prakash Jadhav',
        avatar: 'https://i.pravatar.cc/150?img=68',
        rating: 4.7,
        reviews: 28,
        skills: ['Fertilizer Application', 'Soil Testing'],
        experience: '4 years',
        hourlyRate: '₹130/hr',
        location: 'Satara, Maharashtra',
        availability: 'Available',
        availabilityColor: '#10B981',
        phone: '+91 98765 43213',
        completedJobs: 95
    }
];

// Mock bookings data
const myBookings = [
    {
        id: 'BK-001',
        labourerName: 'Rajesh Kumar',
        service: 'Harvesting',
        date: '2025-12-25',
        duration: '8 hours',
        status: 'Confirmed',
        statusColor: '#10B981',
        totalCost: '₹1,200'
    },
    {
        id: 'BK-002',
        labourerName: 'Amit Deshmukh',
        service: 'Land Preparation',
        date: '2025-12-28',
        duration: '6 hours',
        status: 'Pending',
        statusColor: '#F59E0B',
        totalCost: '₹1,200'
    },
    {
        id: 'BK-003',
        labourerName: 'Suresh Patil',
        service: 'Pesticide Spraying',
        date: '2025-12-20',
        duration: '4 hours',
        status: 'Completed',
        statusColor: '#6366F1',
        totalCost: '₹480'
    }
];

const LabourManagement = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSkill, setSelectedSkill] = useState('All');
    const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
    const [selectedLabourer, setSelectedLabourer] = useState(null);

    // Registration Form State
    const [registrationData, setRegistrationData] = useState({
        name: '',
        location: '',
        phone: '',
        skills: [],
        experience: '',
        hourlyRate: ''
    });
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    // Initial Labourers List (State to allow adding new ones)
    const [labourList, setLabourList] = useState(labourers);

    const handleBooking = (labourer) => {
        setSelectedLabourer(labourer);
        setBookingDialogOpen(true);
    };

    const handleConfirmBooking = () => {
        // Add booking logic here
        setBookingDialogOpen(false);
        setSelectedLabourer(null);
    };

    const handleRegister = () => {
        // Validate
        if (!registrationData.name || !registrationData.location || !registrationData.phone) {
            alert("Please fill in basic details including Location");
            return;
        }

        const newLabourer = {
            id: labourList.length + 1,
            name: registrationData.name,
            avatar: `https://i.pravatar.cc/150?u=${labourList.length + 1}`, // Random avatar
            rating: 5.0, // New joiner starts high
            reviews: 0,
            skills: registrationData.skills.length > 0 ? registrationData.skills : ['General Labor'],
            experience: registrationData.experience + ' years',
            hourlyRate: `₹${registrationData.hourlyRate}/hr`,
            location: registrationData.location,
            availability: 'Available',
            availabilityColor: '#10B981',
            phone: registrationData.phone,
            completedJobs: 0
        };

        setLabourList([newLabourer, ...labourList]); // Add to top
        setShowSuccessDialog(true);
        // Reset form
        setRegistrationData({
            name: '',
            location: '',
            phone: '',
            skills: [],
            experience: '',
            hourlyRate: ''
        });
        // Switch to Find Labour tab to see the new entry
        setTimeout(() => {
            setShowSuccessDialog(false);
            setActiveTab(0);
        }, 2000);
    };

    const handleSkillChange = (event) => {
        const {
            target: { value },
        } = event;
        setRegistrationData({
            ...registrationData,
            skills: typeof value === 'string' ? value.split(',') : value,
        });
    };

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
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
            <Container maxWidth="xl" sx={{ py: 4, mt: 12 }}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
                            Labour Management 👷
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Find skilled workers or Register yourself as one
                        </Typography>
                    </Box>
                </motion.div>

                {/* Tabs */}
                <Card sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem'
                            }
                        }}
                    >
                        <Tab label="Find Labour" />
                        <Tab label="My Bookings" />
                        <Tab label="Post Job" />
                        <Tab label="Register as Worker" icon={<PersonIcon />} iconPosition="start" />
                    </Tabs>
                </Card>

                {/* Tab Content */}
                {activeTab === 0 && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Search & Filter */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            placeholder="Search by name, skills, location..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon />
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <FormControl fullWidth>
                                            <InputLabel>Filter by Skill</InputLabel>
                                            <Select
                                                value={selectedSkill}
                                                label="Filter by Skill"
                                                onChange={(e) => setSelectedSkill(e.target.value)}
                                            >
                                                <MenuItem value="All">All Skills</MenuItem>
                                                <MenuItem value="Harvesting">Harvesting</MenuItem>
                                                <MenuItem value="Planting">Planting</MenuItem>
                                                <MenuItem value="Irrigation">Irrigation</MenuItem>
                                                <MenuItem value="Pesticide Spraying">Pesticide Spraying</MenuItem>
                                                <MenuItem value="Tractor Operation">Tractor Operation</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<FilterIcon />}
                                            sx={{ height: '56px', textTransform: 'none' }}
                                        >
                                            More Filters
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Labourers Grid */}
                        <Grid container spacing={3}>
                            {labourList.map((labourer, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={labourer.id}>
                                    <motion.div variants={itemVariants}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                '&:hover': {
                                                    transform: 'translateY(-8px)',
                                                    boxShadow: 4
                                                }
                                            }}
                                        >
                                            <CardContent sx={{ p: 3 }}>
                                                {/* Avatar & Status */}
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                                    <Avatar
                                                        src={labourer.avatar}
                                                        sx={{ width: 64, height: 64, mr: 2 }}
                                                    />
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5 }}>
                                                            {labourer.name}
                                                        </Typography>
                                                        <Chip
                                                            label={labourer.availability}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha(labourer.availabilityColor, 0.1),
                                                                color: labourer.availabilityColor,
                                                                fontWeight: 600,
                                                                fontSize: '0.75rem'
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>

                                                {/* Rating */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Rating value={labourer.rating} precision={0.1} size="small" readOnly />
                                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                                        {labourer.rating} ({labourer.reviews})
                                                    </Typography>
                                                </Box>

                                                {/* Skills */}
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                                        Skills
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {labourer.skills.map((skill, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={skill}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha('#6366F1', 0.1),
                                                                    color: '#6366F1',
                                                                    fontSize: '0.7rem'
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>

                                                <Divider sx={{ my: 2 }} />

                                                {/* Details */}
                                                <Box sx={{ mb: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <WorkIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {labourer.experience} experience
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <LocationIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {labourer.location}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981', mr: 1 }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {labourer.completedJobs} jobs completed
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Rate & Book Button */}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="h6" fontWeight="700" color="primary">
                                                        {labourer.hourlyRate}
                                                    </Typography>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        onClick={() => handleBooking(labourer)}
                                                        disabled={labourer.availability === 'Busy'}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            borderRadius: 2
                                                        }}
                                                    >
                                                        Book Now
                                                    </Button>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </motion.div>
                )}

                {/* My Bookings Tab */}
                {activeTab === 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight="700" sx={{ mb: 3 }}>
                                    Your Bookings
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {myBookings.map((booking) => (
                                        <Card
                                            key={booking.id}
                                            variant="outlined"
                                            sx={{
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    borderColor: booking.statusColor,
                                                    boxShadow: `0 4px 12px ${alpha(booking.statusColor, 0.15)}`
                                                }
                                            }}
                                        >
                                            <CardContent>
                                                <Grid container spacing={2} alignItems="center">
                                                    <Grid item xs={12} md={3}>
                                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                            Booking ID
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight="600">
                                                            {booking.id}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} md={3}>
                                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                            Labourer
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight="600">
                                                            {booking.labourerName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {booking.service}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} md={2}>
                                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                            Date
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {booking.date}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {booking.duration}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} md={2}>
                                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                            Total Cost
                                                        </Typography>
                                                        <Typography variant="h6" fontWeight="700" color="primary">
                                                            {booking.totalCost}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} md={2}>
                                                        <Chip
                                                            label={booking.status}
                                                            sx={{
                                                                bgcolor: alpha(booking.statusColor, 0.1),
                                                                color: booking.statusColor,
                                                                fontWeight: 600,
                                                                width: '100%'
                                                            }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Post Job Tab */}
                {activeTab === 2 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" fontWeight="700" sx={{ mb: 3 }}>
                                    Post a Job Requirement
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Job Title"
                                            placeholder="e.g., Need harvesting help"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Job Category</InputLabel>
                                            <Select label="Job Category" defaultValue="">
                                                <MenuItem value="harvesting">Harvesting</MenuItem>
                                                <MenuItem value="planting">Planting</MenuItem>
                                                <MenuItem value="irrigation">Irrigation</MenuItem>
                                                <MenuItem value="spraying">Pesticide Spraying</MenuItem>
                                                <MenuItem value="other">Other</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            label="Job Description"
                                            placeholder="Describe the work requirements..."
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="Start Date"
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            fullWidth
                                            label="Duration"
                                            placeholder="e.g., 2 days, 8 hours"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            fullWidth
                                            label="Budget"
                                            placeholder="₹ per hour/day"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Location"
                                            placeholder="Farm location"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<AddIcon />}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                px: 4
                                            }}
                                        >
                                            Post Job
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* REGISTER AS WORKER TAB (New) */}
                {activeTab === 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card sx={{ maxWidth: 800, mx: 'auto' }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{
                                        width: 50, height: 50,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.light',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        mr: 2, color: 'primary.main'
                                    }}>
                                        <PersonIcon fontSize="large" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight="700">
                                            Register as Agricultural Worker
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Create your profile to get hired by farmers near you.
                                        </Typography>
                                    </Box>
                                </Box>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Full Name"
                                            value={registrationData.name}
                                            onChange={(e) => setRegistrationData({ ...registrationData, name: e.target.value })}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Mobile Number"
                                            value={registrationData.phone}
                                            onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                                            }}
                                            required
                                        />
                                    </Grid>

                                    {/* Location Field - Prominent */}
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Your Current Location / Address"
                                            value={registrationData.location}
                                            onChange={(e) => setRegistrationData({ ...registrationData, location: e.target.value })}
                                            placeholder="Village, Taluka, District"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LocationIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            helperText="Farmers in this area will see your profile"
                                            required
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <FormControl fullWidth>
                                            <InputLabel>Skills (Select Multiple)</InputLabel>
                                            <Select
                                                multiple
                                                value={registrationData.skills}
                                                onChange={handleSkillChange}
                                                label="Skills (Select Multiple)"
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {selected.map((value) => (
                                                            <Chip key={value} label={value} size="small" />
                                                        ))}
                                                    </Box>
                                                )}
                                            >
                                                {['Harvesting', 'Planting', 'Irrigation', 'Pesticide Spraying', 'Tractor Operation', 'Weeding', 'Soil Testing'].map((skill) => (
                                                    <MenuItem key={skill} value={skill}>
                                                        {skill}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Experience (Years)"
                                            type="number"
                                            value={registrationData.experience}
                                            onChange={(e) => setRegistrationData({ ...registrationData, experience: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Hourly Rate (₹)"
                                            type="number"
                                            value={registrationData.hourlyRate}
                                            onChange={(e) => setRegistrationData({ ...registrationData, hourlyRate: e.target.value })}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            onClick={handleRegister}
                                            sx={{
                                                bgcolor: '#4CAF50',
                                                '&:hover': { bgcolor: '#45a049' },
                                                py: 1.5,
                                                fontSize: '1.1rem'
                                            }}
                                        >
                                            Register Profile
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </Container>

            {/* Booking Dialog */}
            <Dialog
                open={bookingDialogOpen}
                onClose={() => setBookingDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="700">
                            Book {selectedLabourer?.name}
                        </Typography>
                        <IconButton onClick={() => setBookingDialogOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Select Date"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="time"
                                label="Start Time"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Duration (hours)"
                                type="number"
                                defaultValue={8}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Service Type</InputLabel>
                                <Select label="Service Type" defaultValue="">
                                    {selectedLabourer?.skills.map((skill, idx) => (
                                        <MenuItem key={idx} value={skill}>
                                            {skill}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Additional Notes"
                                placeholder="Any specific requirements..."
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Card sx={{ bgcolor: alpha('#6366F1', 0.05), p: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Estimated Cost
                                </Typography>
                                <Typography variant="h5" fontWeight="700" color="primary">
                                    {selectedLabourer?.hourlyRate} × 8 hours = ₹1,200
                                </Typography>
                            </Card>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setBookingDialogOpen(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmBooking}
                        sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
                    >
                        Confirm Booking
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onClose={() => setShowSuccessDialog(false)}>
                <DialogContent sx={{ textAlign: 'center', p: 4 }}>
                    <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: 'success.light', color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                        <CheckCircleIcon fontSize="large" />
                    </Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Registration Successful!
                    </Typography>
                    <Typography color="text.secondary">
                        Your profile is now visible to farmers in {registrationData.location}.
                    </Typography>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default LabourManagement;
