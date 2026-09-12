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
  Buldhana: ["Akola", "Jalgaon", "Amravati", "Washim", "Jalna"],
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

// ── Standard Districts by State Fallback (ensures dropdowns are always populated) ──
const FALLBACK_DISTRICTS = {
  Maharashtra: [
    "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara",
    "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
    "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban",
    "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar",
    "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
    "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
  ],
  "Madhya Pradesh": [
    "Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas",
    "Satna", "Ratlam", "Rewa", "Sehore", "Vidisha", "Raisen", "Dhar", "Khargone"
  ],
  Gujarat: [
    "Ahmedabad", "Amreli", "Anand", "Banaskantha", "Bharuch", "Bhavnagar",
    "Gandhinagar", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mehsana",
    "Morbi", "Navsari", "Patan", "Porbandar", "Rajkot", "Surat", "Surendranagar", "Vadodara"
  ],
  Karnataka: [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
    "Bidar", "Chamarajanagar", "Chikkaballapura", "Chikkamagaluru", "Chitradurga",
    "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri",
    "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur",
    "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"
  ],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Ayodhya", "Azamgarh", "Bareilly", "Basti", "Bijnor",
    "Bulandshahr", "Ghaziabad", "Gorakhpur", "Jhansi", "Kanpur Nagar",
    "Lucknow", "Mathura", "Meerut", "Moradabad", "Muzaffarnagar", "Prayagraj", "Varanasi"
  ],
  Punjab: [
    "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka",
    "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana",
    "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Tarn Taran"
  ],
  Rajasthan: [
    "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara",
    "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur",
    "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu",
    "Jodhpur", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur",
    "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"
  ]
};

// ── Commodity Alias Normalization ──
const COMMODITY_ALIASES = {
  soybean: "Soyabean",
  soya: "Soyabean",
  soyabean: "Soyabean",
  paddy: "Rice",
  corn: "Maize",
  peanut: "Groundnut",
  chana: "Bengal Gram(Gram)(Whole)",
  gram: "Bengal Gram(Gram)(Whole)",
  tur: "Arhar (Tur/Red Gram)",
  arhar: "Arhar (Tur/Red Gram)",
  moong: "Green Gram (Moong)",
  urad: "Black Gram (Urd Beans)",
};

