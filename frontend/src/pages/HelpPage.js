
import React from 'react';
import { Container, Typography, Box, Accordion, AccordionSummary, AccordionDetails, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const HelpPage = () => {
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
                    Help & Support
                </Typography>
                <Typography variant="body1" paragraph>
                    Frequently Asked Questions
                </Typography>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I track my order?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            Go to "My Orders" and click on "Track Order" for real-time updates.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>What payment methods are accepted?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            We accept Cash on Delivery, UPI, Credit/Debit cards, and Net Banking.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How to contact customer support?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            You can email us at support@agrokart.com or call our toll-free number.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Container>
    );
};

export default HelpPage;
