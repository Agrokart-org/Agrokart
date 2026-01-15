import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
  Divider,
  useTheme,
  alpha,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as AddressIcon,
  Payment as PaymentIcon,
  Help as HelpIcon,
  Info as AboutIcon,
  ExitToApp as LogoutIcon,
  ChevronRight as ChevronIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);
const MotionListItem = motion(ListItem);

const MobileProfilePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  const menuGroups = [
    {
      title: 'Account',
      items: [
        { icon: <PersonIcon />, title: 'Edit Profile', subtitle: 'Personal info', path: '/edit-profile' },
        { icon: <AddressIcon />, title: 'Addresses', subtitle: 'Manage delivery locations', path: '/addresses' },
        { icon: <PaymentIcon />, title: 'Payment', subtitle: 'Saved cards & UPI', path: '/payment-methods' }
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: <HelpIcon />, title: 'Help & Support', subtitle: 'FAQs & Contact', path: '/help' },
        { icon: <AboutIcon />, title: 'About Agrokart', subtitle: 'Version 1.0.0', path: '/about' }
      ]
    }
  ];

  return (
    <Box sx={{ pb: 4, minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7F5 0%, #E8F5E9 100%)' }}>

      {/* Header with Glassmorphism */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        ...theme.glass(0.8),
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" fontWeight="800" sx={{ background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          My Profile
        </Typography>
      </Box>

      <Box component={motion.div} variants={containerVariants} initial="hidden" animate="visible" sx={{ px: 2, pt: 3 }}>

        {/* Profile Card */}
        <MotionCard
          variants={itemVariants}
          sx={{
            mb: 3,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            boxShadow: '0 8px 32px rgba(46, 125, 50, 0.2)'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={user?.avatar}
                sx={{
                  width: 70,
                  height: 70,
                  border: '3px solid rgba(255,255,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  mr: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="bold">
                  {user?.name || 'Guest User'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 14 }} /> {user?.phone || '+91 --- --- ----'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EmailIcon sx={{ fontSize: 14 }} /> {user?.email || 'guest@agrokart.com'}
                </Typography>
              </Box>
              <IconButton sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }} onClick={() => navigate('/edit-profile')}>
                <EditIcon />
              </IconButton>
            </Box>
          </CardContent>
        </MotionCard>

        {/* Menu Groups */}
        {menuGroups.map((group, groupIndex) => (
          <Box key={groupIndex} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="700" color="text.secondary" sx={{ mb: 1.5, ml: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
              {group.title}
            </Typography>
            <Card sx={{ borderRadius: 4, overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <List sx={{ p: 0 }}>
                {group.items.map((item, index) => (
                  <React.Fragment key={index}>
                    <MotionListItem
                      button
                      component={motion.div}
                      whileTap={{ scale: 0.98, backgroundColor: 'rgba(0,0,0,0.02)' }}
                      onClick={() => navigate(item.path)}
                      sx={{ py: 2 }}
                    >
                      <ListItemIcon sx={{ color: theme.palette.primary.main, minWidth: 44, bgcolor: `${theme.palette.primary.main}15`, p: 1, borderRadius: 2, mr: 1 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body1" fontWeight="600">{item.title}</Typography>}
                        secondary={item.subtitle}
                      />
                      <ChevronIcon color="action" fontSize="small" />
                    </MotionListItem>
                    {index < group.items.length - 1 && <Divider variant="inset" component="li" sx={{ ml: 9 }} />}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          </Box>
        ))}

        {/* Logout Button */}
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              borderColor: '#FFCDD2',
              color: '#D32F2F',
              bgcolor: '#FFEBEE',
              py: 1.8,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              borderWidth: '0px',
              '&:hover': {
                bgcolor: '#FFCDD2',
                borderColor: '#E57373',
                borderWidth: '0px'
              }
            }}
          >
            Log Out
          </Button>
        </motion.div>

        <Typography variant="caption" align="center" display="block" color="text.disabled" sx={{ mt: 4 }}>
          Agrokart v1.0.0 • Made for Farmers 🌾
        </Typography>

      </Box>
    </Box>
  );
};

export default MobileProfilePage;
