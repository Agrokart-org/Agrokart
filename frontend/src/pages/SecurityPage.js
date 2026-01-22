import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    TextField,
    Button,
    Paper,
    IconButton,
    InputAdornment,
    Alert,
    CircularProgress,
    alpha,
    useTheme
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Visibility,
    VisibilityOff,
    Lock as LockIcon,
    Security as SecurityIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const SecurityPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { changePassword } = useAuth();
    const { t } = useTranslation();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError(t('settingsPage.passwordsDoNotMatch', 'New passwords do not match'));
            return;
        }

        if (newPassword.length < 6) {
            setError(t('settingsPage.passwordTooShort', 'Password should be at least 6 characters'));
            return;
        }

        setLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            setSuccess(t('settingsPage.passwordChangedSuccess', 'Password changed successfully!'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/wrong-password') {
                setError(t('settingsPage.incorrectPassword', 'Incorrect current password'));
            } else if (err.code === 'auth/requires-recent-login') {
                setError(t('settingsPage.reauthRequired', 'Please log in again before changing password'));
            } else {
                setError(t('settingsPage.passwordChangeError', 'Failed to change password. Please try again.'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ py: 3, pt: 12, minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <IconButton
                    edge="start"
                    onClick={() => navigate(-1)}
                    sx={{ mr: 2, bgcolor: 'background.paper', boxShadow: 1 }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="800">
                    {t('settingsPage.security', 'Security')}
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
                        background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, #1E1E1E 0%, #252525 100%)'
                            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                width: 64, height: 64, borderRadius: '50%',
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.main,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mb: 2
                            }}
                        >
                            <SecurityIcon fontSize="large" />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {t('settingsPage.changePassword', 'Change Password')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center">
                            {t('settingsPage.passwordRequirement', 'Choose a strong password to keep your account secure')}
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label={t('settingsPage.currentPassword', 'Current Password')}
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            margin="normal"
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            edge="end"
                                        >
                                            {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label={t('settingsPage.newPassword', 'New Password')}
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            margin="normal"
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            edge="end"
                                        >
                                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label={t('settingsPage.confirmNewPassword', 'Confirm New Password')}
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            margin="normal"
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 4 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                borderRadius: 3,
                                fontWeight: 'bold',
                                background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)',
                                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : t('settingsPage.updatePassword', 'Update Password')}
                        </Button>
                    </form>
                </Paper>
            </motion.div>
        </Container>
    );
};

export default SecurityPage;
