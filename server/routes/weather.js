const express = require("express");
const router = express.Router();

// ── In-memory cache ──
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const getCached = (key) => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
  // Evict old entries (keep cache size manageable)
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
};

// ── Smart farming recommendation engine ──
const getRecommendations = (weather, lang = "en") => {
  const recommendations = [];
  const temp = weather.main?.temp;
  const humidity = weather.main?.humidity;
  const windSpeed = weather.wind?.speed;
  const description = weather.weather?.[0]?.description?.toLowerCase() || "";
  const hasRain =
    description.includes("rain") ||
    description.includes("drizzle") ||
    description.includes("thunderstorm");
  const hasClouds =
    description.includes("cloud") || description.includes("overcast");

  const texts = {
    en: {
      rainTitle: "🌧️ Rain Expected",
      rainDesc:
        "Avoid irrigation today. Delay fertilizer and pesticide spray — rain will wash them away. Good time for transplanting seedlings.",
      heatTitle: "🌡️ High Temperature Alert",
      heatDesc:
        "Increase irrigation frequency. Avoid sowing heat-sensitive crops. Use mulching to retain soil moisture. Best to irrigate early morning or late evening.",
      humidTitle: "💧 High Humidity Warning",
      humidDesc:
        "Risk of fungal diseases (blight, mildew). Apply preventive fungicide spray. Ensure proper spacing between plants for air circulation.",
      windTitle: "💨 Strong Wind Advisory",
      windDesc:
        "Avoid spraying pesticides/fertilizers — drift will reduce effectiveness. Provide support to tall crops. Delay sowing of light seeds.",
      goodTitle: "☀️ Ideal Farming Weather",
      goodDesc:
        "Perfect conditions for sowing, fertilizer application, and field operations. Make the most of this weather window.",
      coldTitle: "❄️ Cold Weather Alert",
      coldDesc:
        "Protect nursery beds with plastic covers. Avoid irrigation during night to prevent frost damage. Apply potassium-based fertilizers to improve cold tolerance.",
    },
    hi: {
      rainTitle: "🌧️ बारिश की संभावना",
      rainDesc:
        "आज सिंचाई से बचें। उर्वरक और कीटनाशक छिड़काव में देरी करें — बारिश उन्हें बहा देगी। पौधे रोपने का अच्छा समय है।",
      heatTitle: "🌡️ अधिक तापमान चेतावनी",
      heatDesc:
        "सिंचाई बढ़ाएं। गर्मी-संवेदनशील फसलों की बुवाई से बचें। मिट्टी की नमी बनाए रखने के लिए मल्चिंग करें।",
      humidTitle: "💧 उच्च आर्द्रता चेतावनी",
      humidDesc:
        "फफूंद रोगों का खतरा। निवारक फफूंदनाशक का छिड़काव करें। हवा के संचार के लिए पौधों में उचित दूरी रखें।",
      windTitle: "💨 तेज हवा सलाह",
      windDesc:
        "कीटनाशक/उर्वरक छिड़काव से बचें। लंबी फसलों को सहारा दें। हल्के बीजों की बुवाई में देरी करें।",
      goodTitle: "☀️ खेती के लिए आदर्श मौसम",
      goodDesc:
        "बुवाई, उर्वरक और खेत के कामों के लिए उत्तम स्थिति। इस मौसम का पूरा लाभ उठाएं।",
      coldTitle: "❄️ ठंड की चेतावनी",
      coldDesc:
        "नर्सरी बेड को प्लास्टिक से ढकें। रात में सिंचाई से बचें। ठंड सहनशीलता के लिए पोटाश उर्वरक डालें।",
    },
    mr: {
      rainTitle: "🌧️ पावसाची शक्यता",
      rainDesc:
        "आज सिंचन टाळा. खत आणि कीटकनाशक फवारणीला विलंब करा — पाऊस ते वाहून नेईल. रोपे लावण्यासाठी चांगला वेळ.",
      heatTitle: "🌡️ उच्च तापमान इशारा",
      heatDesc:
        "सिंचन वाढवा. उष्णता-संवेदनशील पिकांची पेरणी टाळा. मातीतील ओलावा टिकवण्यासाठी मल्चिंग करा.",
      humidTitle: "💧 उच्च आर्द्रता इशारा",
      humidDesc:
        "बुरशीजन्य रोगांचा धोका. प्रतिबंधक बुरशीनाशक फवारणी करा. हवा खेळण्यासाठी झाडांमध्ये योग्य अंतर ठेवा.",
      windTitle: "💨 जोरदार वारा सूचना",
      windDesc:
        "कीटकनाशक/खत फवारणी टाळा. उंच पिकांना आधार द्या. हलक्या बियाण्यांची पेरणी विलंब करा.",
      goodTitle: "☀️ शेतीसाठी आदर्श हवामान",
      goodDesc:
        "पेरणी, खत आणि शेतकामासाठी उत्तम परिस्थिती. या हवामानाचा पूर्ण फायदा घ्या.",
      coldTitle: "❄️ थंडीचा इशारा",
      coldDesc:
        "रोपवाटिका प्लास्टिकने झाका. रात्री सिंचन टाळा. थंडी सहनशक्ती वाढवण्यासाठी पोटॅश खत द्या.",
    },
  };

  const t = texts[lang] || texts.en;

  if (hasRain) {
    recommendations.push({
      title: t.rainTitle,
      description: t.rainDesc,
      severity: "warning",
      icon: "rain",
    });
  }
  if (temp > 38) {
    recommendations.push({
      title: t.heatTitle,
      description: t.heatDesc,
      severity: "error",
      icon: "heat",
    });
  }
  if (temp < 10) {
    recommendations.push({
      title: t.coldTitle,
      description: t.coldDesc,
      severity: "info",
      icon: "cold",
    });
  }
  if (humidity > 80 && !hasRain) {
    recommendations.push({
      title: t.humidTitle,
      description: t.humidDesc,
      severity: "warning",
      icon: "humidity",
    });
  }
  if (windSpeed > 20) {
    recommendations.push({
      title: t.windTitle,
      description: t.windDesc,
      severity: "info",
      icon: "wind",
    });
  }
  if (
    !hasRain &&
    temp >= 20 &&
    temp <= 35 &&
    humidity <= 75 &&
    windSpeed <= 15
  ) {
    recommendations.push({
      title: t.goodTitle,
      description: t.goodDesc,
      severity: "success",
      icon: "good",
    });
  }

  return recommendations;
};

