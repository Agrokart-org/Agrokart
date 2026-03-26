const express = require("express");
const router = express.Router();

// ── In-memory cache ──
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (mandi data doesn't change frequently)

const getCached = (key) => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
};

// ── Indian states list for dropdown ──
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
];

// ── Common crops for quick search ──
const POPULAR_CROPS = [
  "Wheat",
  "Rice",
  "Maize",
  "Cotton",
  "Soyabean",
  "Sugarcane",
  "Onion",
  "Tomato",
  "Potato",
  "Chilli",
  "Groundnut",
  "Mustard",
  "Jowar",
  "Bajra",
  "Tur",
  "Moong",
  "Urad",
  "Gram",
  "Banana",
  "Mango",
  "Apple",
  "Garlic",
  "Ginger",
  "Turmeric",
];

// ── District → nearby districts mapping (approximate geographic neighbors) ──
const NEARBY_DISTRICTS = {
  // Maharashtra
  Pune: ["Satara", "Solapur", "Ahmednagar", "Raigad", "Kolhapur"],
  Mumbai: ["Thane", "Raigad", "Palghar", "Ratnagiri"],
  Nashik: ["Ahmednagar", "Dhule", "Jalgaon", "Aurangabad", "Pune"],
  Nagpur: ["Wardha", "Chandrapur", "Bhandara", "Amravati"],
  Aurangabad: ["Jalna", "Ahmednagar", "Beed", "Nashik"],
  // UP
  Lucknow: ["Barabanki", "Unnao", "Hardoi", "Sitapur", "Raebareli"],
  Varanasi: ["Jaunpur", "Chandauli", "Ghazipur", "Mirzapur"],
  // MP
  Bhopal: ["Sehore", "Raisen", "Vidisha", "Rajgarh"],
  Indore: ["Dewas", "Ujjain", "Dhar", "Khargone"],
  // Karnataka
  Bangalore: ["Ramanagara", "Tumkur", "Kolar", "Chikballapur"],
  Mysore: ["Mandya", "Chamarajanagar", "Hassan"],
  // Gujarat
  Ahmedabad: ["Gandhinagar", "Kheda", "Anand", "Mehsana"],
  // Rajasthan
  Jaipur: ["Dausa", "Tonk", "Sikar", "Ajmer", "Alwar"],
  // Tamil Nadu
  Chennai: ["Thiruvallur", "Kancheepuram", "Chengalpattu"],
  // Punjab
  Ludhiana: ["Jalandhar", "Moga", "Sangrur", "Patiala"],
  Amritsar: ["Tarn Taran", "Gurdaspur", "Jalandhar"],
};

