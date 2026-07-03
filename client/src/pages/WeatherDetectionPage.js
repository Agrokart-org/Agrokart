import React, { useState, useEffect, useCallback } from "react";
import {
  Container, Box, Typography, Paper, Grid, CircularProgress,
  IconButton, Button, Divider, useMediaQuery, useTheme, AppBar, Toolbar
} from "@mui/material";
import {
  WaterDrop, Air, ArrowBack, Refresh, LocationOn, WbSunny, CloudQueue
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || "1f815af6aaf6ec7c3de9b011dadacec7";
const API_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://api.openweathermap.org/geo/1.0";

const WeatherDetectionPage = () => {
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchWeatherByCoords = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const geoRes = await fetch(`${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          const name = geoData[0].local_names?.en || geoData[0].local_names?.hi || geoData[0].name;
          const state = geoData[0].state || "";
          setLocationName(`${name}${state ? `, ${state}` : ''}`);
        } else {
          setLocationName("Unknown Location");
        }
      }

      const weatherRes = await fetch(`${API_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
      if (!weatherRes.ok) throw new Error("Could not fetch weather data.");
      const wData = await weatherRes.json();
      
      if (!locationName) {
        setLocationName(wData.name || "Unknown Location");
      }
      setWeatherData(wData);

      const forecastRes = await fetch(`${API_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
      if (!forecastRes.ok) throw new Error("Could not fetch forecast.");
      const fData = await forecastRes.json();
      setForecastData(fData.list.slice(0, 8)); 

    } catch (err) {
      setError(err.message || "Failed to load location data. Please ensure GPS is enabled.");
    } finally {
      setLoading(false);
    }
  }, [locationName]);

  const requestLocationAndFetch = useCallback(() => {
    setLoading(true);
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => fetchWeatherByCoords(position.coords.latitude, position.coords.longitude),
        (geoErr) => {
          console.error("Geoloaction error:", geoErr);
          setError("Location access denied or unavailable. Please enable device location (GPS) and try again.");
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  }, [fetchWeatherByCoords]);

  useEffect(() => {
    requestLocationAndFetch();
  }, [requestLocationAndFetch]);

  // Determine gradient based on weather condition
  const getGradient = (temp) => {
    if (temp > 30) return "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)"; // Hot
    if (temp < 15) return "linear-gradient(135deg, #29B6F6 0%, #0288D1 100%)"; // Cold
    return "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)"; // Mild/Agro Green
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8faf8", pb: 6, display: "flex", flexDirection: "column" }}>
      {/* Mobile App Bar */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "white", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <Toolbar sx={{ justifyContent: "space-between", px: 2 }}>
          <Box display="flex" alignItems="center">
            <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 1, color: "text.primary" }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" fontWeight="800" color="text.primary">
              Weather
            </Typography>
          </Box>
          <IconButton edge="end" onClick={requestLocationAndFetch} sx={{ color: "#2E7D32", bgcolor: "rgba(46,125,50,0.1)", borderRadius: 2 }}>
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ flex: 1, display: "flex", flexDirection: "column", pt: 3 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress size={48} sx={{ color: "#2E7D32" }} />
              <Typography mt={2} color="text.secondary" fontWeight={600}>Analyzing local climate...</Typography>
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: "center", border: "1px solid #e0e0e0" }}>
                <Typography color="error" mb={2} fontWeight={600}>{error}</Typography>
                <Button variant="contained" onClick={requestLocationAndFetch} startIcon={<LocationOn />} sx={{ borderRadius: 3, bgcolor: "#2E7D32", textTransform: "none", fontWeight: 700 }}>
                  Retry Location
                </Button>
              </Paper>
            </motion.div>
          ) : weatherData && (
            <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              
              {/* Main Weather Card */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 4, 
                  mb: 3, 
                  background: getGradient(weatherData.main.temp),
                  backgroundSize: "200% 200%",
                  animation: "gradientFlow 4s ease infinite",
                  color: "white",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.15)"
                }}
              >
                <Box display="flex" alignItems="center" mb={3}>
                  <LocationOn sx={{ color: "white", mr: 0.5, opacity: 0.9 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="700" lineHeight={1.2}>
                      {locationName}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Current Location
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h1" fontWeight="900" sx={{ letterSpacing: -2, lineHeight: 1 }}>
                      {Math.round(weatherData.main.temp)}&deg;
                    </Typography>
                    <Typography variant="h6" fontWeight="600" sx={{ textTransform: "capitalize", opacity: 0.9, mt: 1 }}>
                      {weatherData.weather[0].description}
                    </Typography>
                  </Box>
                  <motion.img 
                    src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`} 
                    alt="weather icon"
                    style={{ width: "120px", height: "120px", filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.2))" }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  />
                </Box>
              </Paper>

              <Typography variant="subtitle2" fontWeight="800" color="text.secondary" mb={1.5} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                Farming Conditions
              </Typography>
              <Grid container spacing={2} mb={4}>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", bgcolor: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(25,118,210,0.1)" }}>
                        <WaterDrop sx={{ color: "#1976D2", fontSize: 20 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="700">HUMIDITY</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="800" color="text.primary" mb={0.5}>
                      {weatherData.main.humidity}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                      {weatherData.main.humidity > 80 ? 'High disease risk' : 'Optimal for growth'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", bgcolor: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(69,90,100,0.1)" }}>
                        <Air sx={{ color: "#455A64", fontSize: 20 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="700">WIND</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="800" color="text.primary" mb={0.5}>
                      {Math.round(weatherData.wind.speed * 3.6)} km/h
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                      {weatherData.wind.speed * 3.6 > 15 ? 'Delay spraying' : 'Safe to spray'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* 24 Hour Forecast */}
              <Typography variant="subtitle2" fontWeight="800" color="text.secondary" mb={1.5} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                Today's Forecast
              </Typography>
              <Box 
                sx={{ 
                  display: "flex", 
                  gap: 1.5, 
                  overflowX: "auto", 
                  pb: 2,
                  px: 0.5,
                  mx: -0.5, // To accommodate box-shadow without clipping
                  "&::-webkit-scrollbar": { display: "none" },
                  scrollbarWidth: "none",
                }}
              >
                {forecastData.map((f, i) => (
                  <Paper 
                    key={i} 
                    elevation={0}
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    sx={{ 
                      minWidth: "80px", 
                      p: 2, 
                      borderRadius: 4,
                      border: "1px solid rgba(0,0,0,0.06)",
                      textAlign: "center",
                      flexShrink: 0,
                      bgcolor: "white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                      cursor: "pointer"
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight="700">
                      {new Date(f.dt * 1000).toLocaleTimeString([], { hour: 'numeric', hour12: true })}
                    </Typography>
                    <Box display="flex" justifyContent="center" my={1}>
                      <img src={`https://openweathermap.org/img/wn/${f.weather[0].icon}.png`} alt="icon" style={{ width: 36, height: 36 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight="800" color="text.primary">
                      {Math.round(f.main.temp)}&deg;
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mt={0.5}>
                      <WaterDrop sx={{ fontSize: 10, color: f.pop > 0 ? "#1976D2" : "transparent" }} />
                      <Typography variant="caption" sx={{ color: f.pop > 0 ? "#1976D2" : "transparent", fontWeight: "700" }}>
                        {Math.round(f.pop * 100)}%
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>

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

export default WeatherDetectionPage;
