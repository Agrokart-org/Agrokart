import React, { useState } from "react";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Terminal as TerminalIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Hardcoded admin credentials (owner access)
const ADMIN_EMAIL = "admin@agrokart.com";
const ADMIN_PASSWORD = "Agroadmin@7020";

const AdminLoginPage = () => {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState(ADMIN_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUserRole, updateUser, setIsAuthenticated, hideRoleSelection } =
    useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Direct credential validation (no Firebase dependency)
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Set admin session
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("adminLoggedIn", "true");

        if (setUserRole) setUserRole("admin");
        if (updateUser) {
          updateUser({
            id: "admin-root",
            name: "System Admin",
            email: ADMIN_EMAIL,
            role: "admin",
          });
        }

        // Mark as authenticated and hide role selection
        setIsAuthenticated(true);
        hideRoleSelection();

        // Navigate to admin dashboard
        navigate("/admin/dashboard");
      } else {
        throw new Error("ACCESS_DENIED: Invalid credentials");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      localStorage.removeItem("userRole");
      localStorage.removeItem("adminLoggedIn");
      setError(err.message || "System Failure: Authentication Rejected");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Courier New', monospace",
        backgroundImage:
          "radial-gradient(circle at 50% 50%, #111 0%, #000 100%)",
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            bgcolor: "rgba(10, 10, 10, 0.9)",
            border: "1px solid #333",
            boxShadow: "0 0 20px rgba(0, 255, 0, 0.1)",
            color: "#e0e0e0",
            borderRadius: 0,
          }}
        >
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <SecurityIcon sx={{ fontSize: 40, color: "#00ff00", mb: 1 }} />
            <Typography
              variant="h5"
              sx={{
                color: "#00ff00",
                fontFamily: "monospace",
                letterSpacing: 2,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              root_access
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#666", fontFamily: "monospace" }}
            >
              SECURE SYSTEM GATEWAY v4.2
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor: "rgba(255,0,0,0.1)",
                color: "#ff4444",
                border: "1px solid #ff4444",
                "& .MuiAlert-icon": { color: "#ff4444" },
                fontFamily: "monospace",
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#00ff00",
                  mb: 0.5,
                  display: "block",
                  fontFamily: "monospace",
                }}
              >
                &gt; ENTER_IDENTIFIER
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#fff",
                    fontFamily: "monospace",
                    bgcolor: "rgba(255,255,255,0.05)",
                    "& fieldset": { borderColor: "#333" },
                    "&:hover fieldset": { borderColor: "#555" },
                    "&.Mui-focused fieldset": { borderColor: "#00ff00" },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TerminalIcon sx={{ color: "#444" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#00ff00",
                  mb: 0.5,
                  display: "block",
                  fontFamily: "monospace",
                }}
              >
                &gt; ENTER_PASSPHRASE
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#fff",
                    fontFamily: "monospace",
                    bgcolor: "rgba(255,255,255,0.05)",
                    "& fieldset": { borderColor: "#333" },
                    "&:hover fieldset": { borderColor: "#555" },
                    "&.Mui-focused fieldset": { borderColor: "#00ff00" },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "#444" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: "#666" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Button
              fullWidth
              size="large"
              type="submit"
              disabled={loading}
              sx={{
                bgcolor: "#00ff00",
                color: "#000",
                fontWeight: "bold",
                fontFamily: "monospace",
                fontSize: "1.1rem",
                py: 1.5,
                "&:hover": {
                  bgcolor: "#00cc00",
                  boxShadow: "0 0 15px rgba(0, 255, 0, 0.4)",
                },
                "&:disabled": {
                  bgcolor: "#333",
                  color: "#666",
                },
              }}
            >
              {loading ? "AUTHENTICATING..." : "INITIATE_SESSION"}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{ color: "#444", fontFamily: "monospace" }}
            >
              UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED
            </Typography>
            <br />
            <Typography
              variant="caption"
              sx={{ color: "#333", fontFamily: "monospace" }}
            >
              IP: 192.168.x.x LOGGED
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminLoginPage;
