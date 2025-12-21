import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Link,
  Alert,
  CircularProgress,
  Divider,
  Stack
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin, setRole, googleLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get role from URL parameters
    const role = searchParams.get('role');
    if (role) {
      setUserRole(role);
      setRole(role);
    }
  }, [searchParams, setRole]);

  // Handle redirection when authenticated
  const { isAuthenticated, user } = useAuth();
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'customer') {
        navigate('/customer/dashboard', { replace: true });
      }
      // You can add other role redirections here if this login page supports them
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (role) => {
    setUserRole(role);
    setRole(role);
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    try {
      const { user } = await googleLogin();

      // If we have a role from URL, enforce it
      if (userRole && userRole !== 'customer') {
        // Ideally we would check if this google account is registered as 'vendor' etc.
        // For now, if they are trying to login as customer, we let them in.
        // You might want to add backend validation here similar to email/pass
      }

      navigate('/');
    } catch (error) {
      console.error('Google login failed:', error);
      setError(error.message);
    }
  };

  const handleMobileOtpLogin = () => {
    // Navigate to OTP page which will handle the flow
    navigate('/otp');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { email, password } = formData;

      // 1. Authenticate with Firebase first (Client Side)
      const { user: firebaseUser } = await authLogin(email, password);
      const idToken = await firebaseUser.getIdToken();

      // 2. Validate/Register with Backend using the Firebase Token
      // We send the token so the backend can create the user if missing (Sync)
      const loginCredentials = {
        idToken,
        email,
        expectedRole: 'customer'
      };

      const result = await login(loginCredentials);

      // Validate user role on frontend
      if (result.user && result.user.role !== 'customer') {
        throw new Error(`Access denied. This account is registered as ${result.user.role}. Please use the correct login page for your account type.`);
      }

      // Navigate to customer dashboard/home

      // Navigate to customer dashboard/home exists in useEffect now
    } catch (err) {
      console.error('Customer login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials and ensure you are using the correct login page for your account type.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Customer Login
        </Typography>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Login to your customer account to browse and order agricultural products
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Social / alternate login options */}
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <Button
              type="button"
              fullWidth
              variant="outlined"
              startIcon={
                // Use branded multi-color Google "G" logo
                <Box
                  component="img"
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google logo"
                  sx={{ width: 18, height: 18 }}
                />
              }
              onClick={handleGoogleLogin}
              sx={{
                py: 1.1,
                fontWeight: 600,
                borderRadius: 2
              }}
            >
              Sign in with Google
            </Button>
            <Button
              type="button"
              fullWidth
              variant="outlined"
              startIcon={<PhoneIphoneIcon />}
              onClick={handleMobileOtpLogin}
              sx={{
                py: 1.1,
                fontWeight: 600,
                borderRadius: 2
              }}
            >
              Login with Mobile OTP
            </Button>
          </Stack>

          <Divider sx={{ mb: 2 }}>OR</Divider>

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link href="/register" variant="body2">
              {"Don't have an account? Sign Up"}
            </Link>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Looking for a different login?
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Link href="/vendor/login" variant="body2">
                  Vendor Login
                </Link>
                <Link href="/delivery/login" variant="body2">
                  Delivery Partner Login
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage; 