// ── GET /api/mandi/detect-location?lat=...&lon=... ──
// Reverse geocodes GPS to state/district using OpenWeatherMap
router.get("/detect-location", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    if (!lat || !lon) {
      return res
        .status(400)
        .json({ success: false, message: "lat and lon are required" });
    }
    if (!apiKey) {
      return res
        .status(500)
        .json({ success: false, message: "Geocoding API key not configured" });
    }

    const cacheKey = `geo_${parseFloat(lat).toFixed(2)}_${parseFloat(lon).toFixed(2)}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    const geoRes = await fetch(url);

    if (!geoRes.ok) {
      return res
        .status(500)
        .json({ success: false, message: "Geocoding failed" });
    }

    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    }

    const location = geoData[0];
    // Map OpenWeatherMap state names to data.gov.in format
    const stateMapping = {
      Maharashtra: "Maharashtra",
      "Uttar Pradesh": "Uttar Pradesh",
      Karnataka: "Karnataka",
      "Tamil Nadu": "Tamil Nadu",
      Rajasthan: "Rajasthan",
      Gujarat: "Gujarat",
      "Madhya Pradesh": "Madhya Pradesh",
      "West Bengal": "West Bengal",
      Bihar: "Bihar",
      Punjab: "Punjab",
      Haryana: "Haryana",
      Telangana: "Telangana",
      "Andhra Pradesh": "Andhra Pradesh",
      Kerala: "Kerala",
      Odisha: "Odisha",
      Jharkhand: "Jharkhand",
      Chhattisgarh: "Chhattisgarh",
      Assam: "Assam",
      Uttarakhand: "Uttarakhand",
      Goa: "Goa",
      "National Capital Territory of Delhi": "Delhi",
      Delhi: "Delhi",
      NCT: "Delhi",
    };

    const detectedState = stateMapping[location.state] || location.state;
    // Extract district from the location name or local_names
    const detectedDistrict = location.name || "";

    const nearbyDistricts = NEARBY_DISTRICTS[detectedDistrict] || [];

    const response = {
      success: true,
      data: {
        state: detectedState,
        district: detectedDistrict,
        city: location.name,
        country: location.country,
        nearbyDistricts,
        lat: location.lat,
        lon: location.lon,
      },
    };

    setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error("Detect location error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Location detection failed",
        details: error.message,
      });
  }
});

// ── GET /api/mandi/states ──
router.get("/states", (req, res) => {
  res.json({ success: true, data: INDIAN_STATES });
});

// ── GET /api/mandi/crops ──
router.get("/crops", (req, res) => {
  res.json({ success: true, data: POPULAR_CROPS });
});

// ── Proximity scoring: 0 = exact district, 1 = nearby, 2 = same state, 3 = rest ──
const getProximityScore = (recordDistrict, userDistrict) => {
  if (!userDistrict || !recordDistrict) return 3;
  const rd = recordDistrict.toLowerCase().trim();
  const ud = userDistrict.toLowerCase().trim();
  if (rd === ud) return 0;
  const nearby = (NEARBY_DISTRICTS[userDistrict] || []).map((d) =>
    d.toLowerCase(),
  );
  if (nearby.includes(rd)) return 1;
  return 2;
};

// ── GET /api/mandi/prices?state=Maharashtra&commodity=Wheat&district=Pune&userDistrict=Pune ──
router.get("/prices", async (req, res) => {
  try {
    const {
      state,
      commodity,
      district,
      userDistrict,
      limit = 30,
      offset = 0,
    } = req.query;
    const apiKey = process.env.DATA_GOV_IN_API_KEY;

    if (!apiKey) {
      return res
        .status(500)
        .json({ success: false, message: "Mandi API key not configured" });
    }

    if (!state && !commodity) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Provide at least state or commodity",
        });
    }

    // Build filter parameters (data.gov.in uses filters[field] syntax)
    const filters = [];
    if (state)
      filters.push(`filters[state.keyword]=${encodeURIComponent(state)}`);
    if (commodity)
      filters.push(`filters[commodity]=${encodeURIComponent(commodity)}`);
    if (district)
      filters.push(`filters[district]=${encodeURIComponent(district)}`);

    const cacheKey = `mandi_${filters.join("_")}_${limit}_${offset}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    // data.gov.in AGMARKNET API
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=${limit}&offset=${offset}&${filters.join("&")}`;

    console.log("Mandi API URL:", url.replace(apiKey, "***"));
    const apiRes = await fetch(url);
    const rawData = await apiRes.json();

    if (!apiRes.ok || rawData.status === "error") {
      console.error(
        "Mandi API error:",
        apiRes.status,
        rawData.message || rawData,
      );
      return res.status(apiRes.status === 200 ? 400 : apiRes.status).json({
        success: false,
        message: rawData.message || "Failed to fetch mandi data",
      });
    }
    const records = rawData.records || [];

    const data = records.map((r) => {
      const proximityScore = getProximityScore(r.district, userDistrict);
      return {
        state: r.state,
        district: r.district,
        market: r.market,
        commodity: r.commodity,
        variety: r.variety,
        grade: r.grade,
        arrivalDate: r.arrival_date,
        minPrice: Number(r.min_price) || 0,
        maxPrice: Number(r.max_price) || 0,
        modalPrice: Number(r.modal_price) || 0,
        proximityScore,
        isNearby: proximityScore <= 1,
        isExactDistrict: proximityScore === 0,
      };
    });

    // Sort: exact district → nearby districts → rest
    if (userDistrict) {
      data.sort((a, b) => a.proximityScore - b.proximityScore);
    }

    const response = {
      success: true,
      data,
      total: rawData.total || data.length,
      count: rawData.count || data.length,
      offset: Number(offset),
      limit: Number(limit),
      userDistrict: userDistrict || null,
    };

    setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error("Mandi API error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Mandi service unavailable",
        details: error.message,
      });
  }
});

module.exports = router;
