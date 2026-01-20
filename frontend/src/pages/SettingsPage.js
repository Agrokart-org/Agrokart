
import React from 'react';
import { Container, Typography, Box, Switch, FormControlLabel, Button, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const SettingsPage = () => {
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
                    Settings
                </Typography>

                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6">General</Typography>
                    <FormControlLabel control={<Switch defaultChecked />} label="Enable Push Notifications" />
                    <Box mt={1} />
                    <FormControlLabel control={<Switch defaultChecked />} label="Email Updates" />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box>
                    <Typography variant="h6">Language</Typography>
                    <Button variant="outlined" sx={{ mt: 1 }}>Change Language</Button>
                </Box>
            </Box>
        </Container>
    );
};

export default SettingsPage;
