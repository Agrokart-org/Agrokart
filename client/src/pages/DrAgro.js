import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Grid,
  Divider,
  Alert,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Chip,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import SoilUpload from "../components/drAgro/SoilUpload";
import ManualForm from "../components/drAgro/ManualForm";
import RecommendationCard from "../components/drAgro/RecommendationCard";
import WeatherCard from "../components/drAgro/WeatherCard";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import ScienceIcon from "@mui/icons-material/Science";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
// import EcoIcon from '@mui/icons-material/Eco';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
      style={{ animation: "fadeIn 0.5s ease-in-out" }}
    >
      {value === index && <Box sx={{ p: { xs: 2, md: 4 } }}>{children}</Box>}
    </div>
  );
};

const DrAgro = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [tabIndex, setTabIndex] = useState(0);
  const navigate = useNavigate();

  // Global State for Dr.Agro Session
  const [selectedCrop, setSelectedCrop] = useState("");
  const [cropError, setCropError] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleLanguageChange = (event, newLanguage) => {
    if (newLanguage) {
      i18n.changeLanguage(newLanguage);
    }
  };

  const handleCropChange = (event, newCrop) => {
    if (newCrop) {
      setSelectedCrop(newCrop);
      setCropError(false);
    }
  };

  const handleAnalysisComplete = (data) => {
    // Navigate to results page with data
    navigate("/customer/dr-agro/results", { state: { result: data } });
  };

  const crops = [
    "wheat",
    "rice",
    "cotton",
    "sugarcane",
    "soybean",
    "maize",
    "vegetables",
    "other",
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 10, sm: 12 }, mb: 8 }}>
      {/* Header Section */}
      <Box
        textAlign="center"
        mb={6}
        sx={{
          background: "linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)",
          p: 4,
          borderRadius: 4,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: "primary.main",
            margin: "0 auto",
            mb: 2,
            boxShadow: "0 8px 16px rgba(46, 125, 50, 0.3)",
          }}
        >
          <MedicalServicesIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          color="primary.dark"
          fontWeight="800"
          sx={{ fontSize: { xs: "2rem", md: "3rem" } }}
        >
          {t("drAgro.title")}
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          maxWidth="600px"
          mx="auto"
        >
          {t("drAgro.subtitle")}
        </Typography>

        {/* Language Selection */}
        <Box mt={4} display="flex" justifyContent="center">
          <ToggleButtonGroup
            value={i18n.language}
            exclusive
            onChange={handleLanguageChange}
            aria-label="language selection"
            color="primary"
            sx={{
              bgcolor: "background.paper",
              boxShadow: 1,
              "& .MuiToggleButton-root": {
                px: 3,
                py: 1,
                border: "1px solid rgba(0,0,0,0.12)",
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                },
              },
            }}
          >
            <ToggleButton value="en">English</ToggleButton>
            <ToggleButton value="hi">हिंदी</ToggleButton>
            <ToggleButton value="mr">मराठी</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Weather & Farming Advisory Section */}
      <WeatherCard />

      {/* Crop Selection Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          border: "1px solid",
          borderColor: cropError ? "error.main" : "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          fontWeight="600"
          align="center"
          color={cropError ? "error" : "textPrimary"}
        >
          {t("drAgro.form.crop") || "Select Crop"}
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" mb={3}>
          {t("drAgro.selectCropInstruction") ||
            "Choose the crop you are planning to grow"}
        </Typography>

        <Grid container spacing={2} justifyContent="center">
          {crops.map((cropId) => (
            <Grid item key={cropId}>
              <Button
                variant={selectedCrop === cropId ? "contained" : "outlined"}
                color={selectedCrop === cropId ? "primary" : "inherit"}
                onClick={() => handleCropChange(null, cropId)}
                startIcon={<AgricultureIcon />}
                sx={{
                  borderRadius: 50,
                  px: 3,
                  py: 1,
                  textTransform: "capitalize",
                  borderColor:
                    selectedCrop === cropId
                      ? "primary.main"
                      : "rgba(0,0,0,0.12)",
                  bgcolor:
                    selectedCrop === cropId ? "primary.main" : "transparent",
                  color: selectedCrop === cropId ? "white" : "text.primary",
                  "&:hover": {
                    bgcolor:
                      selectedCrop === cropId ? "primary.main" : "action.hover",
                  },
                }}
              >
                {t(`drAgro.crops.${cropId}`)}
              </Button>
            </Grid>
          ))}
        </Grid>
        {cropError && (
          <Typography color="error" variant="body2" align="center" mt={2}>
            {t("drAgro.validation.required") ||
              "Please select a crop to proceed"}
          </Typography>
        )}
      </Paper>

      {/* Main Content Area */}
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={12} lg={10}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              border: 1,
              borderColor: "divider",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              opacity: selectedCrop ? 1 : 0.6,
              pointerEvents: selectedCrop ? "auto" : "none",
              transition: "opacity 0.3s",
            }}
          >
            <Box
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                bgcolor: "grey.50",
              }}
            >
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                variant="fullWidth"
                centered
                indicatorColor="primary"
                textColor="primary"
                sx={{
                  "& .MuiTab-root": {
                    py: 2,
                    fontSize: "1rem",
                    fontWeight: 600,
                    textTransform: "none",
                  },
                }}
              >
                <Tab
                  icon={<ScienceIcon />}
                  label={t("drAgro.uploadTab")}
                  iconPosition="start"
                />
                <Tab
                  icon={<AgricultureIcon />}
                  label={t("drAgro.manualTab")}
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            <TabPanel value={tabIndex} index={0}>
              <Typography
                variant="h6"
                gutterBottom
                color="text.primary"
                fontWeight="600"
              >
                {t("drAgro.uploadInstructions")}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Upload a clear photo or PDF of your soil test report provided by
                a lab.
              </Typography>
              <SoilUpload
                onAnalysisComplete={handleAnalysisComplete}
                onSwitchToManual={() => setTabIndex(1)}
                selectedCrop={selectedCrop}
              />
            </TabPanel>

            <TabPanel value={tabIndex} index={1}>
              <Typography
                variant="h6"
                gutterBottom
                color="text.primary"
                fontWeight="600"
              >
                {t("drAgro.manualInstructions")}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Don't have a soft copy? Enter the values from your physical
                report manually.
              </Typography>
              <ManualForm
                onAnalysisComplete={handleAnalysisComplete}
                selectedCrop={selectedCrop}
              />
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Instruction to select crop if not selected */}
      {!selectedCrop && (
        <Box textAlign="center" mt={2} color="text.secondary">
          <Typography variant="body2">
            Please select a crop above to enable the upload and manual entry
            forms.
          </Typography>
        </Box>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
    </Container>
  );
};

export default DrAgro;
