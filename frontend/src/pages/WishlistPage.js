
import React from 'react';
import { Container, Typography, Box, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const WishlistPage = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{ mb: 2 }}
            >
                Back
            </Button>
            <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                <Typography variant="h4" gutterBottom>
                    My Wishlist
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Your saved items will appear here. Capture your favorite products to buy later!
                </Typography>
                {/* Placeholder for future wishlist items */}
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">No items in wishlist yet.</Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default WishlistPage;
