import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, IconButton, Paper, Fab, Zoom } from '@mui/material';
import { ArrowBack as ArrowBackIcon, MyLocation as MyLocationIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import TrackingMap from '../components/map/TrackingMap'; // Ensure path is correct
import { useSocket } from '../context/SocketContext'; // Ensure path is correct

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams(); // Get order ID from URL
  const socket = useSocket();

  // State for tracking data
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [pickupLocation, setPickupLocation] = useState({ lat: 18.5204, lng: 73.8567 }); // Demo defaults
  const [dropoffLocation, setDropoffLocation] = useState({ lat: 18.5300, lng: 73.8600 }); // Demo defaults
  const [partnerDetails, setPartnerDetails] = useState({
    name: 'Rahul Kumar',
    vehicleModel: 'Hero Splendor',
    vehicleNumber: 'MH14 GC 2299',
    photo: 'https://mui.com/static/images/avatar/2.jpg',
    phone: '9876543210'
  });

  useEffect(() => {
    if (!socket) return;

    // Join the room
    const trackingId = orderId || '2024-889'; // Default for demo if not provided
    socket.emit('join_tracking', trackingId);
    console.log(`Joined tracking for order ${trackingId}`);

    // Listen for updates
    const handleLocationUpdate = (data) => {
      console.log('Received location update:', data);

      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);
      const heading = parseFloat(data.heading);

      // Only update if coordinates are valid numbers
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setDeliveryLocation({
          lat,
          lng,
          heading: Number.isFinite(heading) ? heading : 0
        });
      } else {
        console.warn('Received invalid coordinates:', data);
      }
    };

    socket.on('location_updated', handleLocationUpdate);

    return () => {
      socket.off('location_updated', handleLocationUpdate);
      socket.emit('leave_tracking', trackingId);
    };
  }, [socket, orderId]);

  return (
    <Box sx={{ height: '100vh', width: '100vw', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      {/* Header Overlay */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        p: 2,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)'
      }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.2)' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" color="white" sx={{ ml: 2, display: 'inline', fontWeight: 'bold' }}>
          Tracking Order #{orderId || '2024-889'}
        </Typography>
      </Box>

      {/* Map Container */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <TrackingMap
          deliveryLocation={deliveryLocation}
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          partnerDetails={partnerDetails}
        />
      </Box>
    </Box>
  );
};

export default OrderTrackingPage;