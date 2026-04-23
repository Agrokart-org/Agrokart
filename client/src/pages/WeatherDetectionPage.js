import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  IconButton,
  Button,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  WaterDrop,
  Air,
  ArrowBack,
  Refresh,
  LocationOn,
  Umbrella,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const API_KEY = "1f815af6aaf6ec7c3de9b011dadacec7";
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
      // 1. Get precise location (Village/Town) via Reverse Geocoding
      const geoRes = await fetch(`${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          // OpenWeatherMap reverse geocoding returns local_names if available, or just name
          const name = geoData[0].local_names?.en || geoData[0].local_names?.hi || geoData[0].name;
          const state = geoData[0].state || "";
          setLocationName(`${name}${state ? `, ${state}` : ''}`);
        } else {
          setLocationName("Unknown Location");
        }
      }

      // 2. Fetch Current Weather
      const weatherRes = await fetch(`${API_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
      if (!weatherRes.ok) throw new Error("Could not fetch weather data.");
      const wData = await weatherRes.json();
      
      // If geo API failed, fallback to weather API's generic city name
      if (!locationName) {
        setLocationName(wData.name || "Unknown Location");
      }
      setWeatherData(wData);

      // 3. Fetch Forecast (for Rainfall probability & upcoming weather)
      const forecastRes = await fetch(`${API_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
      if (!forecastRes.ok) throw new Error("Could not fetch forecast.");
      const fData = await forecastRes.json();
      setForecastData(fData.list.slice(0, 8)); // Next 24 hours (3hr intervals)

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
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa", pb: { xs: 10, md: 6 }, pt: { xs: 12, md: 12 }, fontFamily: "'Inter', sans-serif" }}>
      <Container maxWidth="sm" disableGutters={isMobile} sx={{ px: isMobile ? 2 : 3 }}>
        
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 1, color: "text.primary" }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" fontWeight="700" color="text.primary">
              Weather for Agriculture
            </Typography>
          </Box>
          <IconButton onClick={requestLocationAndFetch} color="primary" sx={{ bgcolor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <Refresh />
          </IconButton>
        </Box>

        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10}>
            <CircularProgress size={48} sx={{ color: "#2E7D32" }} />
            <Typography mt={2} color="text.secondary">Fetching local weather data...</Typography>
          </Box>
        ) : error ? (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, textAlign: "center", border: "1px solid #e0e0e0" }}>
            <Typography color="error" mb={2}>{error}</Typography>
            <Button variant="outlined" color="primary" onClick={requestLocationAndFetch} startIcon={<LocationOn />}>
              Retry GPS Location
            </Button>
          </Paper>
        ) : weatherData && (
          <>
            {/* Location & Current Condition */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", mb: 3, border: "1px solid #e0e0e0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <Box display="flex" alignItems="flex-start" mb={2}>
                <LocationOn sx={{ color: "#2E7D32", mt: 0.3, mr: 1 }} />
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="700" color="text.primary" lineHeight={1.2} sx={{ fontSize: isMobile ? "1.1rem" : "1.25rem" }}>
                    {locationName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5} sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
                    Current Location Coordinates: {weatherData.coord.lat.toFixed(2)}, {weatherData.coord.lon.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" alignItems="center" justifyContent="space-between" flexDirection={isMobile ? "row" : "row"}>
                <Box>
                  <Typography variant="h2" fontWeight="800" color="text.primary" sx={{ fontSize: isMobile ? "3rem" : "3.75rem" }}>
                    {Math.round(weatherData.main.temp)}&deg;<span style={{ fontSize: isMobile ? "1.5rem" : "2rem", verticalAlign: "top" }}>C</span>
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ textTransform: "capitalize", fontWeight: "500", fontSize: isMobile ? "0.9rem" : "1rem" }}>
                    {weatherData.weather[0].description}
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <img 
                    src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`} 
                    alt="weather icon"
                    style={{ width: isMobile ? "80px" : "100px", height: isMobile ? "80px" : "100px", objectFit: "contain" }}
                  />
                </Box>
              </Box>
            </Paper>

            <Typography variant="subtitle1" fontWeight="700" color="text.secondary" mb={1.5} sx={{ textTransform: "uppercase", fontSize: isMobile ? "0.75rem" : "0.85rem", letterSpacing: 0.5 }}>
              Farming Parameters
            </Typography>
            <Grid container spacing={isMobile ? 1.5 : 2} mb={3}>
              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #e0e0e0", display: "flex", flexDirection: "column" }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <WaterDrop sx={{ color: "#1976D2", fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight="600">Humidity</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary">
                    {weatherData.main.humidity}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {weatherData.main.humidity > 80 ? 'High risk of fungal diseases' : 'Optimal for crop growth'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #e0e0e0", display: "flex", flexDirection: "column" }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Air sx={{ color: "#455A64", fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight="600">Wind</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary">
                    {(weatherData.wind.speed * 3.6).toFixed(1)} km/h
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {weatherData.wind.speed * 3.6 > 15 ? 'Not ideal for pesticide spraying' : 'Safe for pesticide spraying'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* 24 Hour Forecast */}
            <Typography variant="subtitle1" fontWeight="700" color="text.secondary" mb={1.5} sx={{ textTransform: "uppercase", fontSize: isMobile ? "0.75rem" : "0.85rem", letterSpacing: 0.5 }}>
              24-Hour Forecast (Rain & Temp)
            </Typography>
            <Box 
              sx={{ 
                display: "flex", 
                gap: 1.5, 
                overflowX: "auto", 
                pb: 1,
                "&::-webkit-scrollbar": { height: 4 },
                "&::-webkit-scrollbar-thumb": { backgroundColor: "#c1c1c1", borderRadius: 4 }
              }}
            >
              {forecastData.map((f, i) => (
                <Paper 
                  key={i} 
                  elevation={0}
                  sx={{ 
                    minWidth: "90px", 
                    p: 1.5, 
                    borderRadius: "16px",
                    border: "1px solid #e0e0e0",
                    textAlign: "center",
                    flexShrink: 0,
                    bgcolor: "white"
                  }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    {new Date(f.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <Box display="flex" justifyContent="center">
                    <img src={`https://openweathermap.org/img/wn/${f.weather[0].icon}.png`} alt="icon" style={{ width: 40, height: 40 }} />
                  </Box>
                  <Typography variant="body1" fontWeight="700" color="text.primary">
                    {Math.round(f.main.temp)}&deg;
                  </Typography>
                  {f.pop > 0 && (
                    <Typography variant="caption" sx={{ color: "#1976D2", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", mt: 0.5 }}>
                      <WaterDrop sx={{ fontSize: 12, mr: 0.2 }} /> 
                      {Math.round(f.pop * 100)}%
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default WeatherDetectionPage;
