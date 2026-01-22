import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    useTheme,
    alpha
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Security as SecurityIcon,
    DataUsage as DataUsageIcon,
    Visibility as VisibilityIcon,
    Cookie as CookieIcon,
    Gavel as GavelIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const PrivacyPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();

    const sections = [
        {
            icon: <DataUsageIcon color="primary" />,
            title: t('settingsPage.dataCollection', 'Data Collection'),
            text: t('settingsPage.dataCollectionText', 'We collect information you provide directly to us, such as when you create an account, update your profile, or make a purchase.')
        },
        {
            icon: <VisibilityIcon color="secondary" />,
            title: t('settingsPage.dataUsage', 'Data Usage'),
            text: t('settingsPage.dataUsageText', 'We use the information we collect to provide, maintain, and improve our services, including processing transactions and sending related information.')
        },
        {
            icon: <SecurityIcon color="warning" />,
            title: t('settingsPage.dataSecurity', 'Data Security'),
            text: t('settingsPage.dataSecurityText', 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing.')
        },
        {
            icon: <CookieIcon color="info" />,
            title: t('settingsPage.cookies', 'Cookies & Tracking'),
            text: t('settingsPage.cookiesText', 'We use cookies and similar tracking technologies to track the activity on our service and hold certain information.')
        },
        {
            icon: <GavelIcon color="error" />,
            title: t('settingsPage.userRights', 'Your Rights'),
            text: t('settingsPage.userRightsText', 'You have the right to access, update, or delete your personal information at any time through your account settings.')
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
                    {t('settingsPage.privacyPolicy', 'Privacy Policy')}
                </Typography>
            </Box>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        mb: 4,
                        background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, #1E1E1E 0%, #252525 100%)'
                            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                    }}
                >
                    <Typography variant="body1" color="text.secondary" paragraph>
                        {t('settingsPage.privacyIntro', 'At Agrokart, we take your privacy seriously. This policy describes how we collect, use, and handle your data.')}
                    </Typography>

                    <List>
                        {sections.map((section, index) => (
                            <ListItem
                                key={index}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    p: 3,
                                    mb: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.background.default, 0.5)
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        {section.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography variant="h6" fontWeight="bold">
                                                {section.title}
                                            </Typography>
                                        }
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ pl: 5 }}>
                                    {section.text}
                                </Typography>
                            </ListItem>
                        ))}
                    </List>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 4, textAlign: 'center' }}>
                        Last updated: January 2026
                    </Typography>
                </Paper>
            </motion.div>
        </Container>
    );
};

export default PrivacyPage;
