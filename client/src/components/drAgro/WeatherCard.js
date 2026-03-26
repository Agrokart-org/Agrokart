import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
  Alert,
} from "@mui/material";
import {
  MyLocation,
  Search,
  Refresh,
  Air,
  WaterDrop,
  Visibility,
  ThermostatAuto,
  NearMe,
  Agriculture,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { API_BASE_URL, safeFetch } from "../../services/api";

// ── Dynamic background gradient per weather condition ──
const getBgGradient = (icon = "01d") => {
  if (icon.startsWith("01"))
    return "linear-gradient(145deg,#FF9A3C 0%,#FFD700 60%,#FFF9C4 100%)";
  if (icon.startsWith("02"))
    return "linear-gradient(145deg,#F9A825 0%,#B0BEC5 70%,#ECEFF1 100%)";
  if (icon.startsWith("03") || icon.startsWith("04"))
    return "linear-gradient(145deg,#78909C 0%,#B0BEC5 60%,#ECEFF1 100%)";
  if (icon.startsWith("09") || icon.startsWith("10"))
    return "linear-gradient(145deg,#1565C0 0%,#42A5F5 60%,#B3E5FC 100%)";
  if (icon.startsWith("11"))
    return "linear-gradient(145deg,#37474F 0%,#546E7A 60%,#9E9E9E 100%)";
  if (icon.startsWith("13"))
    return "linear-gradient(145deg,#5C6BC0 0%,#90CAF9 60%,#E3F2FD 100%)";
  return "linear-gradient(145deg,#FF9A3C 0%,#FFF8E1 100%)";
};

const isNightIcon = (icon = "") => icon.endsWith("n");

const getSeverityStyles = (severity) => {
  const s = {
    error: { bg: "#FFF3F3", border: "#EF5350", icon: "🔴" },
    warning: { bg: "#FFFBF0", border: "#FFA726", icon: "🟡" },
    success: { bg: "#F1FBF4", border: "#66BB6A", icon: "🟢" },
    info: { bg: "#F0F7FF", border: "#42A5F5", icon: "🔵" },
  };
  return s[severity] || s.info;
};

const OWMIcon = ({ icon, size = 64 }) => (
  <Box
    component="img"
    src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
    alt="weather"
    sx={{
      width: size,
      height: size,
      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
    }}
  />
);

const WeatherCard = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cityInput, setCityInput] = useState("");
  const [locationMethod, setLocationMethod] = useState("gps");

  const fetchWeather = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);
      try {
        const lang = i18n.language || "en";
        const url = `${API_BASE_URL}/weather?${new URLSearchParams({ ...params, lang })}`;
        const res = await safeFetch(url);
        const data =
          typeof res.json === "function" ? await res.json() : res.data || res;
        if (data.success) setWeather(data.data);
        else setError(data.message || "Failed to load weather");
      } catch {
        setError("Weather service unavailable. Check connection.");
      } finally {
        setLoading(false);
      }
    },
    [i18n.language],
  );

  const fetchByGPS = useCallback(() => {
    if (!navigator.geolocation) {
      fetchWeather({ city: "Pune" });
      return;
    }
    setLocationMethod("gps");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => fetchWeather({ city: "Pune" }),
      { timeout: 10000, enableHighAccuracy: false },
    );
  }, [fetchWeather]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (cityInput.trim()) {
      setLocationMethod("city");
      fetchWeather({ city: cityInput.trim() });
    }
  };

  useEffect(() => {
    fetchByGPS();
  }, [fetchByGPS]);

  // ── Loading Skeleton ──
  if (loading)
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          mb: 4,
          background: "linear-gradient(145deg,#B0BEC5 0%,#ECEFF1 100%)",
        }}
      >
        <Box sx={{ p: 3 }}>
          <Skeleton
            variant="text"
            width="50%"
            height={28}
            sx={{ mb: 1, bgcolor: "rgba(255,255,255,0.4)" }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Skeleton
              variant="circular"
              width={80}
              height={80}
              sx={{ bgcolor: "rgba(255,255,255,0.4)" }}
            />
            <Box sx={{ flex: 1 }}>
              <Skeleton
                variant="text"
                width="40%"
                height={64}
                sx={{ bgcolor: "rgba(255,255,255,0.4)" }}
              />
              <Skeleton
                variant="text"
                width="60%"
                height={24}
                sx={{ bgcolor: "rgba(255,255,255,0.3)" }}
              />
            </Box>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 1.5,
              mb: 2,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={72}
                sx={{ borderRadius: 2, bgcolor: "rgba(255,255,255,0.3)" }}
              />
            ))}
          </Box>
          <Skeleton
            variant="rounded"
            height={100}
            sx={{ borderRadius: 3, bgcolor: "rgba(255,255,255,0.3)" }}
          />
        </Box>
      </Paper>
    );

  // ── Error State ──
  if (error && !weather)
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          mb: 4,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ display: "flex", gap: 1 }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Enter city name (e.g. Pune)..."
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 },
            }}
          />
          <IconButton type="submit" color="primary">
            <Search />
          </IconButton>
        </Box>
      </Paper>
    );

  if (!weather) return null;
  const w = weather;
  const bgGradient = getBgGradient(w.icon);
  const isNight = isNightIcon(w.icon);
  const textColor =
    isNight || w.icon?.startsWith("11") || w.icon?.startsWith("04")
      ? "rgba(255,255,255,0.95)"
      : "rgba(0,0,0,0.87)";
  const subtleColor =
    isNight || w.icon?.startsWith("11") || w.icon?.startsWith("04")
      ? "rgba(255,255,255,0.7)"
      : "rgba(0,0,0,0.55)";
  const glassStyle = {
    bgcolor: isNight ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.45)",
    backdropFilter: "blur(8px)",
    border: "1px solid",
    borderColor: isNight ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)",
  };

  const sunriseTime = w.sunrise
    ? new Date(w.sunrise * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";
  const sunsetTime = w.sunset
    ? new Date(w.sunset * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        mb: 4,
        background: bgGradient,
      }}
    >
      {/* ── City Search Bar ── */}
      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{ px: 2.5, pt: 1.5, pb: 0.5 }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder={t("weather.searchCity") || "Search city..."}
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: subtleColor, fontSize: 18 }} />
              </InputAdornment>
            ),
            sx: {
              ...glassStyle,
              borderRadius: 3,
              color: textColor,
              fontSize: "0.85rem",
              "& input": { color: textColor },
              "& input::placeholder": { color: subtleColor },
            },
          }}
          sx={{ "& .MuiOutlinedInput-notchedOutline": { border: "none" } }}
        />
      </Box>

      {/* ── Main Hero: Icon + Temp + Location ── */}
      <Box
        sx={{
          px: 2.5,
          pt: 2,
          pb: 1,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{ ...glassStyle, borderRadius: 3, p: 1, display: "inline-flex" }}
        >
          <OWMIcon icon={w.icon} size={72} />
        </Box>
        <Box>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
            <Typography
              fontWeight="900"
              lineHeight={1}
              sx={{
                color: textColor,
                fontSize: isMobile ? "3.5rem" : "4.5rem",
              }}
            >
              {w.temperature}
            </Typography>
            <Typography
              fontWeight="700"
              sx={{ color: textColor, fontSize: "1.5rem", mt: 1 }}
            >
              °C
            </Typography>
          </Box>
          <Typography
            fontWeight="600"
            textTransform="capitalize"
            sx={{ color: textColor, fontSize: "1rem", mt: 0.5 }}
          >
            {w.description}
          </Typography>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
          >
            <NearMe sx={{ fontSize: 14, color: subtleColor }} />
            <Typography
              sx={{ color: subtleColor, fontSize: "0.8rem", fontWeight: 600 }}
            >
              {w.location}, {w.country}
            </Typography>
          </Box>
          <Typography sx={{ color: subtleColor, fontSize: "0.75rem" }}>
            Feels like {w.feelsLike}°C &nbsp;·&nbsp; {w.tempMin}° / {w.tempMax}°
          </Typography>
        </Box>
      </Box>

      {/* ── Top bar: title + GPS + refresh ── */}
      <Box
        sx={{
          px: 2.5,
          pt: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          fontWeight="800"
          fontSize="1rem"
          sx={{ color: textColor, letterSpacing: 0.5 }}
        >
          🌤️ {t("weather.title") || "Weather & Farming Advisory"}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Use GPS">
            <IconButton
              size="small"
              onClick={fetchByGPS}
              sx={{
                color: textColor,
                bgcolor: isNight
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.4)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.6)" },
              }}
            >
              <MyLocation fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={() =>
                locationMethod === "city"
                  ? fetchWeather({ city: cityInput || w.location })
                  : fetchByGPS()
              }
              sx={{
                color: textColor,
                bgcolor: isNight
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.4)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.6)" },
              }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Metrics Row ── */}
      <Box
        sx={{
          px: 2.5,
          pt: 2,
          pb: 1,
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
          gap: 1.5,
        }}
      >
        {[
          {
            icon: (
              <WaterDrop
                sx={{ fontSize: 18, color: isNight ? "#90CAF9" : "#1976D2" }}
              />
            ),
            label: t("weather.humidity") || "Humidity",
            value: `${w.humidity}%`,
          },
          {
            icon: (
              <Air
                sx={{ fontSize: 18, color: isNight ? "#CFD8DC" : "#455A64" }}
              />
            ),
            label: t("weather.wind") || "Wind",
            value: `${w.windSpeed} km/h`,
          },
          {
            icon: (
              <ThermostatAuto
                sx={{ fontSize: 18, color: isNight ? "#FFCC80" : "#E65100" }}
              />
            ),
            label: "Pressure",
            value: `${w.pressure} hPa`,
          },
          {
            icon: (
              <Visibility
                sx={{ fontSize: 18, color: isNight ? "#CE93D8" : "#7B1FA2" }}
              />
            ),
            label: t("weather.visibility") || "Visibility",
            value: w.visibility ? `${w.visibility} km` : "N/A",
          },
        ].map((m, i) => (
          <Box
            key={i}
            sx={{
              ...glassStyle,
              borderRadius: 2.5,
              p: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {m.icon}
            <Box>
              <Typography
                sx={{
                  color: subtleColor,
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                {m.label}
              </Typography>
              <Typography
                sx={{
                  color: textColor,
                  fontSize: "0.9rem",
                  fontWeight: 800,
                  lineHeight: 1.2,
                }}
              >
                {m.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* ── Sunrise / Sunset ── */}
      <Box sx={{ px: 2.5, pb: 1.5, display: "flex", gap: 1 }}>
        <Box
          sx={{
            ...glassStyle,
            borderRadius: 2,
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: "1.1rem" }}>🌅</Typography>
          <Box>
            <Typography
              sx={{ color: subtleColor, fontSize: "0.65rem", fontWeight: 600 }}
            >
              SUNRISE
            </Typography>
            <Typography
              sx={{ color: textColor, fontWeight: 800, fontSize: "0.85rem" }}
            >
              {sunriseTime}
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            ...glassStyle,
            borderRadius: 2,
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: "1.1rem" }}>🌇</Typography>
          <Box>
            <Typography
              sx={{ color: subtleColor, fontSize: "0.65rem", fontWeight: 600 }}
            >
              SUNSET
            </Typography>
            <Typography
              sx={{ color: textColor, fontWeight: 800, fontSize: "0.85rem" }}
            >
              {sunsetTime}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── 24h Forecast ── */}
      {w.forecast?.length > 0 && (
        <Box sx={{ px: 2.5, pb: 2 }}>
          <Typography
            sx={{
              color: subtleColor,
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            📅 {t("weather.forecast") || "24-Hour Forecast"}
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              overflowX: "auto",
              pb: 0.5,
              "&::-webkit-scrollbar": { height: 3 },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "rgba(255,255,255,0.4)",
                borderRadius: 4,
              },
            }}
          >
            {w.forecast.map((f, i) => {
              const time = new Date(f.dt * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <Box
                  key={i}
                  sx={{
                    ...glassStyle,
                    borderRadius: 2.5,
                    p: 1.5,
                    minWidth: 72,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      color: subtleColor,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                    }}
                  >
                    {time}
                  </Typography>
                  <Box
                    component="img"
                    src={`https://openweathermap.org/img/wn/${f.icon}.png`}
                    alt=""
                    sx={{ width: 36, height: 36 }}
                  />
                  <Typography
                    sx={{
                      color: textColor,
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      lineHeight: 1,
                    }}
                  >
                    {f.temp}°
                  </Typography>
                  {f.pop > 0 && (
                    <Typography
                      sx={{
                        color: isNight ? "#90CAF9" : "#1565C0",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        mt: 0.5,
                      }}
                    >
                      💧{f.pop}%
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* ── Farming Recommendations ── */}
      {w.recommendations?.length > 0 && (
        <Box sx={{ px: 2.5, pb: 2 }}>
          <Divider
            sx={{
              mb: 2,
              borderColor: isNight
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.1)",
            }}
          />
          <Typography
            sx={{
              color: subtleColor,
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              mb: 1.5,
            }}
          >
            🧠 {t("weather.recommendations") || "Smart Farming Advisory"}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {w.recommendations.map((rec, i) => {
              const s = getSeverityStyles(rec.severity);
              return (
                <Box
                  key={i}
                  sx={{
                    bgcolor: s.bg,
                    borderLeft: `4px solid ${s.border}`,
                    borderRadius: "0 12px 12px 0",
                    p: 2,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="800"
                    color="text.primary"
                  >
                    {rec.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={0.5}
                    sx={{ lineHeight: 1.6 }}
                  >
                    {rec.description}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* ── Crop Suggestions ── */}
      {w.cropSuggestions?.suitable?.length > 0 && (
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <Divider
            sx={{
              mb: 2,
              borderColor: isNight
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.1)",
            }}
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Agriculture
              sx={{ color: isNight ? "#A5D6A7" : "#2E7D32", fontSize: 22 }}
            />
            <Typography
              fontWeight="800"
              sx={{ color: textColor, fontSize: "1rem" }}
            >
              🌱 {t("weather.cropSuggestions") || "Best Crops to Plant Now"}
            </Typography>
            <Chip
              label={w.cropSuggestions.season}
              size="small"
              sx={{
                ...glassStyle,
                color: textColor,
                fontWeight: 700,
                fontSize: "0.7rem",
                height: 24,
              }}
            />
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)",
              gap: 1.5,
            }}
          >
            {w.cropSuggestions.suitable.map((crop, i) => (
              <Box
                key={i}
                sx={{
                  ...glassStyle,
                  borderRadius: 2.5,
                  p: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "1.5rem", lineHeight: 1 }}>
                    {crop.emoji}
                  </Typography>
                  <Box>
                    <Typography
                      sx={{
                        color: textColor,
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {crop.name}
                    </Typography>
                    <Chip
                      label={crop.tempRange}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.6rem",
                        fontWeight: 600,
                        bgcolor: isNight
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(0,0,0,0.08)",
                        color: textColor,
                      }}
                    />
                  </Box>
                </Box>
                <Typography
                  sx={{
                    color: subtleColor,
                    fontSize: "0.7rem",
                    lineHeight: 1.5,
                  }}
                >
                  {crop.reason}
                </Typography>
              </Box>
            ))}
          </Box>
          {w.cropSuggestions.notRecommended?.length > 0 && (
            <Box
              sx={{
                mt: 1.5,
                ...glassStyle,
                borderRadius: 2.5,
                p: 1.5,
                borderLeft: "3px solid #EF5350",
              }}
            >
              <Typography
                sx={{
                  color: textColor,
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  mb: 0.5,
                }}
              >
                ⚠️ Avoid Right Now:
              </Typography>
              {w.cropSuggestions.notRecommended.map((item, i) => (
                <Typography
                  key={i}
                  sx={{ color: subtleColor, fontSize: "0.75rem" }}
                >
                  • {item.name}: {item.reason}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default WeatherCard;
