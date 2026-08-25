import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

const EmailLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting authentication with:", { email, isSignUp });

      if (isSignUp) {
        // Sign up
        console.log("Creating new user account...");
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        console.log("User created successfully:", userCredential.user);
        const user = userCredential.user;
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userName", user.email.split("@")[0]);
        localStorage.setItem("isLoggedIn", "true");
      } else {
        // Sign in via backend POST /api/auth/login
        console.log("Signing in existing user via backend...");
        const result = await authLogin(email, password, "customer");
        console.log("User signed in successfully:", result.user);
      }
      // Redirect customers to their dashboard
      navigate("/customer/dashboard");
    } catch (err) {
      console.error("Authentication error:", err);
      setError(err.message || "Authentication error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </Typography>
          <Typography
            variant="body1"
            gutterBottom
            align="center"
            color="text.secondary"
          >
            {isSignUp ? "Sign up to get started" : "Sign in to continue"}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              margin="normal"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Password"
              variant="outlined"
              margin="normal"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : isSignUp ? (
                "Sign Up"
              ) : (
                "Sign In"
              )}
            </Button>

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Button
                variant="text"
                color="primary"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={loading}
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Need an account? Sign Up"}
              </Button>
            </Box>

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Button
                variant="text"
                color="primary"
                component={Link}
                to="/login"
                disabled={loading}
              >
                Continue with Phone Number
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailLoginPage;
