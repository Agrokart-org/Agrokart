
import React from 'react';
import { Container, Typography, Box, List, ListItem, ListItemText, Divider, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const NotificationsPage = () => {
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
                    Notifications
                </Typography>
                <List>
                    <ListItem>
                        <ListItemText primary="Welcome to Agrokart!" secondary="Get started by exploring our products." />
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <ListItemText primary="Order Status Update" secondary="Your order #ORD-2024-889 is on the way." />
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <ListItemText primary="New Seasonal Offers" secondary="Check out our latest discounts on fertilizers." />
                    </ListItem>
                </List>
            </Box>
        </Container>
    );
};

export default NotificationsPage;