// ── GET /api/mandi/detect-location?lat=...&lon=... ──
// Reverse geocodes GPS to state/district using OpenWeatherMap or free Nominatim
router.get("/detect-location", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res
        .status(400)
        .json({ success: false, message: "lat and lon are required" });
    }

    const cacheKey = `geo_${parseFloat(lat).toFixed(2)}_${parseFloat(lon).toFixed(2)}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    let detectedState = "";
    let detectedDistrict = "";
    let cityName = "";
    let country = "India";

    // 1. Try OpenWeatherMap reverse geocode if key is available
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (apiKey) {
      try {
        const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
        const geoRes = await fetch(url);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            const loc = geoData[0];
            detectedState = loc.state || "";
            detectedDistrict = loc.name || "";
            cityName = loc.name || "";
            country = loc.country || "IN";
          }
        }
      } catch (err) {
        console.warn("OpenWeatherMap geocode error, falling back:", err.message);
      }
    }

    // 2. Free Nominatim OpenStreetMap fallback
    if (!detectedState) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
        const nomRes = await fetch(nominatimUrl, {
          headers: { "User-Agent": "AgroKart-Mandi/1.0 (contact@agrokart.org)" }
        });
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          const addr = nomData.address || {};
          detectedState = addr.state || "";
          detectedDistrict = addr.county || addr.state_district || addr.city || addr.town || "";
          cityName = addr.city || addr.town || addr.village || detectedDistrict;
          country = addr.country || "India";
        }
      } catch (err) {
        console.warn("Nominatim fallback geocode error:", err.message);
      }
    }

    if (!detectedState && !detectedDistrict) {
      return res.status(200).json({
        success: false,
        message: "Location could not be automatically detected. Please select state and district manually.",
      });
    }

    // Clean up district name (e.g., "Buldhana District" -> "Buldhana")
    const cleanDistrict = detectedDistrict.replace(/ district/i, "").trim();
    const nearbyDistricts = NEARBY_DISTRICTS[cleanDistrict] || [];

    const response = {
      success: true,
      data: {
        state: detectedState,
        district: cleanDistrict,
        city: cityName,
        country,
        nearbyDistricts,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      },
    };

    setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error("Detect location error:", error);
    res.status(200).json({
      success: false,
      message: "Location detection unavailable. Please select your state and district manually.",
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

// ── GET /api/mandi/districts?state=Maharashtra ──
// Returns distinct districts for a state
router.get("/districts", async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) {
      return res.status(400).json({ success: false, message: "state is required" });
    }

    const cacheKey = `districts_${state}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    if (apiKey) {
      try {
        const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=100&filters[state.keyword]=${encodeURIComponent(state)}`;
        const apiRes = await fetch(url);
        if (apiRes.ok) {
          const rawData = await apiRes.json();
          const records = rawData.records || [];
          const districts = [...new Set(records.map((r) => r.district).filter(Boolean))].sort();
          if (districts.length > 0) {
            const response = { success: true, data: districts };
            setCache(cacheKey, response);
            return res.json(response);
          }
        }
      } catch (err) {
        console.warn("data.gov.in district fetch error, using static fallback:", err.message);
      }
    }

    // Static Fallback for districts
    const fallback = FALLBACK_DISTRICTS[state] || [
      "Ahmednagar", "Buldhana", "Nagpur", "Nashik", "Pune", "Solapur"
    ];
    const response = { success: true, data: fallback.sort() };
    setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error("Districts fetch error:", error);
    const fallback = FALLBACK_DISTRICTS[req.query?.state] || [];
    res.json({ success: true, data: fallback });
  }
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

    if (!state && !commodity) {
      return res.status(400).json({
        success: false,
        message: "Provide at least state or commodity",
      });
    }

    if (!apiKey) {
      return res.status(503).json({
        success: false,
        serviceUnavailable: true,
        message: "Government Mandi (data.gov.in) live data service is currently unavailable. Live rates cannot be fetched without API gateway configuration.",
      });
    }

    // Normalize commodity with aliases (e.g. "Soybean" -> "Soyabean")
    let normalizedCommodity = commodity ? commodity.trim() : "";
    if (normalizedCommodity) {
      const alias = COMMODITY_ALIASES[normalizedCommodity.toLowerCase()];
      if (alias) normalizedCommodity = alias;
    }

    // Build filter parameters (data.gov.in uses filters[field] syntax)
    const filters = [];
    if (state) filters.push(`filters[state.keyword]=${encodeURIComponent(state)}`);
    if (normalizedCommodity) filters.push(`filters[commodity]=${encodeURIComponent(normalizedCommodity)}`);
    if (district) {
      // AGMARKNET sometimes uses "Buldana" or "Buldhana"
      const cleanDistrict = district.trim();
      filters.push(`filters[district]=${encodeURIComponent(cleanDistrict)}`);
    }

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
      return res.status(502).json({
        success: false,
        serviceUnavailable: true,
        message: rawData.message || "Government Mandi portal (AGMARKNET) is currently unreachable. Please try again later.",
      });
    }
    const records = rawData.records || [];

    const data = records.map((r) => {
      const proximityScore = getProximityScore(r.district, userDistrict || district);
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
    if (userDistrict || district) {
      data.sort((a, b) => a.proximityScore - b.proximityScore);
    }

    const response = {
      success: true,
      data,
      total: rawData.total || data.length,
      count: rawData.count || data.length,
      offset: Number(offset),
      limit: Number(limit),
      userDistrict: userDistrict || district || null,
    };

    setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error("Mandi API error:", error);
    res.status(502).json({
      success: false,
      serviceUnavailable: true,
      message: "Government Mandi service is temporarily unavailable. Please try again shortly.",
      details: error.message,
    });
  }
});

module.exports = router;
