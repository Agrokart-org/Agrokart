import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    Grid,
    useTheme,
    alpha
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    ExpandMore as ExpandMoreIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Chat as ChatIcon,
    HelpOutline as HelpIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const SupportPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();

    const faqs = [
        {
            question: t('settingsPage.faq1q', 'How do I track my order?'),
            answer: t('settingsPage.faq1a', 'You can track your order by going to the "My Orders" section in your profile. Click on any active order to see real-time tracking updates.')
        },
        {
            question: t('settingsPage.faq2q', 'What payment methods are accepted?'),
            answer: t('settingsPage.faq2a', 'We accept various payment methods including Credit/Debit cards, UPI, Net Banking, and Cash on Delivery (selected areas only).')
        },
        {
            question: t('settingsPage.faq3q', 'How can I return an item?'),
            answer: t('settingsPage.faq3a', 'If you are not satisfied with a product, you can request a return within 7 days of delivery. Go to "My Orders", select the item, and click "Return".')
        },
        {
            question: t('settingsPage.faq4q', 'Is there a delivery fee?'),
            answer: t('settingsPage.faq4a', 'Delivery is free for orders above ₹500. For orders below this amount, a nominal delivery fee applies based on your location.')
        }
    ];

    const contactMethods = [
        {
            icon: <PhoneIcon fontSize="large" color="primary" />,
            title: t('settingsPage.callUs', 'Call Us'),
            detail: '+91 1800-123-4567',
            action: t('settingsPage.callNow', 'Call Now'),
            onClick: () => window.location.href = 'tel:+9118001234567'
        },
        {
            icon: <EmailIcon fontSize="large" color="secondary" />,
            title: t('settingsPage.emailUs', 'Email Us'),
            detail: 'support@agrokart.com',
            action: t('settingsPage.sendEmail', 'Send Email'),
            onClick: () => window.location.href = 'mailto:support@agrokart.com'
        },
        {
            icon: <ChatIcon fontSize="large" color="success" />,
            title: t('settingsPage.chatSupport', 'Chat Support'),
            detail: t('settingsPage.available247', 'Available 24/7'),
            action: t('settingsPage.startChat', 'Start Chat'),
            onClick: () => { } // Integrate chatbot trigger if available
        }
    ];

    return (
        <Container maxWidth="md" sx={{ py: 3, pt: 12, minHeight: '100vh', pb: 10 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <IconButton
                    edge="start"
                    onClick={() => navigate(-1)}
                    sx={{ mr: 2, bgcolor: 'background.paper', boxShadow: 1 }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="800">
                    {t('settingsPage.helpSupport', 'Help & Support')}
                </Typography>
            </Box>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Contact Options */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {contactMethods.map((method, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    border: `1px solid ${theme.palette.divider}`,
                                    textAlign: 'center',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)' }
                                }}
                            >
                                <Box sx={{ mb: 2, p: 2, borderRadius: '50%', bgcolor: alpha(theme.palette.background.default, 0.8) }}>
                                    {method.icon}
                                </Box>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    {method.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {method.detail}
                                </Typography>
                                <Button variant="outlined" size="small" onClick={method.onClick} sx={{ borderRadius: 20 }}>
                                    {method.action}
                                </Button>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* FAQ Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, #1E1E1E 0%, #252525 100%)'
                            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <HelpIcon color="primary" sx={{ mr: 1.5 }} />
                        <Typography variant="h5" fontWeight="bold">
                            {t('settingsPage.frequentlyAskedQuestions', 'Frequently Asked Questions')}
                        </Typography>
                    </Box>

                    {faqs.map((faq, index) => (
                        <Accordion
                            key={index}
                            elevation={0}
                            sx={{
                                '&:before': { display: 'none' },
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                bgcolor: 'transparent'
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{ px: 0 }}
                            >
                                <Typography fontWeight={600}>{faq.question}</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 0, color: 'text.secondary' }}>
                                {faq.answer}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Paper>
            </motion.div>
        </Container>
    );
};

export default SupportPage;
