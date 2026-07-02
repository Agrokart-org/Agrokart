import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Typography, Box, Tabs, Tab, Paper, Grid, Divider, Alert,
  useTheme, useMediaQuery, Card, CardContent, Chip, Avatar, ToggleButton,
  ToggleButtonGroup, Button, IconButton, AppBar, Toolbar
} from "@mui/material";
import { useTranslation } from "react-i18next";
import SoilUpload from "../components/drAgro/SoilUpload";
import ManualForm from "../components/drAgro/ManualForm";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import ScienceIcon from "@mui/icons-material/Science";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudIcon from "@mui/icons-material/Cloud";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { motion, AnimatePresence } from "framer-motion";

const DrAgro = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState(1);
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [cropError, setCropError] = useState(false);

  const handleTabChange = (event, newValue) => setTabIndex(newValue);
  const handleLanguageChange = (event, newLanguage) => {
    if (newLanguage) i18n.changeLanguage(newLanguage);
  };
  const handleCropChange = (cropId) => {
    setSelectedCrop(cropId);
    setCropError(false);
  };

  const handleAnalysisComplete = (data) => {
    navigate("/customer/dr-agro/results", { state: { result: data } });
  };

  const handleProceed = () => {
    if (!selectedCrop) {
      setCropError(true);
      return;
    }
    setStep(2);
  };

  const crops = [
    { id: "wheat", icon: "🌾" },
    { id: "rice", icon: "🍚" },
    { id: "cotton", icon: "☁️" },
    { id: "sugarcane", icon: "🎋" },
    { id: "soybean", icon: "🌱" },
    { id: "maize", icon: "🌽" },
    { id: "vegetables", icon: "🍅" },
    { id: "other", icon: "🌿" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FFFFFF", pb: 6, display: "flex", flexDirection: "column" }}>
      {/* Mobile App Bar */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "white", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <Toolbar sx={{ justifyContent: "space-between", px: 2 }}>
          <Box display="flex" alignItems="center">
            {step === 2 ? (
              <IconButton edge="start" onClick={() => setStep(1)} sx={{ mr: 1, color: "text.primary" }}>
                <ArrowBackIcon />
              </IconButton>
            ) : (
              <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 1, color: "text.primary" }}>
                <ArrowBackIcon />
              </IconButton>
            )}
            <Box display="flex" alignItems="center">
              <MedicalServicesIcon sx={{ color: "#2E7D32", mr: 1 }} />
              <Typography variant="h6" fontWeight="800" color="text.primary">
                Dr. Agro
              </Typography>
            </Box>
          </Box>
          <ToggleButtonGroup
            size="small"
            value={i18n.language}
            exclusive
            onChange={handleLanguageChange}
            sx={{
              "& .MuiToggleButton-root": {
                px: 1.5, py: 0.5, border: "none", fontSize: "0.75rem", fontWeight: 600, borderRadius: 2,
                "&.Mui-selected": { bgcolor: "rgba(46,125,50,0.1)", color: "#2E7D32" }
              }
            }}
          >
            <ToggleButton value="en">EN</ToggleButton>
            <ToggleButton value="hi">HI</ToggleButton>
            <ToggleButton value="mr">MR</ToggleButton>
          </ToggleButtonGroup>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ flex: 1, display: "flex", flexDirection: "column", pt: 3 }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              {/* Removed Hero Section as requested */}

              {/* Crop Selection */}
              <Box mb={3} pt={2}>
                <Typography variant="h6" fontWeight="800" color="text.primary" mb={2}>
                  What are you growing?
                </Typography>
                
                <Box 
                  sx={{
                    p: 1.5,
                    m: -1.5,
                    borderRadius: 4,
                    border: cropError ? "2px solid rgba(239, 68, 68, 0.8)" : "2px solid transparent",
                    boxShadow: cropError ? "0 0 20px rgba(239, 68, 68, 0.25)" : "none",
                    bgcolor: cropError ? "rgba(239, 68, 68, 0.03)" : "transparent",
                    transition: "all 0.3s ease"
                  }}
                >
                  <Grid container spacing={1.5}>
                  {crops.map((crop) => (
                    <Grid item xs={6} sm={4} key={crop.id}>
                      <Paper
                        component={motion.div}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        elevation={0}
                        onClick={() => handleCropChange(crop.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 0.5,
                          border: selectedCrop === crop.id ? "2px solid #166534" : "1px solid #E2E8F0",
                          background: selectedCrop === crop.id ? "#F0FDF4" : "#FFFFFF",
                          boxShadow: selectedCrop === crop.id ? "0 4px 12px rgba(22,101,52,0.08)" : "0 2px 4px rgba(0,0,0,0.02)",
                          position: "relative",
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        {selectedCrop === crop.id && (
                          <Box sx={{ position: "absolute", top: 8, right: 8 }}>
                            <CheckCircleIcon sx={{ color: "#166534", fontSize: 16 }} />
                          </Box>
                        )}
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 36, height: 36,
                            bgcolor: selectedCrop === crop.id ? "#FFFFFF" : "#F8FAFC",
                            border: selectedCrop === crop.id ? "1px solid rgba(22,101,52,0.1)" : "1px solid #F1F5F9",
                            color: "text.primary",
                            fontSize: "1.2rem",
                            borderRadius: 2
                          }}
                        >
                          {crop.icon}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight={selectedCrop === crop.id ? 700 : 600} color={selectedCrop === crop.id ? "#166534" : "#475569"} sx={{ textTransform: "capitalize", fontSize: "0.8rem", mt: 0.5 }}>
                          {t(`drAgro.crops.${crop.id}`)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
                </Box>
              </Box>

              {cropError && (
                <Alert severity="error" sx={{ mb: 4, borderRadius: 2, fontWeight: 600 }}>
                  Please select a crop to proceed.
                </Alert>
              )}

              {/* Modern Weather Card */}
              <Box mb={3} component={motion.div} whileHover={{ y: -2 }} whileTap={{ y: 2, scale: 0.98 }}>
                <Paper
                  elevation={0}
                  onClick={() => navigate("/customer/dr-agro/weather")}
                  sx={{
                    background: "linear-gradient(135deg, #29B6F6 0%, #0277BD 50%, #1565C0 100%)",
                    p: 3,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    boxShadow: "0 8px 16px rgba(2,119,189,0.4), inset 0 2px 4px rgba(255,255,255,0.4)",
                    borderBottom: "4px solid #0D47A1",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.15s ease-in-out"
                  }}
                >
                  <Box sx={{ position: "absolute", right: -15, opacity: 0.15, transform: "scale(1.5)" }}>
                    <CloudIcon sx={{ fontSize: 120, color: "white" }} />
                  </Box>
                  <Box sx={{ position: "relative", zIndex: 1 }}>
                    <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 800, letterSpacing: 1.5, mb: 0.5, display: "block" }}>
                      LOCAL FORECAST
                    </Typography>
                    <Typography variant="h6" fontWeight="800" color="white" mb={0.5}>
                      Farm Weather & Rain
                    </Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.9)" fontWeight="600">
                      Check optimal spraying conditions
                    </Typography>
                  </Box>
                  <Avatar variant="rounded" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", width: 44, height: 44, borderRadius: 2, zIndex: 1, border: "1px solid rgba(255,255,255,0.3)" }}>
                    <ArrowBackIcon sx={{ transform: "rotate(180deg)" }} />
                  </Avatar>
                </Paper>
              </Box>

              {/* Proceed Button */}
              <Box mt={1} pb={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleProceed}
                  sx={{
                    py: 1.8,
                    borderRadius: 2,
                    fontSize: "1rem",
                    fontWeight: 700,
                    bgcolor: "#166534",
                    textTransform: "none",
                    boxShadow: "0 4px 12px rgba(22,101,52,0.2)",
                    "&:hover": { bgcolor: "#14532D", transform: "translateY(-1px)", boxShadow: "0 6px 16px rgba(22,101,52,0.3)" },
                    transition: "all 0.2s ease-in-out"
                  }}
                >
                  Analyze Soil Data
                </Button>
              </Box>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1 }}
            >
              <Box mb={3}>
                <Typography variant="h5" fontWeight="800" color="text.primary" mb={1}>
                  Provide Soil Data 🧪
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  How would you like to provide your soil test results for {t(`drAgro.crops.${selectedCrop}`)}?
                </Typography>
              </Box>

              {/* Segmented Control */}
              <Box sx={{ display: "flex", bgcolor: "#E0E0E0", borderRadius: 3, p: 0.5, mb: 4 }}>
                <Box
                  onClick={() => setTabIndex(0)}
                  sx={{
                    flex: 1, py: 1.5, textAlign: "center", borderRadius: 2.5, cursor: "pointer",
                    bgcolor: tabIndex === 0 ? "white" : "transparent",
                    boxShadow: tabIndex === 0 ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={tabIndex === 0 ? 800 : 600} color={tabIndex === 0 ? "text.primary" : "text.secondary"}>
                    Upload Report
                  </Typography>
                </Box>
                <Box
                  onClick={() => setTabIndex(1)}
                  sx={{
                    flex: 1, py: 1.5, textAlign: "center", borderRadius: 2.5, cursor: "pointer",
                    bgcolor: tabIndex === 1 ? "white" : "transparent",
                    boxShadow: tabIndex === 1 ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={tabIndex === 1 ? 800 : 600} color={tabIndex === 1 ? "text.primary" : "text.secondary"}>
                    Manual Entry
                  </Typography>
                </Box>
              </Box>

              {/* Form Areas */}
              <AnimatePresence mode="wait">
                {tabIndex === 0 && (
                  <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <SoilUpload onAnalysisComplete={handleAnalysisComplete} onSwitchToManual={() => setTabIndex(1)} selectedCrop={selectedCrop} />
                  </motion.div>
                )}
                {tabIndex === 1 && (
                  <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <ManualForm onAnalysisComplete={handleAnalysisComplete} selectedCrop={selectedCrop} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
      <style>
        {`
          @keyframes gradientFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
    </Box>
  );
};

export default DrAgro;