// ── Crop suggestion engine based on weather + season ──
const getCropSuggestions = (weather, lang = "en") => {
  const temp = weather.main?.temp;
  const humidity = weather.main?.humidity;
  const description = weather.weather?.[0]?.description?.toLowerCase() || "";
  const hasRain =
    description.includes("rain") ||
    description.includes("drizzle") ||
    description.includes("thunderstorm");
  const month = new Date().getMonth() + 1; // 1–12

  // Season detection (Indian agriculture calendar)
  const isKharif = month >= 6 && month <= 10; // June–October (monsoon)
  const isRabi = month >= 11 || month <= 3; // Nov–March (winter)
  const isZaid = month >= 3 && month <= 5; // March–May (summer)

  const allCrops = {
    en: {
      wheat: {
        name: "Wheat",
        emoji: "🌾",
        season: "Rabi",
        tempRange: "10-25°C",
        reason: "Cool weather is perfect for wheat germination and growth.",
      },
      rice: {
        name: "Rice",
        emoji: "🌾",
        season: "Kharif",
        tempRange: "22-32°C",
        reason: "High humidity and warmth ideal for paddy cultivation.",
      },
      maize: {
        name: "Maize",
        emoji: "🌽",
        season: "Kharif",
        tempRange: "20-30°C",
        reason: "Warm temperature promotes fast maize growth.",
      },
      cotton: {
        name: "Cotton",
        emoji: "🌿",
        season: "Kharif",
        tempRange: "25-35°C",
        reason: "High temperature and humidity suits cotton well.",
      },
      soybean: {
        name: "Soybean",
        emoji: "🫘",
        season: "Kharif",
        tempRange: "20-30°C",
        reason: "Warm and moist conditions are ideal for soybean.",
      },
      sugarcane: {
        name: "Sugarcane",
        emoji: "🎋",
        season: "Kharif",
        tempRange: "25-35°C",
        reason: "Tropical warm weather boosts sugarcane yield.",
      },
      mustard: {
        name: "Mustard",
        emoji: "🌼",
        season: "Rabi",
        tempRange: "10-25°C",
        reason: "Cool dry weather accelerates mustard oil content.",
      },
      chickpea: {
        name: "Chickpea",
        emoji: "🫘",
        season: "Rabi",
        tempRange: "15-25°C",
        reason: "Cool and low-humidity conditions suit chickpea perfectly.",
      },
      tomato: {
        name: "Tomato",
        emoji: "🍅",
        season: "Rabi",
        tempRange: "15-28°C",
        reason: "Moderate temperature helps tomato fruit set.",
      },
      onion: {
        name: "Onion",
        emoji: "🧅",
        season: "Rabi",
        tempRange: "13-24°C",
        reason: "Cool weather promotes onion bulb development.",
      },
      potato: {
        name: "Potato",
        emoji: "🥔",
        season: "Rabi",
        tempRange: "15-25°C",
        reason: "Cool moist soil is best for potato tuber formation.",
      },
      cucumber: {
        name: "Cucumber",
        emoji: "🥒",
        season: "Zaid",
        tempRange: "25-35°C",
        reason: "Warm weather with adequate irrigation suits cucumbers.",
      },
      watermelon: {
        name: "Watermelon",
        emoji: "🍉",
        season: "Zaid",
        tempRange: "28-38°C",
        reason: "Hot dry weather is excellent for sweet watermelons.",
      },
      groundnut: {
        name: "Groundnut",
        emoji: "🥜",
        season: "Kharif",
        tempRange: "25-30°C",
        reason: "Warm well-drained conditions are ideal for groundnuts.",
      },
      bajra: {
        name: "Bajra (Millet)",
        emoji: "🌾",
        season: "Kharif",
        tempRange: "25-35°C",
        reason: "Drought-tolerant; thrives in hot low-rainfall conditions.",
      },
      lentil: {
        name: "Lentil",
        emoji: "🫘",
        season: "Rabi",
        tempRange: "15-25°C",
        reason: "Cool weather after sowing helps lentil establish well.",
      },
    },
    hi: {
      wheat: {
        name: "गेहूं",
        emoji: "🌾",
        season: "रबी",
        tempRange: "10-25°C",
        reason: "ठंडा मौसम गेहूं के अंकुरण और वृद्धि के लिए आदर्श है।",
      },
      rice: {
        name: "धान",
        emoji: "🌾",
        season: "खरीफ",
        tempRange: "22-32°C",
        reason: "उच्च आर्द्रता और गर्मी धान की खेती के लिए उत्तम है।",
      },
      maize: {
        name: "मक्का",
        emoji: "🌽",
        season: "खरीफ",
        tempRange: "20-30°C",
        reason: "गर्म तापमान मक्का की तेज वृद्धि को बढ़ावा देता है।",
      },
      cotton: {
        name: "कपास",
        emoji: "🌿",
        season: "खरीफ",
        tempRange: "25-35°C",
        reason: "उच्च तापमान और आर्द्रता कपास के लिए उपयुक्त है।",
      },
      soybean: {
        name: "सोयाबीन",
        emoji: "🫘",
        season: "खरीफ",
        tempRange: "20-30°C",
        reason: "गर्म और नम परिस्थितियाँ सोयाबीन के लिए आदर्श हैं।",
      },
      sugarcane: {
        name: "गन्ना",
        emoji: "🎋",
        season: "खरीफ",
        tempRange: "25-35°C",
        reason: "उष्णकटिबंधीय गर्म मौसम गन्ने की उपज बढ़ाता है।",
      },
      mustard: {
        name: "सरसों",
        emoji: "🌼",
        season: "रबी",
        tempRange: "10-25°C",
        reason: "ठंडा और शुष्क मौसम सरसों के तेल की मात्रा बढ़ाता है।",
      },
      chickpea: {
        name: "चना",
        emoji: "🫘",
        season: "रबी",
        tempRange: "15-25°C",
        reason: "ठंडी और कम नमी वाली परिस्थितियाँ चने के लिए उत्तम हैं।",
      },
      tomato: {
        name: "टमाटर",
        emoji: "🍅",
        season: "रबी",
        tempRange: "15-28°C",
        reason: "मध्यम तापमान टमाटर में फल लगने में मदद करता है।",
      },
      onion: {
        name: "प्याज",
        emoji: "🧅",
        season: "रबी",
        tempRange: "13-24°C",
        reason: "ठंडा मौसम प्याज के बल्ब विकास को बढ़ावा देता है।",
      },
      potato: {
        name: "आलू",
        emoji: "🥔",
        season: "रबी",
        tempRange: "15-25°C",
        reason: "ठंडी नम मिट्टी आलू के कंद निर्माण के लिए सर्वोत्तम है।",
      },
      cucumber: {
        name: "खीरा",
        emoji: "🥒",
        season: "जायद",
        tempRange: "25-35°C",
        reason: "गर्म मौसम खीरे के लिए उपयुक्त है।",
      },
      watermelon: {
        name: "तरबूज",
        emoji: "🍉",
        season: "जायद",
        tempRange: "28-38°C",
        reason: "गर्म और शुष्क मौसम मीठे तरबूज के लिए उत्तम है।",
      },
      groundnut: {
        name: "मूंगफली",
        emoji: "🥜",
        season: "खरीफ",
        tempRange: "25-30°C",
        reason: "गर्म और अच्छी जल निकासी वाली स्थिति मूंगफली के लिए आदर्श है।",
      },
      bajra: {
        name: "बाजरा",
        emoji: "🌾",
        season: "खरीफ",
        tempRange: "25-35°C",
        reason: "सूखा-सहिष्णु; गर्म कम वर्षा वाली परिस्थितियों में पनपता है।",
      },
      lentil: {
        name: "मसूर",
        emoji: "🫘",
        season: "रबी",
        tempRange: "15-25°C",
        reason: "बुवाई के बाद ठंडा मौसम मसूर को अच्छे से स्थापित करता है।",
      },
    },
    mr: {
      wheat: {
        name: "गहू",
        emoji: "🌾",
        season: "रब्बी",
        tempRange: "10-25°C",
        reason: "थंड हवामान गव्हाच्या उगवण आणि वाढीसाठी आदर्श आहे।",
      },
      rice: {
        name: "भात",
        emoji: "🌾",
        season: "खरीप",
        tempRange: "22-32°C",
        reason: "उच्च आर्द्रता आणि उष्णता भातशेतीसाठी उत्तम आहे।",
      },
      maize: {
        name: "मका",
        emoji: "🌽",
        season: "खरीप",
        tempRange: "20-30°C",
        reason: "उष्ण तापमान मक्याच्या जलद वाढीला चालना देते।",
      },
      cotton: {
        name: "कापूस",
        emoji: "🌿",
        season: "खरीप",
        tempRange: "25-35°C",
        reason: "उच्च तापमान आणि आर्द्रता कापसासाठी योग्य आहे।",
      },
      soybean: {
        name: "सोयाबीन",
        emoji: "🫘",
        season: "खरीप",
        tempRange: "20-30°C",
        reason: "उबदार आणि ओलसर परिस्थिती सोयाबीनसाठी आदर्श आहे।",
      },
      sugarcane: {
        name: "ऊस",
        emoji: "🎋",
        season: "खरीप",
        tempRange: "25-35°C",
        reason: "उष्णकटिबंधीय उबदार हवामान उसाचे उत्पादन वाढवते।",
      },
      mustard: {
        name: "मोहरी",
        emoji: "🌼",
        season: "रब्बी",
        tempRange: "10-25°C",
        reason: "थंड व कोरडे हवामान मोहरीतील तेलाचे प्रमाण वाढवते।",
      },
      chickpea: {
        name: "हरभरा",
        emoji: "🫘",
        season: "रब्बी",
        tempRange: "15-25°C",
        reason: "थंड व कमी आर्द्रतेची परिस्थिती हरभऱ्यासाठी उत्तम आहे।",
      },
      tomato: {
        name: "टोमॅटो",
        emoji: "🍅",
        season: "रब्बी",
        tempRange: "15-28°C",
        reason: "मध्यम तापमान टोमॅटोला फळे लागण्यास मदत करते।",
      },
      onion: {
        name: "कांदा",
        emoji: "🧅",
        season: "रब्बी",
        tempRange: "13-24°C",
        reason: "थंड हवामान कांद्याच्या कंद विकासास चालना देते।",
      },
      potato: {
        name: "बटाटा",
        emoji: "🥔",
        season: "रब्बी",
        tempRange: "15-25°C",
        reason: "थंड ओलसर माती बटाट्याच्या कंद निर्मितीसाठी सर्वोत्तम आहे।",
      },
      cucumber: {
        name: "काकडी",
        emoji: "🥒",
        season: "उन्हाळी",
        tempRange: "25-35°C",
        reason: "उबदार हवामान काकडीसाठी योग्य आहे।",
      },
      watermelon: {
        name: "टरबूज",
        emoji: "🍉",
        season: "उन्हाळी",
        tempRange: "28-38°C",
        reason: "गरम व कोरडे हवामान गोड टरबुजासाठी उत्तम आहे।",
      },
      groundnut: {
        name: "भुईमूग",
        emoji: "🥜",
        season: "खरीप",
        tempRange: "25-30°C",
        reason: "उबदार व चांगल्या निचऱ्याची परिस्थिती भुईमुगासाठी आदर्श आहे।",
      },
      bajra: {
        name: "बाजरी",
        emoji: "🌾",
        season: "खरीप",
        tempRange: "25-35°C",
        reason: "दुष्काळ सहनशील; गरम कमी पावसाच्या परिस्थितीत वाढते।",
      },
      lentil: {
        name: "मसूर",
        emoji: "🫘",
        season: "रब्बी",
        tempRange: "15-25°C",
        reason: "पेरणीनंतर थंड हवामान मसूर चांगल्या प्रकारे रुजण्यास मदत करते।",
      },
    },
  };

  const crops = allCrops[lang] || allCrops.en;
  const suggestions = [];

  // Match crops by season + current temperature
  if (isKharif) {
    if (temp >= 22 && temp <= 32) suggestions.push(crops.rice);
    if (temp >= 20 && temp <= 30) {
      suggestions.push(crops.maize);
      suggestions.push(crops.soybean);
    }
    if (temp >= 25 && temp <= 35) {
      suggestions.push(crops.cotton);
      suggestions.push(crops.sugarcane);
      suggestions.push(crops.bajra);
    }
    if (temp >= 25 && temp <= 30) suggestions.push(crops.groundnut);
  }
  if (isRabi) {
    if (temp >= 10 && temp <= 25) {
      suggestions.push(crops.wheat);
      suggestions.push(crops.mustard);
    }
    if (temp >= 15 && temp <= 25) {
      suggestions.push(crops.chickpea);
      suggestions.push(crops.lentil);
      suggestions.push(crops.onion);
      suggestions.push(crops.potato);
    }
    if (temp >= 15 && temp <= 28) suggestions.push(crops.tomato);
  }
  if (isZaid) {
    if (temp >= 25 && temp <= 35) suggestions.push(crops.cucumber);
    if (temp >= 28) suggestions.push(crops.watermelon);
  }

  // Always-useful crops for moderate weather
  if (suggestions.length < 3 && temp >= 15 && temp <= 35) {
    if (!suggestions.includes(crops.tomato)) suggestions.push(crops.tomato);
    if (!suggestions.includes(crops.onion)) suggestions.push(crops.onion);
  }

  // Not suitable if raining heavily or extreme temp
  const notRecommended = [];
  if (hasRain)
    notRecommended.push({
      name:
        lang === "hi"
          ? "उर्वरक छिड़काव"
          : lang === "mr"
            ? "खत फवारणी"
            : "Fertilizer Spray",
      reason:
        lang === "hi"
          ? "बारिश में छिड़काव बेकार हो जाता है"
          : lang === "mr"
            ? "पावसात फवारणी वाया जाते"
            : "Rain washes away sprays — wait for dry weather",
    });
  if (temp > 40)
    notRecommended.push({
      name: lang === "hi" ? "बुवाई" : lang === "mr" ? "पेरणी" : "Sowing",
      reason:
        lang === "hi"
          ? "अत्यधिक गर्मी बीजों को नुकसान पहुंचाती है"
          : lang === "mr"
            ? "अत्याधिक उष्णता बियाण्यांना हानी करते"
            : "Extreme heat damages seed germination",
    });

  const seasonName = isKharif
    ? lang === "hi"
      ? "खरीफ"
      : lang === "mr"
        ? "खरीप"
        : "Kharif"
    : isRabi
      ? lang === "hi"
        ? "रबी"
        : lang === "mr"
          ? "रब्बी"
          : "Rabi"
      : lang === "hi"
        ? "जायद"
        : lang === "mr"
          ? "उन्हाळी"
          : "Zaid";

  return {
    season: seasonName,
    month,
    suitable: [...new Map(suggestions.map((c) => [c.name, c])).values()].slice(
      0,
      6,
    ),
    notRecommended,
  };
};

