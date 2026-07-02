import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  MenuItem,
  Button,
  Chip,
  Skeleton,
  Alert,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Pagination,
  CircularProgress,
  Divider,
  Collapse,
} from "@mui/material";
import {
  Search,
  LocationOn,
  MyLocation,
  NearMe,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { API_BASE_URL, safeFetch } from "../services/api";

const fmt = (p) => `₹${Number(p).toLocaleString("en-IN")}`;

const ProximityBadge = ({ record }) => {
  if (record.isExactDistrict)
    return (
      <Chip
        icon={<NearMe sx={{ fontSize: "11px !important" }} />}
        label="Nearest"
        size="small"
        sx={{
          bgcolor: "#E8F5E9",
          color: "#1B5E20",
          fontWeight: 700,
          fontSize: "0.65rem",
          height: 20,
          border: "1px solid #A5D6A7",
        }}
      />
    );
  if (record.isNearby)
    return (
      <Chip
        icon={<LocationOn sx={{ fontSize: "11px !important" }} />}
        label="Nearby"
        size="small"
        sx={{
          bgcolor: "#E3F2FD",
          color: "#0D47A1",
          fontWeight: 700,
          fontSize: "0.65rem",
          height: 20,
          border: "1px solid #90CAF9",
        }}
      />
    );
  return null;
};

const PriceBar = ({ min, modal, max }) => {
  const pct = Math.min(
    100,
    Math.max(0, ((modal - min) / (max - min || 1)) * 100),
  );
  return (
    <Box sx={{ mt: 1 }}>
      <Box
        sx={{
          position: "relative",
          height: 5,
          bgcolor: "#EEEEEE",
          borderRadius: 3,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg,#EF9A9A,#81C784)",
            borderRadius: 3,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: -3.5,
            height: 12,
            width: 12,
            borderRadius: "50%",
            bgcolor: "#1565C0",
            border: "2px solid white",
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            left: `calc(${pct}% - 6px)`,
          }}
        />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
        <Typography
          sx={{ fontSize: "0.68rem", color: "#E53935", fontWeight: 700 }}
        >
          {fmt(min)}
        </Typography>
        <Typography
          sx={{ fontSize: "0.72rem", color: "#1565C0", fontWeight: 900 }}
        >
          {fmt(modal)} modal
        </Typography>
        <Typography
          sx={{ fontSize: "0.68rem", color: "#2E7D32", fontWeight: 700 }}
        >
          {fmt(max)}
        </Typography>
      </Box>
    </Box>
  );
};

const MandiRatesPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [crops, setCrops] = useState([]);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedCard, setExpandedCard] = useState(null);
  const LIMIT = 20;
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError("GPS not supported");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await safeFetch(
            `${API_BASE_URL}/mandi/detect-location?lat=${latitude}&lon=${longitude}`,
          );
          const data =
            typeof res.json === "function" ? await res.json() : res.data || res;
          if (data.success) {
            setUserLocation(data.data);
            if (data.data.state) setSelectedState(data.data.state);
          } else setLocationError("Could not detect location");
        } catch {
          setLocationError("Detection failed");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationError("Location access denied.");
        setLocationLoading(false);
      },
      { timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          safeFetch(`${API_BASE_URL}/mandi/states`),
          safeFetch(`${API_BASE_URL}/mandi/crops`),
        ]);
        const sData =
          typeof sRes.json === "function"
            ? await sRes.json()
            : sRes.data || sRes;
        const cData =
          typeof cRes.json === "function"
            ? await cRes.json()
            : cRes.data || cRes;
        if (sData.success) setStates(sData.data);
        if (cData.success) setCrops(cData.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMeta();
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectLocation]);

  // Fetch districts when state changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedState) {
        setDistricts([]);
        setSelectedDistrict("");
        return;
      }
      setDistrictsLoading(true);
      setSelectedDistrict("");
      try {
        const res = await safeFetch(
          `${API_BASE_URL}/mandi/districts?state=${encodeURIComponent(selectedState)}`,
        );
        const data =
          typeof res.json === "function" ? await res.json() : res.data || res;
        if (data.success) {
          setDistricts(data.data || []);
        } else {
          setDistricts([]);
        }
      } catch {
        setDistricts([]);
      } finally {
        setDistrictsLoading(false);
      }
    };
    fetchDistricts();
  }, [selectedState]);

  const fetchPrices = useCallback(
    async (pageNum = 1) => {
      if (!selectedState && !selectedCrop) {
        setError("Please select a state or crop");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          limit: LIMIT,
          offset: (pageNum - 1) * LIMIT,
        });
        if (selectedState) params.set("state", selectedState);
        if (selectedDistrict) params.set("district", selectedDistrict);
        if (selectedCrop) params.set("commodity", selectedCrop);
        if (userLocation?.district)
          params.set("userDistrict", userLocation.district);
        const res = await safeFetch(`${API_BASE_URL}/mandi/prices?${params}`);
        const data =
          typeof res.json === "function" ? await res.json() : res.data || res;
        if (data.success) {
          setPrices(data.data);
          setTotalRecords(data.total || data.data.length);
          setPage(pageNum);
          if (!data.data.length) setError("No data found");
        } else setError(data.message || "Failed to fetch prices");
      } catch {
        setError("Service unavailable. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [selectedState, selectedDistrict, selectedCrop, userLocation],
  );

  const handleSearch = () => {
    setPage(1);
    fetchPrices(1);
  };
  const filteredPrices = searchQuery
    ? prices.filter((p) =>
        [p.commodity, p.market, p.district].some((f) =>
          f?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    : prices;
  const popularCrops = [
    "Wheat",
    "Rice",
    "Onion",
    "Tomato",
    "Soyabean",
    "Cotton",
    "Potato",
    "Maize",
    "Mustard",
    "Garlic",
  ];

  return (
    <Container
      maxWidth="lg"
      sx={{ mt: { xs: 10, sm: 12 }, mb: 8, px: { xs: 1.5, sm: 3 } }}
    >
      {/* ── HERO HEADER ── */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg,#FF8F00 0%,#F9A825 40%,#FFF9C4 100%)",
          borderRadius: 0,
          p: { xs: 3, sm: 4 },
          mb: 3,
          mx: { xs: -1.5, sm: -3 },
          mt: { xs: -7, sm: -9 },
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(255,143,0,0.25)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 140,
            height: 140,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.12)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -40,
            right: 60,
            width: 100,
            height: 100,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.08)",
          }}
        />
        <Typography
          variant="h4"
          fontWeight="900"
          color="white"
          sx={{
            textShadow: "0 2px 8px rgba(0,0,0,0.15)",
            fontSize: { xs: "1.6rem", sm: "2.2rem" },
            mb: 0.5,
          }}
        >
          🌾 Daily Mandi Rates
        </Typography>
        <Typography
          sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 500, mb: 2 }}
        >
          Real-time crop prices from mandis across India
        </Typography>

        {/* Location status pill */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {locationLoading ? (
            <Chip
              icon={<CircularProgress size={10} sx={{ color: "white" }} />}
              label="Detecting location..."
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.25)",
                color: "white",
                fontWeight: 600,
              }}
            />
          ) : userLocation ? (
            <Chip
              icon={
                <NearMe
                  sx={{
                    color: "#2E7D32 !important",
                    fontSize: "14px !important",
                  }}
                />
              }
              label={`📍 ${userLocation.city}, ${userLocation.state} — Nearby mandis sorted first`}
              size="small"
              sx={{
                bgcolor: "white",
                color: "#1B5E20",
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
          ) : (
            <Chip
              icon={<MyLocation sx={{ color: "white !important" }} />}
              label="📍 Detect my location"
              size="small"
              clickable
              onClick={detectLocation}
              sx={{
                bgcolor: "rgba(255,255,255,0.25)",
                color: "white",
                fontWeight: 600,
                "&:hover": { bgcolor: "rgba(255,255,255,0.4)" },
              }}
            />
          )}
          {locationError && (
            <Typography
              sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.75rem" }}
            >
              {locationError}
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── FILTER PANEL ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight="800"
          color="text.primary"
          mb={2}
        >
          🔍 Search Mandi Prices
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr auto",
            gap: 2,
            alignItems: "end",
            mb: 2,
          }}
        >
          <TextField
            select
            label="Select State"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            size="small"
            fullWidth
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          >
            <MenuItem value="">All States</MenuItem>
            {states.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Select District"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            size="small"
            fullWidth
            disabled={!selectedState || districtsLoading}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            helperText={
              districtsLoading
                ? "Loading districts..."
                : !selectedState
                  ? "Select a state first"
                  : ""
            }
            FormHelperTextProps={{ sx: { fontSize: "0.65rem", mt: 0.5 } }}
          >
            <MenuItem value="">All Districts</MenuItem>
            {districts.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Select Crop"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            size="small"
            fullWidth
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          >
            <MenuItem value="">All Crops</MenuItem>
            {crops.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading || (!selectedState && !selectedCrop)}
            sx={{
              height: 40,
              borderRadius: 2,
              fontWeight: 700,
              px: 3,
              bgcolor: "#FF8F00",
              "&:hover": { bgcolor: "#F57C00" },
              boxShadow: "0 4px 12px rgba(255,143,0,0.35)",
              textTransform: "none",
            }}
            startIcon={<Search />}
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </Box>

        {/* Popular crops quick select */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.8,
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ mr: 0.5 }}
          >
            Quick:
          </Typography>
          {popularCrops.map((crop) => (
            <Chip
              key={crop}
              label={crop}
              size="small"
              clickable
              onClick={() => setSelectedCrop(crop)}
              variant={selectedCrop === crop ? "filled" : "outlined"}
              color={selectedCrop === crop ? "warning" : "default"}
              sx={{
                fontWeight: selectedCrop === crop ? 700 : 500,
                fontSize: "0.72rem",
                height: 24,
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* ── ERROR ── */}
      {error && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── LOADING SKELETONS ── */}
      {loading && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)",
            gap: 2,
          }}
        >
          {[...Array(6)].map((_, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <Skeleton variant="text" width="45%" height={28} />
                <Skeleton
                  variant="rounded"
                  width={60}
                  height={20}
                  sx={{ borderRadius: 2 }}
                />
              </Box>
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton
                variant="rounded"
                height={5}
                sx={{ my: 1.5, borderRadius: 3 }}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Skeleton variant="text" width="25%" height={22} />
                <Skeleton variant="text" width="30%" height={22} />
                <Skeleton variant="text" width="25%" height={22} />
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* ── RESULTS ── */}
      {!loading && filteredPrices.length > 0 && (
        <>
          {/* Results header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Showing <strong>{filteredPrices.length}</strong> of{" "}
              <strong>{totalRecords}</strong> results
              {userLocation && (
                <>
                  {" "}
                  · sorted by distance from <strong>{userLocation.city}</strong>
                </>
              )}
            </Typography>
            <TextField
              size="small"
              placeholder="Filter results..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, fontSize: "0.85rem" },
              }}
              sx={{ width: isMobile ? "100%" : 220 }}
            />
          </Box>

          {/* Price cards grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)",
              gap: 2,
            }}
          >
            {filteredPrices.map((p, i) => {
              const isExpanded = expandedCard === i;
              const borderColor = p.isExactDistrict
                ? "#66BB6A"
                : p.isNearby
                  ? "#42A5F5"
                  : "transparent";
              const bg = p.isExactDistrict
                ? "#F9FFF9"
                : p.isNearby
                  ? "#F0F8FF"
                  : "background.paper";
              return (
                <Paper
                  key={i}
                  elevation={0}
                  onClick={() => setExpandedCard(isExpanded ? null : i)}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: "1px solid",
                    borderColor:
                      p.isExactDistrict || p.isNearby ? borderColor : "divider",
                    borderLeftWidth: p.isExactDistrict || p.isNearby ? 4 : 1,
                    bgcolor: bg,
                    "&:hover": {
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {/* Card header */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          flexWrap: "wrap",
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          fontWeight="800"
                          fontSize="1rem"
                          color="text.primary"
                        >
                          {p.commodity}
                        </Typography>
                        <ProximityBadge record={p} />
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <LocationOn
                          sx={{ fontSize: 13, color: "text.disabled" }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={500}
                        >
                          {p.market} · {p.district}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        fontWeight="900"
                        fontSize="1.3rem"
                        color="#1565C0"
                        lineHeight={1}
                      >
                        {fmt(p.modalPrice)}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        modal price
                      </Typography>
                    </Box>
                  </Box>

                  {/* Price bar */}
                  <PriceBar
                    min={p.minPrice}
                    modal={p.modalPrice}
                    max={p.maxPrice}
                  />

                  {/* Expand toggle */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                      {p.variety && p.variety !== "FAQ" && (
                        <Chip
                          label={p.variety}
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            height: 20,
                            bgcolor: "#F5F5F5",
                          }}
                        />
                      )}
                      {p.grade && (
                        <Chip
                          label={`Grade: ${p.grade}`}
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            height: 20,
                            bgcolor: "#F5F5F5",
                          }}
                        />
                      )}
                    </Box>
                    {isExpanded ? (
                      <KeyboardArrowUp
                        sx={{ color: "text.disabled", fontSize: 18 }}
                      />
                    ) : (
                      <KeyboardArrowDown
                        sx={{ color: "text.disabled", fontSize: 18 }}
                      />
                    )}
                  </Box>

                  {/* Expanded details */}
                  <Collapse in={isExpanded}>
                    <Divider sx={{ my: 1.5 }} />
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2,1fr)",
                        gap: 1,
                      }}
                    >
                      {[
                        { label: "State", value: p.state },
                        { label: "Arrival Date", value: p.arrivalDate || "—" },
                        {
                          label: "Min Price",
                          value: fmt(p.minPrice),
                          color: "#E53935",
                        },
                        {
                          label: "Max Price",
                          value: fmt(p.maxPrice),
                          color: "#2E7D32",
                        },
                      ].map((row, j) => (
                        <Box
                          key={j}
                          sx={{ bgcolor: "#F8F9FA", borderRadius: 1.5, p: 1 }}
                        >
                          <Typography
                            sx={{
                              fontSize: "0.65rem",
                              color: "text.disabled",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            {row.label}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "0.85rem",
                              fontWeight: 700,
                              color: row.color || "text.primary",
                            }}
                          >
                            {row.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </Box>

          {/* Pagination */}
          {totalRecords > LIMIT && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={Math.ceil(totalRecords / LIMIT)}
                page={page}
                onChange={(_, np) => fetchPrices(np)}
                color="primary"
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </>
      )}

      {/* ── EMPTY STATE ── */}
      {!loading && !prices.length && !error && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 4,
            textAlign: "center",
            border: "2px dashed",
            borderColor: "divider",
            bgcolor: "#FAFAFA",
          }}
        >
          <Typography sx={{ fontSize: "3.5rem", mb: 2 }}>🏪</Typography>
          <Typography
            variant="h6"
            fontWeight="800"
            color="text.secondary"
            gutterBottom
          >
            Select State &amp; Crop to View Prices
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Choose your state and a crop from the filters above to see the
            latest mandi rates — nearby mandis appear first automatically.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default MandiRatesPage;
