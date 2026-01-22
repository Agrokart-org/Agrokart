import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Paper,
    Box,
    Typography,
    Chip,
    Divider,
    Button
} from '@mui/material';
import { motion } from 'framer-motion';

const OrderCard = ({ order }) => {
    const navigate = useNavigate();

    // --- Data Normalization Adapter ---
    // Handle both ProfilePage (mock) and MyOrdersPage (API) data structures
    const isApiData = !!order._id; // API data usually has _id

    const orderId = isApiData
        ? (order.trackingNumber || order._id?.slice(-6).toUpperCase())
        : order.id;

    // Status Handling
    const rawStatus = isApiData ? (order.orderStatus || 'pending') : order.status;
    const statusLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

    const getStatusColor = (s) => {
        const status = s.toLowerCase();
        if (status === 'delivered') return 'success';
        if (status === 'shipped' || status === 'out_for_delivery') return 'primary';
        if (status === 'processing' || status === 'confirmed') return 'info';
        if (status === 'cancelled') return 'error';
        return 'warning'; // pending
    };

    const colorType = getStatusColor(rawStatus);

    // Date Handling
    const dateStr = isApiData
        ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
        : order.date;

    // Items Handling
    const items = order.items || [];
    const displayItems = items.map(item => ({
        name: isApiData ? (item.product?.name || item.name || 'Product') : item.name,
        quantity: item.quantity,
        price: item.price
    }));

    // Total Handling
    const totalAmount = isApiData ? `₹${order.totalAmount}` : order.total;

    // Tracking Text (Custom logic for API data if needed, or stick to generic)
    const getTrackingText = () => {
        if (!isApiData && order.trackingText) return order.trackingText;

        // Auto-generate for API data
        if (rawStatus === 'delivered') return `Delivered on ${dateStr}`; // In real app, use deliveryDate
        if (rawStatus === 'shipped') return 'On the way';
        if (rawStatus === 'processing') return 'Being prepared';
        return 'Order placed';
    };

    const trackingText = getTrackingText();

    const handleViewDetails = () => {
        // Create a URL that works for both. 
        // If it's mock data (id starts with ORD), maybe just stay or show alert if no real page.
        // But user wants "Production like", so let's assume valid ID navigation.
        const targetId = isApiData ? order._id : order.id;
        navigate(`/order-details/${targetId}`);
    };

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
                borderRadius: 1,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                background: 'background.paper'
            }}
        >
            <Box sx={{ p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Order #{orderId}
                    </Typography>
                    <Chip
                        label={statusLabel}
                        size="small"
                        color={colorType}
                        sx={{
                            fontWeight: 'bold',
                            borderRadius: 1
                        }}
                    />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Placed on {dateStr}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Items */}
                <Box sx={{ mb: 2 }}>
                    {displayItems.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" color="text.primary">
                                {item.name} &times; {item.quantity}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">₹{item.price}</Typography>
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Total */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">Total Amount</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">{totalAmount}</Typography>
                </Box>

                {/* Tracking Info Text */}
                {trackingText && (
                    <Typography variant="caption" sx={{ color: colorType === 'success' ? 'success.main' : 'primary.main', display: 'flex', alignItems: 'center', mb: 2 }}>
                        {colorType === 'success' ? '✓ ' : '🚚 '}{trackingText}
                    </Typography>
                )}

                {/* Buttons */}
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="success"
                        onClick={handleViewDetails}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                    >
                        View Details
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        // Reorder not fully implemented, can just nav to details or cart
                        onClick={() => navigate('/products')}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', bgcolor: '#4caf50', '&:hover': { bgcolor: '#43a047' } }}
                    >
                        {rawStatus === 'delivered' ? 'Reorder' : 'Track Order'}
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default OrderCard;
