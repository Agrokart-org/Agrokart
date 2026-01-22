import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Switch,
    Divider,
    Paper,
    IconButton,
    Button,
    Avatar,
    useTheme,
    useMediaQuery,
    alpha,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Radio,
    RadioGroup,
    FormControlLabel
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Notifications as NotificationsIcon,
    Security as SecurityIcon,
    Language as LanguageIcon,
    Help as HelpIcon,
    Info as InfoIcon,
    ChevronRight as ChevronRightIcon,
    Person as PersonIcon,
    ExitToApp as LogoutIcon,
    Palette as PaletteIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const SettingsPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { mode, toggleTheme } = useThemeContext();
    const { t, i18n } = useTranslation();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user, logout } = useAuth();

    // State
    const [notifications, setNotifications] = useState(true);
    const [languageDialogOpen, setLanguageDialogOpen] = useState(false);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        setLanguageDialogOpen(false);
    };

    const languages = [
        { code: 'en', label: 'English (US)' },
        { code: 'hi', label: 'हिन्दी (Hindi)' },
        { code: 'mr', label: 'मराठी (Marathi)' }
    ];

    const currentLanguageLabel = languages.find(l => l.code === i18n.language)?.label || 'English (US)';

    const SectionHeader = ({ title }) => (
        <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{
                px: 2, py: 1.5, fontWeight: 'bold', textTransform: 'uppercase',
                fontSize: '0.75rem', letterSpacing: '0.05em'
            }}
        >
            {title}
        </Typography>
    );

    const SettingsItem = ({ icon, title, subtitle, action, onClick, color = theme.palette.primary.main, danger = false }) => (
        <ListItem
            button={!!onClick}
            onClick={onClick}
            sx={{
                py: 1.5, px: 2,
                '&:hover': onClick ? { bgcolor: alpha(theme.palette.primary.main, 0.04) } : {},
            }}
            component={motion.div}
            variants={itemVariants}
        >
            <ListItemIcon sx={{ minWidth: 44 }}>
                <Box
                    sx={{
                        width: 36, height: 36, borderRadius: '50%',
                        bgcolor: danger ? alpha(theme.palette.error.main, 0.1) : alpha(color, 0.1),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: danger ? 'error.main' : color
                    }}
                >
                    {icon}
                </Box>
            </ListItemIcon>
            <ListItemText
                primary={
                    <Typography variant="body1" fontWeight={500} color={danger ? 'error.main' : 'text.primary'}>
                        {title}
                    </Typography>
                }
                secondary={
                    subtitle && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {subtitle}
                        </Typography>
                    )
                }
            />
            {action || (onClick && <ChevronRightIcon color="action" fontSize="small" />)}
        </ListItem>
    );

    return (
        <Container maxWidth="md" sx={{ py: { xs: 2, md: 3 }, pt: { xs: 10, md: 12 }, px: { xs: 2, md: 3 }, minHeight: '100vh', pb: { xs: 12, md: 10 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <IconButton
                    edge="start"
                    onClick={() => navigate(-1)}
                    sx={{ mr: 2, bgcolor: 'background.paper', boxShadow: 1 }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="800">
                    {t('settingsPage.title', 'Settings')}
                </Typography>
            </Box>

            <motion.div variants={containerVariants} initial="hidden" animate="visible">
                {/* User Card */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3, mb: 3, borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        display: 'flex', alignItems: 'center',
                        background: mode === 'dark' ? 'linear-gradient(135deg, #1E1E1E 0%, #252525 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                    }}
                    component={motion.div}
                    variants={itemVariants}
                >
                    <Avatar
                        src={user?.avatar || user?.photoURL}
                        sx={{ width: 64, height: 64, mr: 2.5, boxShadow: 2 }}
                    >
                        {user?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                            {user?.name || 'Guest User'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {user?.email || 'Sign in to sync your data'}
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/profile')}
                        sx={{ borderRadius: 20 }}
                    >
                        {t('settingsPage.edit', 'Edit')}
                    </Button>
                </Paper>

                {/* Preferences */}
                <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
                    <SectionHeader title={t('settingsPage.preferences', 'Preferences')} />
                    <List disablePadding>
                        <SettingsItem
                            icon={<NotificationsIcon fontSize="small" />}
                            title={t('settingsPage.pushNotifications', 'Push Notifications')}
                            subtitle={t('settingsPage.receiveUpdates', 'Receive order updates and offers')}
                            action={
                                <Switch
                                    checked={notifications}
                                    onChange={(e) => setNotifications(e.target.checked)}
                                    color="primary"
                                />
                            }
                        />
                        <Divider variant="inset" component="li" />
                        <SettingsItem
                            icon={<PaletteIcon fontSize="small" />}
                            title={t('settingsPage.darkMode', 'Dark Mode')}
                            subtitle={mode === 'dark' ? t('settingsPage.on', 'On') : t('settingsPage.off', 'Off')}
                            action={
                                <Switch
                                    checked={mode === 'dark'}
                                    onChange={toggleTheme}
                                    color="secondary"
                                />
                            }
                            color={theme.palette.secondary.main}
                        />
                        <Divider variant="inset" component="li" />
                        <SettingsItem
                            icon={<LanguageIcon fontSize="small" />}
                            title={t('settingsPage.language', 'Language')}
                            subtitle={currentLanguageLabel}
                            onClick={() => setLanguageDialogOpen(true)}
                            color="#4caf50"
                        />
                    </List>
                </Paper>

                {/* Security & Privacy */}
                <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
                    <SectionHeader title={t('settingsPage.securityPrivacy', 'Security & Privacy')} />
                    <List disablePadding>
                        <SettingsItem
                            icon={<SecurityIcon fontSize="small" />}
                            title={t('settingsPage.security', 'Security')}
                            subtitle={t('settingsPage.password2fa', 'Password, 2FA, Login Activity')}
                            onClick={() => navigate('/settings/security')}
                            color="#ff9800"
                        />
                        <Divider variant="inset" component="li" />
                        <SettingsItem
                            icon={<PersonIcon fontSize="small" />}
                            title={t('settingsPage.privacy', 'Privacy')}
                            subtitle={t('settingsPage.manageData', 'Manage your data usage')}
                            onClick={() => navigate('/settings/privacy')}
                            color="#9c27b0"
                        />
                    </List>
                </Paper>

                {/* Support */}
                <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
                    <SectionHeader title={t('settingsPage.support', 'Support')} />
                    <List disablePadding>
                        <SettingsItem
                            icon={<HelpIcon fontSize="small" />}
                            title={t('settingsPage.helpSupport', 'Help & Support')}
                            onClick={() => navigate('/settings/support')}
                            color="#00bcd4"
                        />
                        <Divider variant="inset" component="li" />
                        <SettingsItem
                            icon={<InfoIcon fontSize="small" />}
                            title={t('settingsPage.about', 'About Agrokart')}
                            subtitle="Version 2.4.0"
                            onClick={() => { }}
                            color="#607d8b"
                        />
                    </List>
                </Paper>

                <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{
                        py: 1.5,
                        borderRadius: 3,
                        fontWeight: 'bold',
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2, bgcolor: alpha(theme.palette.error.main, 0.05) }
                    }}
                >
                    {t('settingsPage.logOut', 'Log Out')}
                </Button>

                <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 3 }}>
                    © 2026 Agrokart Technologies. All rights reserved.
                </Typography>
            </motion.div>

            {/* Language Dialog */}
            <Dialog
                open={languageDialogOpen}
                onClose={() => setLanguageDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, width: '100%', maxWidth: 400 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>{t('settingsPage.selectLanguage', 'Select Language')}</DialogTitle>
                <DialogContent>
                    <RadioGroup
                        value={i18n.language}
                        onChange={(e) => changeLanguage(e.target.value)}
                    >
                        {languages.map((lang) => (
                            <FormControlLabel
                                key={lang.code}
                                value={lang.code}
                                control={<Radio />}
                                label={lang.label}
                                sx={{ py: 0.5 }}
                            />
                        ))}
                    </RadioGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLanguageDialogOpen(false)}>{t('settingsPage.cancel', 'Cancel')}</Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default SettingsPage;