// ── GET /api/weather?lat=...&lon=...&lang=en ──
router.get("/", async (req, res) => {
  try {
    const { lat, lon, city, lang = "en" } = req.query;
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    if (!apiKey) {
      return res
        .status(500)
        .json({ success: false, message: "Weather API key not configured" });
    }

    if (!lat && !lon && !city) {
      return res
        .status(400)
        .json({ success: false, message: "Provide lat/lon or city parameter" });
    }

    // Build URL
    const params = city
      ? `q=${encodeURIComponent(city)}`
      : `lat=${lat}&lon=${lon}`;
    const cacheKey = `weather_${params}_${lang}`;

    // Check cache
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://api.openweathermap.org/data/2.5/weather?${params}&appid=${apiKey}&units=metric&lang=${lang}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?${params}&appid=${apiKey}&units=metric&lang=${lang}&cnt=8`;

    // Fetch current + forecast in parallel
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(url),
      fetch(forecastUrl),
    ]);

    if (!weatherRes.ok) {
      const errData = await weatherRes.json().catch(() => ({}));
      return res.status(weatherRes.status).json({
        success: false,
        message: errData.message || "Failed to fetch weather data",
      });
    }

    const weather = await weatherRes.json();
    const forecast = forecastRes.ok ? await forecastRes.json() : null;

    const recommendations = getRecommendations(weather, lang);
    const cropSuggestions = getCropSuggestions(weather, lang);

    const response = {
      success: true,
      data: {
        location: weather.name,
        country: weather.sys?.country,
        temperature: Math.round(weather.main?.temp),
        feelsLike: Math.round(weather.main?.feels_like),
        tempMin: Math.round(weather.main?.temp_min),
        tempMax: Math.round(weather.main?.temp_max),
        humidity: weather.main?.humidity,
        pressure: weather.main?.pressure,
        windSpeed: Math.round(weather.wind?.speed * 3.6), // m/s to km/h
        windDirection: weather.wind?.deg,
        visibility: weather.visibility
          ? Math.round(weather.visibility / 1000)
          : null,
        condition: weather.weather?.[0]?.main,
        description: weather.weather?.[0]?.description,
        icon: weather.weather?.[0]?.icon,
        sunrise: weather.sys?.sunrise,
        sunset: weather.sys?.sunset,
        forecast:
          forecast?.list?.map((f) => ({
            dt: f.dt,
            temp: Math.round(f.main?.temp),
            condition: f.weather?.[0]?.main,
            description: f.weather?.[0]?.description,
            icon: f.weather?.[0]?.icon,
            pop: Math.round((f.pop || 0) * 100), // rain probability %
          })) || [],
        recommendations,
        cropSuggestions,
      },
    };

    setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error("Weather API error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Weather service unavailable",
        details: error.message,
      });
  }
});

module.exports = router;
