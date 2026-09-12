import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Container, Box, Typography, Paper, Grid, CircularProgress,
  IconButton, Button, Divider, AppBar, Toolbar,
  Chip, FormControl, Select, MenuItem, InputLabel, Tooltip
} from "@mui/material";
import {
  WaterDrop, Air, ArrowBack, Refresh, LocationOn, WbSunny, CloudQueue,
  WarningAmber, CheckCircle, Spa, Thermostat, MyLocation,
  CalendarToday, AccessTime
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || "1f815af6aaf6ec7c3de9b011dadacec7";
const API_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://api.openweathermap.org/geo/1.0";

const POPULAR_DISTRICTS = [
  { name: "Pune", state: "Maharashtra" },
  { name: "Nashik", state: "Maharashtra" },
  { name: "Buldhana", state: "Maharashtra" },
  { name: "Nagpur", state: "Maharashtra" },
  { name: "Ahmednagar", state: "Maharashtra" },
  { name: "Jalgaon", state: "Maharashtra" },
  { name: "Chhatrapati Sambhaji Nagar", state: "Maharashtra" },
  { name: "Kolhapur", state: "Maharashtra" },
  { name: "Solapur", state: "Maharashtra" },
  { name: "Satara", state: "Maharashtra" },
  { name: "Sangli", state: "Maharashtra" },
  { name: "Amravati", state: "Maharashtra" },
  { name: "Indore", state: "Madhya Pradesh" },
  { name: "Bhopal", state: "Madhya Pradesh" },
  { name: "Ahmedabad", state: "Gujarat" }
];

const WeatherDetectionPage = () => {
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [locationName, setLocationName] = useState("Pune, Maharashtra");
  const [selectedDistrict, setSelectedDistrict] = useState("Pune");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchWeatherByCoords = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      let locLabel = "";
      try {
        const geoRes = await fetch(`${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            const name = geoData[0].local_names?.en || geoData[0].local_names?.hi || geoData[0].name;
            const state = geoData[0].state || "";
            locLabel = `${name}${state ? `, ${state}` : ''}`;
            setLocationName(locLabel);
          }
        }
      } catch (e) {
        console.warn("Geo reverse error:", e);
      }

      const weatherRes = await fetch(`${API_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
      if (!weatherRes.ok) throw new Error("Could not fetch weather data.");
      const wData = await weatherRes.json();

      if (!locLabel) {
        setLocationName(`${wData.name || "Agricultural Region"}, IN`);
      }
      setWeatherData(wData);
      setLastUpdated(new Date());

      const forecastRes = await fetch(`${API_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
      if (forecastRes.ok) {
        const fData = await forecastRes.json();
        setForecastData(fData.list || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load location data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeatherByCity = useCallback(async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      const weatherRes = await fetch(`${API_URL}/weather?q=${encodeURIComponent(cityName)},IN&units=metric&appid=${API_KEY}`);
      if (!weatherRes.ok) throw new Error(`Could not fetch weather for ${cityName}`);
      const wData = await weatherRes.json();
      setLocationName(`${wData.name}, India`);
      setWeatherData(wData);
      setLastUpdated(new Date());

      const forecastRes = await fetch(`${API_URL}/forecast?q=${encodeURIComponent(cityName)},IN&units=metric&appid=${API_KEY}`);
      if (forecastRes.ok) {
        const fData = await forecastRes.json();
        setForecastData(fData.list || []);
      }
    } catch (err) {
      setError(err.message || `Could not fetch weather for ${cityName}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocationAndFetch = useCallback(() => {
    setLoading(true);
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        (geoErr) => {
          console.warn("Geolocation denied or timed out, loading default district (Pune):", geoErr);
          fetchWeatherByCity("Pune");
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
      );
    } else {
      fetchWeatherByCity("Pune");
    }
  }, [fetchWeatherByCoords, fetchWeatherByCity]);

  useEffect(() => {
    requestLocationAndFetch();
  }, [requestLocationAndFetch]);

  const handleDistrictChange = (e) => {
    const dist = e.target.value;
    setSelectedDistrict(dist);
    fetchWeatherByCity(dist);
  };

  // Agronomic advisory logic grounded in real weather metrics
  const advisories = useMemo(() => {
    if (!weatherData) return [];

    const temp = weatherData.main?.temp || 25;
    const humidity = weatherData.main?.humidity || 50;
    const windKmh = Math.round((weatherData.wind?.speed || 0) * 3.6);
    const rainPop = forecastData.length > 0 ? (forecastData[0].pop || 0) * 100 : 0;
    const isRaining = weatherData.weather?.[0]?.main?.toLowerCase().includes("rain");

    const list = [];

    // 1. Spraying Advisory
    if (windKmh > 15) {
      list.push({
        title: "Pesticide & Foliar Spraying",
        status: "Delay Spraying",
        severity: "warning",
        icon: <WarningAmber sx={{ color: "#D97706" }} />,
        detail: `Wind speed is ${windKmh} km/h (drift threshold is 15 km/h). High risk of chemical drift off-target. Postpone spraying until wind calms.`,
        tagColor: "#FEF3C7",
        tagText: "#92400E"
      });
    } else if (isRaining || rainPop > 50) {
      list.push({
        title: "Pesticide & Foliar Spraying",
        status: "High Washout Risk",
        severity: "error",
        icon: <WarningAmber sx={{ color: "#DC2626" }} />,
        detail: `Precipitation risk is high (${Math.round(rainPop)}%). Spraying agrochemicals now risks complete rain wash-off. Wait for dry spell.`,
        tagColor: "#FEE2E2",
        tagText: "#991B1B"
      });
    } else {
      list.push({
        title: "Pesticide & Foliar Spraying",
        status: "Optimal Spray Window",
        severity: "success",
        icon: <CheckCircle sx={{ color: "#16A34A" }} />,
        detail: `Wind is calm (${windKmh} km/h) and rain probability is low. Ideal conditions for herbicide, fungicide, or foliar nutrient application.`,
        tagColor: "#DCFCE7",
        tagText: "#166534"
      });
    }

    // 2. Irrigation Advisory
    if (isRaining || rainPop > 60) {
      list.push({
        title: "Irrigation Scheduling",
        status: "Pause Irrigation",
        severity: "info",
        icon: <WaterDrop sx={{ color: "#0284C7" }} />,
        detail: `Natural precipitation expected (${Math.round(rainPop)}% likelihood). Pause drip or flood irrigation to conserve water and prevent root hypoxia.`,
        tagColor: "#E0F2FE",
        tagText: "#0369A1"
      });
    } else if (temp > 33 && humidity < 40) {
      list.push({
        title: "Irrigation Scheduling",
        status: "Elevated Evapotranspiration",
        severity: "warning",
        icon: <Thermostat sx={{ color: "#D97706" }} />,
        detail: `High temperature (${Math.round(temp)}°C) and low humidity (${humidity}%) increase crop moisture stress. Schedule early morning or late evening irrigation.`,
        tagColor: "#FEF3C7",
        tagText: "#92400E"
      });
    } else {
      list.push({
        title: "Irrigation Scheduling",
        status: "Standard Irrigation Cycle",
        severity: "success",
        icon: <WaterDrop sx={{ color: "#16A34A" }} />,
        detail: `Evaporation demand is normal. Maintain scheduled field capacity irrigation cycles based on your crop growth stage.`,
        tagColor: "#DCFCE7",
        tagText: "#166534"
      });
    }

    // 3. Fungal / Pest Risk
    if (humidity > 78 && temp >= 20 && temp <= 32) {
      list.push({
        title: "Disease & Pest Vector Alert",
        status: "High Fungal Risk",
        severity: "error",
        icon: <WarningAmber sx={{ color: "#DC2626" }} />,
        detail: `Relative humidity is elevated (${humidity}%). Warm, humid canopy conditions favor rapid spore germination for Downy Mildew, Rust, and Blight. Scout field rows closely.`,
        tagColor: "#FEE2E2",
        tagText: "#991B1B"
      });
    } else {
      list.push({
        title: "Disease & Pest Vector Alert",
        status: "Moderate / Controlled",
        severity: "success",
        icon: <CheckCircle sx={{ color: "#16A34A" }} />,
        detail: `Current atmospheric humidity (${humidity}%) does not indicate abnormal immediate fungal spore pressure. Routine weekly crop scouting recommended.`,
        tagColor: "#DCFCE7",
        tagText: "#166534"
      });
    }

    return list;
  }, [weatherData, forecastData]);

  // Group 5-day forecast (take 1 representative sample per day)
  const dailyForecast = useMemo(() => {
    if (!forecastData || forecastData.length === 0) return [];
    const daysMap = {};
    forecastData.forEach((item) => {
      const dateKey = new Date(item.dt * 1000).toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });
      if (!daysMap[dateKey]) {
        daysMap[dateKey] = {
          dateLabel: dateKey,
          temps: [],
          weather: item.weather[0],
          pop: item.pop || 0,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed
        };
      }
      daysMap[dateKey].temps.push(item.main.temp);
      if ((item.pop || 0) > daysMap[dateKey].pop) {
        daysMap[dateKey].pop = item.pop;
        daysMap[dateKey].weather = item.weather[0];
      }
    });

    return Object.values(daysMap).slice(0, 5).map((d) => ({
      ...d,
      minTemp: Math.round(Math.min(...d.temps)),
      maxTemp: Math.round(Math.max(...d.temps))
    }));
  }, [forecastData]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8FAFC", pb: 8 }}>
      {/* Top Professional Navigation Bar */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 4 } }}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton edge="start" onClick={() => navigate(-1)} sx={{ color: "#1E293B" }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight="800" color="#0F172A" sx={{ fontSize: { xs: "1.05rem", sm: "1.25rem" } }}>
                  Agricultural Weather Center
                </Typography>
                <Chip
                  label="LIVE SATELLITE"
                  size="small"
                  sx={{
                    bgcolor: "#ECFDF5",
                    color: "#047857",
                    border: "1px solid #A7F3D0",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    height: 20
                  }}
                />
              </Box>
              <Typography variant="caption" color="#64748B" sx={{ display: { xs: "none", sm: "block" } }}>
                Hyperlocal microclimate metrics, spray windows, and irrigation advisories
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1.5}>
            <Tooltip title="Detect My Current Location">
              <Button
                variant="outlined"
                size="small"
                startIcon={<MyLocation />}
                onClick={requestLocationAndFetch}
                sx={{
                  display: { xs: "none", sm: "inline-flex" },
                  borderColor: "#CBD5E1",
                  color: "#1B5E20",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { borderColor: "#1B5E20", bgcolor: "#F0FDF4" }
                }}
              >
                Auto-Detect
              </Button>
            </Tooltip>
            <IconButton onClick={requestLocationAndFetch} sx={{ color: "#1B5E20", bgcolor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 2 }}>
              <Refresh />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 3 }}>
        {/* District Selector & Location Status Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2.5,
            border: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <LocationOn sx={{ color: "#1B5E20" }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="800" color="#0F172A" sx={{ lineHeight: 1.2 }}>
                {locationName}
              </Typography>
              <Typography variant="caption" color="#64748B">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · AgroKart Meteorological Station
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1.5} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <FormControl size="small" sx={{ minWidth: 220, flex: { xs: 1, sm: "initial" } }}>
              <InputLabel id="district-select-label">Select Agricultural District</InputLabel>
              <Select
                labelId="district-select-label"
                value={selectedDistrict}
                label="Select Agricultural District"
                onChange={handleDistrictChange}
                sx={{ borderRadius: 2 }}
              >
                {POPULAR_DISTRICTS.map((dist) => (
                  <MenuItem key={dist.name} value={dist.name}>
                    {dist.name} ({dist.state})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        <AnimatePresence mode="wait">
          {loading ? (
            <Box py={10} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
              <CircularProgress size={44} sx={{ color: "#1B5E20" }} />
              <Typography mt={2} color="#475569" fontWeight={600}>
                Fetching live satellite microclimate data...
              </Typography>
            </Box>
          ) : error ? (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, textAlign: "center", border: "1px solid #FECACA", bgcolor: "#FEF2F2" }}>
              <Typography color="#991B1B" mb={2} fontWeight={700}>
                {error}
              </Typography>
              <Button
                variant="contained"
                onClick={() => fetchWeatherByCity("Pune")}
                sx={{ borderRadius: 2, bgcolor: "#1B5E20", textTransform: "none", fontWeight: 700 }}
              >
                Load Pune Weather
              </Button>
            </Paper>
          ) : weatherData && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {/* PRIMARY CONDITIONS & METRICS GRID */}
              <Grid container spacing={3} mb={3.5}>
                {/* Main Temperature Card */}
                <Grid item xs={12} md={7}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, sm: 4 },
                      height: "100%",
                      borderRadius: 3,
                      border: "1px solid #E2E8F0",
                      bgcolor: "#FFFFFF",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Chip
                          label="Current Ambient"
                          size="small"
                          sx={{ bgcolor: "#F1F5F9", color: "#475569", fontWeight: 700, fontSize: "0.72rem", mb: 1 }}
                        />
                        <Typography variant="h1" fontWeight="900" color="#0F172A" sx={{ letterSpacing: -3, lineHeight: 1 }}>
                          {Math.round(weatherData.main.temp)}°C
                        </Typography>
                        <Typography variant="h6" fontWeight="700" color="#334155" sx={{ textTransform: "capitalize", mt: 1 }}>
                          {weatherData.weather[0].description}
                        </Typography>
                        <Typography variant="body2" color="#64748B" mt={0.5}>
                          Feels like {Math.round(weatherData.main.feels_like)}°C · High {Math.round(weatherData.main.temp_max)}°C · Low {Math.round(weatherData.main.temp_min)}°C
                        </Typography>
                      </Box>
                      <Box textAlign="center">
                        <img
                          src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`}
                          alt="Weather condition"
                          style={{ width: 110, height: 110, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))" }}
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    {/* Quick Microclimate Badges */}
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="#64748B" fontWeight={700} display="block">
                          HUMIDITY
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="800" color="#0F172A">
                          {weatherData.main.humidity}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="#64748B" fontWeight={700} display="block">
                          WIND SPEED
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="800" color="#0F172A">
                          {Math.round(weatherData.wind.speed * 3.6)} km/h
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="#64748B" fontWeight={700} display="block">
                          PRESSURE
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="800" color="#0F172A">
                          {weatherData.main.pressure} hPa
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="#64748B" fontWeight={700} display="block">
                          CLOUD COVER
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="800" color="#0F172A">
                          {weatherData.clouds?.all || 0}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* 4 Agricultural Metric Quick Cards */}
                <Grid item xs={12} md={5}>
                  <Grid container spacing={2} sx={{ height: "100%" }}>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", height: "100%" }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                          <WaterDrop sx={{ color: "#0284C7", fontSize: 20 }} />
                        </Box>
                        <Typography variant="caption" fontWeight="700" color="#64748B">
                          RELATIVE HUMIDITY
                        </Typography>
                        <Typography variant="h5" fontWeight="800" color="#0F172A" my={0.5}>
                          {weatherData.main.humidity}%
                        </Typography>
                        <Typography variant="caption" color={weatherData.main.humidity > 78 ? "#DC2626" : "#16A34A"} fontWeight={700}>
                          {weatherData.main.humidity > 78 ? "High fungal pressure" : "Optimal range"}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", height: "100%" }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                          <Air sx={{ color: "#16A34A", fontSize: 20 }} />
                        </Box>
                        <Typography variant="caption" fontWeight="700" color="#64748B">
                          WIND VELOCITY
                        </Typography>
                        <Typography variant="h5" fontWeight="800" color="#0F172A" my={0.5}>
                          {Math.round(weatherData.wind.speed * 3.6)} <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>km/h</span>
                        </Typography>
                        <Typography variant="caption" color={weatherData.wind.speed * 3.6 > 15 ? "#DC2626" : "#16A34A"} fontWeight={700}>
                          {weatherData.wind.speed * 3.6 > 15 ? "Drift hazard: pause spray" : "Safe to spray"}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", height: "100%" }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                          <CloudQueue sx={{ color: "#D97706", fontSize: 20 }} />
                        </Box>
                        <Typography variant="caption" fontWeight="700" color="#64748B">
                          RAIN PROBABILITY
                        </Typography>
                        <Typography variant="h5" fontWeight="800" color="#0F172A" my={0.5}>
                          {forecastData.length > 0 ? Math.round((forecastData[0].pop || 0) * 100) : 0}%
                        </Typography>
                        <Typography variant="caption" color="#475569" fontWeight={600}>
                          Next 3 hours window
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", height: "100%" }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                          <WbSunny sx={{ color: "#EAB308", fontSize: 20 }} />
                        </Box>
                        <Typography variant="caption" fontWeight="700" color="#64748B">
                          SUN EXPOSURE
                        </Typography>
                        <Typography variant="h5" fontWeight="800" color="#0F172A" my={0.5}>
                          {100 - (weatherData.clouds?.all || 0)}%
                        </Typography>
                        <Typography variant="caption" color="#475569" fontWeight={600}>
                          Solar radiation potential
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* ACTIONABLE FARMING ADVISORY MODULE */}
              <Box mb={4}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Spa sx={{ color: "#1B5E20" }} />
                  <Typography variant="h6" fontWeight="800" color="#0F172A">
                    Actionable Agronomic Advisories
                  </Typography>
                </Box>
                <Grid container spacing={2.5}>
                  {advisories.map((adv, idx) => (
                    <Grid item xs={12} md={4} key={idx}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          border: "1px solid #E2E8F0",
                          bgcolor: "#FFFFFF",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between"
                        }}
                      >
                        <Box>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                            <Box display="flex" alignItems="center" gap={1}>
                              {adv.icon}
                              <Typography variant="subtitle2" fontWeight="800" color="#0F172A">
                                {adv.title}
                              </Typography>
                            </Box>
                            <Chip
                              label={adv.status}
                              size="small"
                              sx={{
                                bgcolor: adv.tagColor,
                                color: adv.tagText,
                                fontWeight: 800,
                                fontSize: "0.68rem"
                              }}
                            />
                          </Box>
                          <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                            {adv.detail}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* 24-HOUR HOURLY OUTLOOK */}
              <Box mb={4}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AccessTime sx={{ color: "#1B5E20" }} />
                  <Typography variant="h6" fontWeight="800" color="#0F172A">
                    Next 24 Hours Forecast
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    overflowX: "auto",
                    pb: 1.5,
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" }
                  }}
                >
                  {forecastData.slice(0, 8).map((f, i) => (
                    <Paper
                      key={i}
                      elevation={0}
                      sx={{
                        minWidth: 120,
                        p: 2,
                        borderRadius: 2.5,
                        border: "1px solid #E2E8F0",
                        textAlign: "center",
                        bgcolor: "#FFFFFF",
                        flexShrink: 0
                      }}
                    >
                      <Typography variant="caption" color="#64748B" fontWeight="700">
                        {new Date(f.dt * 1000).toLocaleTimeString([], { hour: "numeric", hour12: true })}
                      </Typography>
                      <Box display="flex" justifyContent="center" my={1}>
                        <img
                          src={`https://openweathermap.org/img/wn/${f.weather[0].icon}.png`}
                          alt="icon"
                          style={{ width: 44, height: 44 }}
                        />
                      </Box>
                      <Typography variant="subtitle1" fontWeight="800" color="#0F172A">
                        {Math.round(f.main.temp)}°C
                      </Typography>
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mt={0.5}>
                        <WaterDrop sx={{ fontSize: 12, color: (f.pop || 0) > 0 ? "#0284C7" : "#94A3B8" }} />
                        <Typography variant="caption" sx={{ color: (f.pop || 0) > 0 ? "#0284C7" : "#94A3B8", fontWeight: 700 }}>
                          {Math.round((f.pop || 0) * 100)}%
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="#64748B" display="block" mt={0.5} sx={{ fontSize: "0.68rem" }}>
                        {Math.round((f.wind?.speed || 0) * 3.6)} km/h
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>

              {/* 5-DAY AGRICULTURAL OUTLOOK */}
              <Box mb={4}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CalendarToday sx={{ color: "#1B5E20" }} />
                  <Typography variant="h6" fontWeight="800" color="#0F172A">
                    5-Day Agricultural Weather Outlook
                  </Typography>
                </Box>
                <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", overflow: "hidden" }}>
                  {dailyForecast.map((day, idx) => (
                    <Box
                      key={day.dateLabel}
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: idx < dailyForecast.length - 1 ? "1px solid #F1F5F9" : "none",
                        "&:hover": { bgcolor: "#F8FAFC" }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2} sx={{ width: { xs: 120, sm: 180 } }}>
                        <Typography variant="subtitle2" fontWeight="700" color="#0F172A">
                          {day.dateLabel}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        <img
                          src={`https://openweathermap.org/img/wn/${day.weather.icon}.png`}
                          alt="icon"
                          style={{ width: 36, height: 36 }}
                        />
                        <Typography variant="body2" color="#475569" sx={{ display: { xs: "none", sm: "block" }, textTransform: "capitalize", minWidth: 110 }}>
                          {day.weather.description}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 70 }}>
                        <WaterDrop sx={{ fontSize: 14, color: day.pop > 0 ? "#0284C7" : "#CBD5E1" }} />
                        <Typography variant="caption" fontWeight="700" color={day.pop > 0 ? "#0284C7" : "#94A3B8"}>
                          {Math.round(day.pop * 100)}%
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography variant="subtitle2" fontWeight="800" color="#0F172A">
                          {day.maxTemp}°
                        </Typography>
                        <Typography variant="caption" color="#94A3B8" fontWeight="600">
                          {day.minTemp}°
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  );
};

export default WeatherDetectionPage;
