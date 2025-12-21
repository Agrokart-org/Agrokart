import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { useAuth } from '../context/AuthContext';

const OtpPage = () => {
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const navigate = useNavigate();
  const { sendOtp, verifyOtp, userRole, setRole, updateUser } = useAuth(); // Destructure confirmOtp from context if renamed, or verifyOtp

  useEffect(() => {
    let interval;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    setLoading(true);

    try {
      await sendOtp(formattedPhone, 'recaptcha-container');
      setStep('otp');
      setTimer(30);
      setCanResend(false);
    } catch (err) {
      console.error('Send OTP Error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await verifyOtp(otp);

      console.log('User signed in:', user);

      // If no role is set or just generic login, check/set role
      // For now, we trust the flow they came from (or default)
      // Logic from OtpPage original:
      localStorage.setItem('userPhone', user.phoneNumber);
      localStorage.setItem('userName', `User ${user.phoneNumber.slice(-4)}`);
      localStorage.setItem('isLoggedIn', 'true');

      // If specific role logic is needed (e.g. they came from Vendor login)
      // We rely on AuthContext userRole persistence
      if (userRole === 'vendor') {
        navigate('/vendor/dashboard');
      } else if (userRole === 'delivery_partner') {
        navigate('/delivery/dashboard');
      } else {
        navigate('/home');
      }

    } catch (err) {
      console.error('Verify OTP Error:', err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setTimer(30);
    setCanResend(false);
    handleSendOTP({ preventDefault: () => { } });
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {step === 'phone' ? (
            <>
              <Typography variant="h4" component="h1" gutterBottom align="center">
                Login with Phone
              </Typography>
              <Typography variant="body1" gutterBottom align="center" color="text.secondary">
                Enter your mobile number to receive an OTP
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <form onSubmit={handleSendOTP}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  variant="outlined"
                  margin="normal"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter 10 digit number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><PhoneIcon /> +91</InputAdornment>,
                  }}
                  disabled={loading}
                />

                <div id="recaptcha-container" style={{ marginTop: 20 }}></div>

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  disabled={loading || phoneNumber.length < 10}
                  sx={{ mt: 3 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send OTP'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <Typography variant="h4" component="h1" gutterBottom align="center">
                Verify OTP
              </Typography>
              <Typography variant="body1" gutterBottom align="center" color="text.secondary">
                Enter the 6-digit code sent to {phoneNumber}
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <form onSubmit={handleVerifyOTP}>
                <TextField
                  fullWidth
                  label="OTP"
                  variant="outlined"
                  margin="normal"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 6) setOtp(val);
                  }}
                  placeholder="Enter 6-digit OTP"
                  inputProps={{ maxLength: 6 }}
                  disabled={loading}
                />

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  sx={{ mt: 3 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
                </Button>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    variant="text"
                    onClick={handleResend}
                    disabled={!canResend || loading}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                  </Button>
                </Box>

                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setStep('phone')}
                  sx={{ mt: 1 }}
                >
                  Change Phone Number
                </Button>
              </form>
            </>
          )}

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button onClick={() => navigate('/login')}>Back to Login</Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default OtpPage; 