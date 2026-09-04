import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Typography, Box, Paper, Grid, Divider, Alert,
  useTheme, useMediaQuery, Chip, Avatar, Button, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Snackbar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from "@mui/material";
import { useTranslation } from "react-i18next";

// Material Icons
import ScienceIcon from "@mui/icons-material/Science";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DescriptionIcon from "@mui/icons-material/Description";
import LockIcon from "@mui/icons-material/Lock";
import InfoIcon from "@mui/icons-material/Info";
import CheckIcon from "@mui/icons-material/Check";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import BugReportIcon from "@mui/icons-material/BugReport";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import SpaIcon from "@mui/icons-material/Spa";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

// Services & Components
import { useCart } from "../context/CartContext";
import SoilUpload from "../components/drAgro/SoilUpload";

// Sophisticated Color Tokens (85% Neutral, 10% Green/Teal, 5% Accents)
const COLORS = {
  primary: "#087A4B",
  primaryHover: "#06633D",
  secondary: "#159A63",
  darkText: "#10231B",
  bg: "#F7FAF8",
  cardBg: "#FFFFFF",
  border: "#E3ECE7",
  subtleText: "#64748B",
  // Accents
  soilBg: "#FEF3C7", soilBorder: "#FDE68A", soilText: "#92400E",
  fertBg: "#F3E8FF", fertBorder: "#DDD6FE", fertText: "#6B21A8",
  weatherBg: "#E0F2FE", weatherBorder: "#BAE6FD", weatherText: "#0369A1",
  irrigBg: "#E0F2FE", irrigBorder: "#93C5FD", irrigText: "#1D4ED8",
  cropBg: "#ECFDF5", cropBorder: "#A7F3D0", cropText: "#047857",
  pestBg: "#FEE2E2", pestBorder: "#FCA5A5", pestText: "#991B1B",
  mandiBg: "#FFEDD5", mandiBorder: "#FED7AA", mandiText: "#C2410C"
};

// Crop-Specific Recommendations, Imagery & Stages
const CROP_CONFIG = {
  wheat: {
    label: "Wheat (गहू)",
    heroImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    stages: [
      { step: "01", stage: "Basal Application (At Sowing)", details: "Apply 100% DAP + 100% MOP + 25% Neem Coated Urea into seed furrows." },
      { step: "02", stage: "First Top Dressing (Day 21)", details: "Apply 40% Urea during Crown Root Initiation (CRI) stage with irrigation." },
      { step: "03", stage: "Second Top Dressing (Day 45)", details: "Apply remaining 35% Urea at earhead emergence stage." }
    ]
  },
  rice: {
    label: "Rice / Paddy (भात)",
    heroImage: "https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=800&q=80",
    stages: [
      { step: "01", stage: "Basal Application (At Transplanting)", details: "Incorporate 100% DAP + 100% MOP + 25% Urea into puddled soil." },
      { step: "02", stage: "Active Tillering Stage (Day 25)", details: "Broadcast 40% Urea + Zinc Sulfate 21% with shallow standing water." },
      { step: "03", stage: "Panicle Initiation Stage (Day 45)", details: "Apply remaining 35% Urea to maximize grain filling." }
    ]
  },
  cotton: {
    label: "Cotton (कापूस)",
    heroImage: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80",
    stages: [
      { step: "01", stage: "Basal Application (At Sowing)", details: "Apply 100% SSP + 50% MOP + 20% Urea in dibbled planting rows." },
      { step: "02", stage: "Square Formation Stage (Day 45)", details: "Top-dress 40% Urea + 25% MOP during vegetative growth." },
      { step: "03", stage: "Peak Flowering & Bolling (Day 75)", details: "Apply remaining 40% Urea + 25% MOP for boll retention." }
    ]
  },
  sugarcane: {
    label: "Sugarcane (ऊस)",
    heroImage: "https://images.unsplash.com/photo-1595180590890-48227b7fdfdf?auto=format&fit=crop&w=800&q=80",
    stages: [
      { step: "01", stage: "Basal Application (At Planting)", details: "Apply 50% DAP + 50% MOP + 20% Urea at furrow placement." },
      { step: "02", stage: "Formative Stage (Day 60)", details: "Top-dress 40% Urea during earthing-up operations." },
      { step: "03", stage: "Grand Growth Stage (Day 120)", details: "Apply remaining 40% Urea + 50% MOP before cane elongation." }
    ]
  },
  soybean: {
    label: "Soybean (सोयाबीन)",
    heroImage: "https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?auto=format&fit=crop&w=800&q=80",
    stages: [
      { step: "01", stage: "Basal Application (At Sowing)", details: "Apply 100% DAP + 100% MOP + Rhizobium bio-fertilizer seed treatment." },
      { step: "02", stage: "Flowering Stage (Day 30)", details: "Foliar spray of 19-19-19 NPK + micronutrients for cluster retention." },
      { step: "03", stage: "Pod Filling Stage (Day 50)", details: "Foliar spray of 0-0-50 Potassium Nitrate to enhance pod weight & oil." }
    ]
  },
  maize: {
    label: "Maize (मका)",
    heroImage: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80",
    stages: [
      { step: "01", stage: "Basal Application (At Sowing)", details: "Apply 100% DAP + 100% MOP + 25% Urea into seed beds." },
      { step: "02", stage: "Knee High Stage (Day 25)", details: "Top-dress 40% Urea around root zone before weeding." },
      { step: "03", stage: "Tasseling Stage (Day 50)", details: "Apply remaining 35% Urea prior to silking for cob growth." }
    ]
  }
};

// Certified Products Catalog
const BASE_PRODUCTS = [
  {
    id: "urea-1",
    brand: "IFFCO",
    name: "Neem Coated Urea 46% N",
    category: "Nitrogenous Fertilizer",
    rating: 4.9,
    price: 266,
    weight: "45 kg Bag",
    image: "https://5.imimg.com/data5/SELLER/Default/2023/9/344832579/OW/QZ/VI/25442526/neem-coated-urea-fertilizer.jpeg",
    reason: "Primary Nitrogen source for vegetative tiller growth."
  },
  {
    id: "dap-1",
    brand: "KRIBHCO",
    name: "DAP (Di-Ammonium Phosphate 18-46-0)",
    category: "Complex Fertilizer",
    rating: 4.8,
    price: 1350,
    weight: "50 kg Bag",
    image: "https://5.imimg.com/data5/SELLER/Default/2022/11/YI/ZF/XV/4308119/dap-fertilizer.jpg",
    reason: "Essential Phosphorus for strong root establishment."
  },
  {
    id: "mop-1",
    brand: "IPL",
    name: "MOP (Muriate of Potash 60% K2O)",
    category: "Potassic Fertilizer",
    rating: 4.7,
    price: 1700,
    weight: "50 kg Bag",
    image: "https://tiimg.tistatic.com/fp/1/007/574/mop-muriate-of-potash-fertilizer-681.jpg",
    reason: "Enhances grain filling & drought tolerance."
  }
];

// Custom Numeric Stepper Component
const NumericStepper = ({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  unit,
  error,
  decimalPlaces = 0,
  ariaLabel
}) => {
  const numVal = value === "" || value === null || value === undefined ? "" : Number(value);

  const handleIncrement = () => {
    const current = numVal === "" ? min : numVal;
    let updated = current + step;
    if (max !== undefined && updated > max) updated = max;
    if (decimalPlaces > 0) {
      updated = parseFloat(updated.toFixed(decimalPlaces));
    }
    onChange(String(updated));
  };

  const handleDecrement = () => {
    const current = numVal === "" ? min : numVal;
    let updated = current - step;
    if (updated < min) updated = min;
    if (decimalPlaces > 0) {
      updated = parseFloat(updated.toFixed(decimalPlaces));
    }
    onChange(String(updated));
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  const isMinDisabled = numVal !== "" && Number(numVal) <= min;
  const isMaxDisabled = max !== undefined && numVal !== "" && Number(numVal) >= max;

  return (
    <Box>
      <Typography variant="caption" fontWeight="700" color={COLORS.darkText} display="block" mb={0.5}>
        {label}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          border: `1px solid ${error ? "#EF4444" : COLORS.border}`,
          borderRadius: 2.5,
          bgcolor: "#FFFFFF",
          overflow: "hidden",
          transition: "border-color 0.15s ease",
          "&:focus-within": { borderColor: error ? "#EF4444" : COLORS.primary, boxShadow: "0 0 0 2px rgba(8,122,75,0.12)" }
        }}
      >
        <IconButton
          size="small"
          onClick={handleDecrement}
          disabled={isMinDisabled}
          aria-label={`Decrease ${ariaLabel || label}`}
          sx={{
            borderRadius: 0,
            px: 1.2,
            py: 1,
            color: COLORS.primary,
            "&:hover": { bgcolor: COLORS.cropBg },
            "&.Mui-disabled": { color: "#CBD5E1" }
          }}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <TextField
          variant="standard"
          value={value}
          onChange={handleInputChange}
          placeholder="—"
          inputProps={{
            style: { textAlign: "center", fontWeight: 800, fontSize: "0.95rem", color: COLORS.darkText },
            "aria-label": label
          }}
          InputProps={{ disableUnderline: true }}
          sx={{ flex: 1 }}
        />
        <IconButton
          size="small"
          onClick={handleIncrement}
          disabled={isMaxDisabled}
          aria-label={`Increase ${ariaLabel || label}`}
          sx={{
            borderRadius: 0,
            px: 1.2,
            py: 1,
            color: COLORS.primary,
            "&:hover": { bgcolor: COLORS.cropBg },
            "&.Mui-disabled": { color: "#CBD5E1" }
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Paper>
      <Box display="flex" justifyContent="space-between" mt={0.4} px={0.5}>
        <Typography variant="caption" color={error ? "#EF4444" : COLORS.subtleText} sx={{ fontSize: "0.68rem", fontWeight: error ? 700 : 500 }}>
          {error || (unit ? unit : "")}
        </Typography>
      </Box>
    </Box>
  );
};

const DrAgro = () => {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // 1. Legitimate Farm Context (STRICTLY NULL DEFAULTS BEFORE USER INPUT)
  const [farmContext, setFarmContext] = useState({
    crop: "wheat",
    cropLabel: "Wheat (गहू)",
    landArea: "3.5",
    landUnit: "Acres",
    location: "Pune, Maharashtra",
    growthStage: "Sowing Stage",
    soilType: null, // ONLY set when explicitly provided/analyzed
    soilN: null,
    soilP: null,
    soilK: null,
    soilPh: null,
    soilSource: null // 'Farmer Input' | 'Soil Report'
  });

  // 2. Step 2 Manual Inputs (STRICTLY EMPTY ON LOAD)
  const [soilOption, setSoilOption] = useState("manual"); // 'upload' | 'manual'
  const [manualInput, setManualInput] = useState({ n: "", p: "", k: "", ph: "" });
  const [inputErrors, setInputErrors] = useState({ n: null, p: null, k: null, ph: null });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 3. Recommendation Results (STRICTLY NULL ON LOAD)
  const [analysisResult, setAnalysisResult] = useState(null);

  // 4. OCR Extraction Confirmation Modal State
  const [ocrConfirmation, setOcrConfirmation] = useState(null);

  // 5. Modals & Tool States
  const [activeModal, setActiveModal] = useState(null);
  const [cropImageFile, setCropImageFile] = useState(null);
  const [cropImagePreview, setCropImagePreview] = useState(null);
  const [cropDiagResult, setCropDiagResult] = useState(null);

  // 6. Clean Farm Notes State (No Default Mock Text)
  const [farmNotes, setFarmNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");

  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Reset analysis results whenever inputs or crop/acreage change
  const handleInputChange = (field, val) => {
    setManualInput((prev) => ({ ...prev, [field]: val }));
    if (inputErrors[field]) {
      setInputErrors((prev) => ({ ...prev, [field]: null }));
    }
    // RESET STALE RESULT IMMEDIATELY ON EDIT
    if (analysisResult) {
      setAnalysisResult(null);
      setFarmContext((prev) => ({
        ...prev,
        soilN: null,
        soilP: null,
        soilK: null,
        soilPh: null,
        soilType: null,
        soilSource: null
      }));
    }
  };

  // Reset analysis when crop or landArea changes
  const handleCropOrAreaChange = (updates) => {
    setFarmContext((prev) => ({ ...prev, ...updates }));
    if (analysisResult) {
      setAnalysisResult(null);
      setFarmContext((prev) => ({
        ...prev,
        ...updates,
        soilN: null,
        soilP: null,
        soilK: null,
        soilPh: null,
        soilType: null,
        soilSource: null
      }));
    }
  };

  // HARD VALIDATION ENGINE
  const validateFormInputs = () => {
    const errors = { n: null, p: null, k: null, ph: null };
    let isValid = true;

    // Nitrogen Check
    if (!manualInput.n || String(manualInput.n).trim() === "") {
      errors.n = "Soil data required.";
      isValid = false;
    } else {
      const nVal = Number(manualInput.n);
      if (isNaN(nVal)) {
        errors.n = "Enter a valid number.";
        isValid = false;
      } else if (nVal < 0) {
        errors.n = "Value cannot be negative.";
        isValid = false;
      }
    }

    // Phosphorus Check
    if (!manualInput.p || String(manualInput.p).trim() === "") {
      errors.p = "Soil data required.";
      isValid = false;
    } else {
      const pVal = Number(manualInput.p);
      if (isNaN(pVal)) {
        errors.p = "Enter a valid number.";
        isValid = false;
      } else if (pVal < 0) {
        errors.p = "Value cannot be negative.";
        isValid = false;
      }
    }

    // Potassium Check
    if (!manualInput.k || String(manualInput.k).trim() === "") {
      errors.k = "Soil data required.";
      isValid = false;
    } else {
      const kVal = Number(manualInput.k);
      if (isNaN(kVal)) {
        errors.k = "Enter a valid number.";
        isValid = false;
      } else if (kVal < 0) {
        errors.k = "Value cannot be negative.";
        isValid = false;
      }
    }

    // Soil pH Check (HARD 0.0 - 14.0 SCALE BOUNDS)
    if (!manualInput.ph || String(manualInput.ph).trim() === "") {
      errors.ph = "Soil data required.";
      isValid = false;
    } else {
      const phVal = Number(manualInput.ph);
      if (isNaN(phVal) || phVal < 0 || phVal > 14) {
        errors.ph = "pH must be between 0 and 14.";
        isValid = false;
      }
    }

    setInputErrors(errors);
    return isValid;
  };

  // Run Soil Analysis Execution
  const handleRunSoilAnalysis = (confirmedValues = null, source = "Farmer Input", extractedSoilType = null) => {
    const targetInput = confirmedValues || manualInput;

    if (!confirmedValues) {
      const isValid = validateFormInputs();
      if (!isValid) {
        setSnackbar({
          open: true,
          message: "Please fix the highlighted validation errors before generating recommendations.",
          severity: "error"
        });
        return;
      }
    }

    setIsAnalyzing(true);

    setTimeout(() => {
      const nVal = parseFloat(targetInput.n);
      const pVal = parseFloat(targetInput.p);
      const kVal = parseFloat(targetInput.k);
      const phVal = parseFloat(targetInput.ph);

      const acreage = parseFloat(farmContext.landArea || 3.5);
      const cropConfig = CROP_CONFIG[farmContext.crop] || CROP_CONFIG.wheat;

      // Agronomic Interpretation
      const nStatus = nVal < 140 ? "Low" : nVal <= 280 ? "Optimal" : "High";
      const pStatus = pVal < 35 ? "Low" : pVal <= 70 ? "Optimal" : "High";
      const kStatus = kVal < 120 ? "Low" : kVal <= 250 ? "Optimal" : "High";
      const phStatus = phVal < 6.0 ? "Acidic" : phVal <= 7.5 ? "Optimal" : "Alkaline";

      // Dynamic Requirement Calculations
      const nReq = Math.max(0, Math.round((280 - nVal) * acreage * 0.5));
      const pReq = Math.max(0, Math.round((70 - pVal) * acreage * 0.4));
      const kReq = Math.max(0, Math.round((250 - kVal) * acreage * 0.3));

      const calculatedResult = {
        soilStatus: {
          nitrogen: `${nVal.toLocaleString()} kg/ha`,
          nitrogenStatus: nStatus,
          phosphorus: `${pVal.toLocaleString()} kg/ha`,
          phosphorusStatus: pStatus,
          potassium: `${kVal.toLocaleString()} kg/ha`,
          potassiumStatus: kStatus,
          ph: phVal.toFixed(1),
          phStatus: phStatus
        },
        nutrientPlan: [
          { nutrient: "Nitrogen (N)", current: `${nVal.toLocaleString()} kg/ha`, status: nStatus, requirement: `${nReq.toLocaleString()} kg`, fertilizer: "Neem Coated Urea (46% N)", badgeColor: COLORS.cropText, badgeBg: COLORS.cropBg },
          { nutrient: "Phosphorus (P)", current: `${pVal.toLocaleString()} kg/ha`, status: pStatus, requirement: `${pReq.toLocaleString()} kg`, fertilizer: "DAP (18-46-0)", badgeColor: COLORS.fertText, badgeBg: COLORS.fertBg },
          { nutrient: "Potassium (K)", current: `${kVal.toLocaleString()} kg/ha`, status: kStatus, requirement: `${kReq.toLocaleString()} kg`, fertilizer: "MOP (60% K2O)", badgeColor: COLORS.soilText, badgeBg: COLORS.soilBg }
        ],
        schedule: cropConfig.stages,
        recommendedProducts: BASE_PRODUCTS
      };

      const determinedSoilType = extractedSoilType || (source === "Soil Report" ? "Analyzed Soil Report" : "Farmer Input Soil Data");

      setFarmContext((prev) => ({
        ...prev,
        soilType: determinedSoilType,
        soilN: `${nVal.toLocaleString()} kg/ha`,
        soilP: `${pVal.toLocaleString()} kg/ha`,
        soilK: `${kVal.toLocaleString()} kg/ha`,
        soilPh: phVal.toFixed(1),
        soilSource: source
      }));

      setAnalysisResult(calculatedResult);
      setIsAnalyzing(false);

      const newHistory = {
        id: Date.now(),
        title: `${farmContext.cropLabel} Soil Analysis`,
        details: `${farmContext.landArea} ${farmContext.landUnit} · Verified (${source})`,
        date: new Date().toLocaleDateString()
      };
      setRecentAnalyses((prev) => [newHistory, ...prev]);

      setSnackbar({
        open: true,
        message: "Soil data verified & recommendation plan generated!",
        severity: "success"
      });
    }, 800);
  };

  // OCR Upload Callback
  const handleSoilUploadComplete = (resultData) => {
    if (resultData && resultData.originalValues) {
      setOcrConfirmation({
        n: resultData.originalValues.N || "",
        p: resultData.originalValues.P || "",
        k: resultData.originalValues.K || "",
        ph: resultData.originalValues.pH || "",
        soilType: resultData.soilType || "Clay Loam Soil"
      });
    } else {
      setSnackbar({
        open: true,
        message: "Could not reliably extract values. Please enter manually.",
        severity: "warning"
      });
      setSoilOption("manual");
    }
  };

  // Add Product to Cart
  const handleAddToCart = (prod) => {
    const cartProduct = {
      _id: prod.id,
      name: prod.name,
      price: prod.price,
      description: prod.reason,
      category: prod.category,
      imageUrl: prod.image,
      inStock: true
    };
    addToCart(cartProduct, 1);
    setSnackbar({
      open: true,
      message: `Added ${prod.name} to your AgroKart cart!`,
      severity: "success"
    });
  };

  // Crop Diagnosis Submit
  const handleRunCropDiag = () => {
    if (!cropImageFile) return;
    setCropDiagResult(null);
    setTimeout(() => {
      setCropDiagResult({
        issue: "Nitrogen Chlorosis & Mild Rust Pustules",
        confidence: "94% High Confidence",
        symptoms: "Light pale green leaves with small orange rust lesions along vein margins.",
        action: "Apply 25 kg/acre Neem Coated Urea top-dressing + spray Neem Oil 10,000 PPM."
      });
    }, 800);
  };

  const currentCropConfig = CROP_CONFIG[farmContext.crop] || CROP_CONFIG.wheat;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: COLORS.bg,
        pb: 8,
        pt: 1,
        backgroundImage: "radial-gradient(ellipse at 15% 0%, rgba(8,122,75,0.04) 0%, transparent 70%), radial-gradient(ellipse at 85% 30%, rgba(3,105,161,0.03) 0%, transparent 60%)"
      }}
    >

      {/* BRAND HEADER */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: COLORS.cardBg,
          borderBottom: `1px solid ${COLORS.border}`,
          py: 1.8,
          px: { xs: 2.5, md: 4 },
          mb: 3,
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}
      >
        <Container maxWidth="xl" disableGutters sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: COLORS.primary, width: 44, height: 44, boxShadow: "0 4px 12px rgba(8,122,75,0.25)" }}>
              <AgricultureIcon sx={{ color: "#FFFFFF", fontSize: 24 }} />
            </Avatar>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight="800" sx={{ color: COLORS.darkText, letterSpacing: -0.3, lineHeight: 1.1, fontSize: "1.2rem" }}>
                  Dr. Agro
                </Typography>
                <Chip
                  icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#10B981" }} />}
                  label="AI ONLINE"
                  size="small"
                  sx={{ bgcolor: COLORS.cropBg, color: COLORS.cropText, fontWeight: 700, fontSize: "0.68rem", height: 20, border: `1px solid ${COLORS.cropBorder}` }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: COLORS.subtleText, fontWeight: 600 }}>
                AI Farm Intelligence & Decision Support Workspace
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {/* Active Context Pill */}
            <Paper
              elevation={0}
              onClick={() => setActiveModal("editContext")}
              sx={{
                px: 2,
                py: 0.7,
                borderRadius: 4,
                bgcolor: "#F1F5F9",
                border: `1px solid ${COLORS.border}`,
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                transition: "all 0.15s ease",
                "&:hover": { bgcolor: "#E2E8F0", borderColor: COLORS.primary }
              }}
            >
              <Typography variant="caption" fontWeight="700" color={COLORS.primary}>
                🌾 {farmContext.cropLabel} · {farmContext.landArea} {farmContext.landUnit} · {farmContext.location}
              </Typography>
              <EditIcon sx={{ fontSize: 13, color: COLORS.subtleText }} />
            </Paper>

            {/* Language Switcher */}
            <Box display="flex" bgcolor="#F1F5F9" borderRadius={2} p={0.3} border={`1px solid ${COLORS.border}`}>
              {["en", "hi", "mr"].map((lang) => (
                <Box
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  sx={{
                    px: 1.4, py: 0.4, borderRadius: 1.5, cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
                    bgcolor: i18n.language === lang ? COLORS.cardBg : "transparent",
                    color: i18n.language === lang ? COLORS.primary : COLORS.subtleText,
                    boxShadow: i18n.language === lang ? "0 2px 4px rgba(0,0,0,0.06)" : "none"
                  }}
                >
                  {lang.toUpperCase()}
                </Box>
              ))}
            </Box>

            {isMobile && (
              <IconButton onClick={() => setActiveModal("editContext")} sx={{ color: COLORS.primary }}>
                <InfoIcon />
              </IconButton>
            )}
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={3.5}>

          {/* MAIN WORKSPACE COLUMN */}
          <Grid item xs={12} lg={8.3}>

            {/* HERO BANNER */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                bgcolor: COLORS.cardBg,
                border: `1px solid ${COLORS.border}`,
                overflow: "hidden",
                mb: 3.5,
                boxShadow: "0 4px 16px rgba(0,0,0,0.02)"
              }}
            >
              <Grid container alignItems="center">
                <Grid item xs={12} md={7.5} sx={{ p: { xs: 3, sm: 4 } }}>
                  <Typography variant="caption" fontWeight="800" color={COLORS.primary} letterSpacing={1} display="block" mb={0.5}>
                    DR. AGRO FARM INTELLIGENCE
                  </Typography>
                  <Typography variant="h4" fontWeight="800" color={COLORS.darkText} sx={{ letterSpacing: -0.5, lineHeight: 1.2, mb: 1.2, fontSize: { xs: "1.5rem", sm: "1.9rem" } }}>
                    Your farm. Smarter decisions.
                  </Typography>
                  <Typography variant="body2" color={COLORS.subtleText} sx={{ lineHeight: 1.6, mb: 2.5, maxWidth: 520 }}>
                    Get personalized insights for your crop, soil and farm.
                  </Typography>

                  <Chip
                    icon={<SpaIcon sx={{ fontSize: "14px !important", color: `${COLORS.primary} !important` }} />}
                    label={`🌾 Active Context: ${farmContext.cropLabel} · ${farmContext.landArea} ${farmContext.landUnit} · ${farmContext.location}`}
                    size="small"
                    sx={{ bgcolor: COLORS.cropBg, color: COLORS.cropText, fontWeight: 700, fontSize: "0.75rem", py: 1.8, px: 0.5, border: `1px solid ${COLORS.cropBorder}` }}
                  />
                </Grid>

                <Grid item xs={12} md={4.5} sx={{ display: { xs: "none", md: "block" }, p: 2 }}>
                  <Box sx={{ height: 190, borderRadius: 3, overflow: "hidden", position: "relative", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
                    <img src={currentCropConfig.heroImage} alt={currentCropConfig.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,122,75,0.15) 0%, rgba(16,35,27,0.4) 100%)" }} />
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* STEP PROGRESS INDICATOR */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, mb: 3.5 }}>
              <Grid container alignItems="center" spacing={1}>
                {[
                  { num: 1, title: "Select Crop", active: true, done: true },
                  { num: 2, title: "Analyze Soil", active: true, done: Boolean(analysisResult) },
                  { num: 3, title: "Get Recommendations", active: Boolean(analysisResult), done: Boolean(analysisResult) }
                ].map((step, idx) => (
                  <React.Fragment key={idx}>
                    <Grid item xs={3.5} sm={3.6}>
                      <Box display="flex" alignItems="center" gap={1.2}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: step.done ? COLORS.primary : step.active ? COLORS.primary : "#E2E8F0",
                            color: step.active || step.done ? "#FFFFFF" : COLORS.subtleText,
                            fontWeight: 800,
                            fontSize: "0.85rem"
                          }}
                        >
                          {step.done ? <CheckIcon sx={{ fontSize: 18 }} /> : step.num}
                        </Avatar>
                        <Box>
                          <Typography variant="caption" fontWeight="800" color={step.active || step.done ? COLORS.darkText : COLORS.subtleText} display="block" sx={{ lineHeight: 1.1 }}>
                            STEP 0{step.num}
                          </Typography>
                          <Typography variant="subtitle2" fontWeight="700" color={step.active || step.done ? COLORS.primary : COLORS.subtleText} noWrap sx={{ fontSize: "0.82rem" }}>
                            {step.title}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    {idx < 2 && (
                      <Grid item xs={0.5} sm={0.6}>
                        <Divider sx={{ borderColor: step.done ? COLORS.primary : COLORS.border, borderBottomWidth: 2 }} />
                      </Grid>
                    )}
                  </React.Fragment>
                ))}
              </Grid>
            </Paper>

            {/* STEP 1: SELECT CROP & ACREAGE */}
            <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 4, bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, mb: 3.5 }}>
              <Box display="flex" alignItems="center" gap={1.2} mb={2}>
                <Avatar sx={{ bgcolor: COLORS.primary, width: 28, height: 28, fontSize: "0.85rem", fontWeight: 800 }}>1</Avatar>
                <Typography variant="h6" fontWeight="800" color={COLORS.darkText}>
                  Select Crop & Land Area
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={7}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Crop"
                    value={farmContext.crop}
                    onChange={(e) => {
                      const val = e.target.value;
                      const labels = { wheat: "Wheat (गहू)", rice: "Rice / Paddy (भात)", cotton: "Cotton (कापूस)", sugarcane: "Sugarcane (ऊस)", soybean: "Soybean (सोयाबीन)", maize: "Maize (मका)" };
                      handleCropOrAreaChange({ crop: val, cropLabel: labels[val] || val });
                    }}
                    SelectProps={{ native: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  >
                    <option value="wheat">🌾 Wheat (गहू)</option>
                    <option value="rice">🍚 Rice / Paddy (भात)</option>
                    <option value="cotton">☁️ Cotton (कापूस)</option>
                    <option value="sugarcane">🎋 Sugarcane (ऊस)</option>
                    <option value="soybean">🌱 Soybean (सोयाबीन)</option>
                    <option value="maize">🌽 Maize (मका)</option>
                  </TextField>
                </Grid>

                <Grid item xs={7} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Farm Area"
                    type="number"
                    value={farmContext.landArea}
                    onChange={(e) => handleCropOrAreaChange({ landArea: e.target.value })}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  />
                </Grid>

                <Grid item xs={5} sm={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Unit"
                    value={farmContext.landUnit}
                    onChange={(e) => handleCropOrAreaChange({ landUnit: e.target.value })}
                    SelectProps={{ native: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  >
                    <option value="Acres">Acres</option>
                    <option value="Hectares">Hectares</option>
                    <option value="Gunthas">Gunthas</option>
                  </TextField>
                </Grid>
              </Grid>
            </Paper>

            {/* STEP 2: ANALYZE SOIL (NUMERIC STEPPER CONTROLS ENFORCED) */}
            <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 4, bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, mb: 3.5 }}>
              <Box display="flex" alignItems="center" gap={1.2} mb={0.5}>
                <Avatar sx={{ bgcolor: COLORS.primary, width: 28, height: 28, fontSize: "0.85rem", fontWeight: 800 }}>2</Avatar>
                <Typography variant="h6" fontWeight="800" color={COLORS.darkText}>
                  Understand Your Soil
                </Typography>
              </Box>
              <Typography variant="caption" color={COLORS.subtleText} display="block" mb={2.5}>
                Upload a soil report or adjust your values using numeric steppers.
              </Typography>

              {/* Option Tabs */}
              <Box display="flex" bgcolor="#F1F5F9" borderRadius={2.5} p={0.5} mb={3} border={`1px solid ${COLORS.border}`}>
                <Box
                  onClick={() => setSoilOption("upload")}
                  sx={{
                    flex: 1, py: 1.2, textAlign: "center", borderRadius: 2, cursor: "pointer",
                    bgcolor: soilOption === "upload" ? COLORS.cardBg : "transparent",
                    boxShadow: soilOption === "upload" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="800" color={soilOption === "upload" ? COLORS.primary : COLORS.subtleText}>
                    📁 Option A — Upload Soil Test Report (PDF/JPG)
                  </Typography>
                </Box>
                <Box
                  onClick={() => setSoilOption("manual")}
                  sx={{
                    flex: 1, py: 1.2, textAlign: "center", borderRadius: 2, cursor: "pointer",
                    bgcolor: soilOption === "manual" ? COLORS.cardBg : "transparent",
                    boxShadow: soilOption === "manual" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="800" color={soilOption === "manual" ? COLORS.primary : COLORS.subtleText}>
                    ✏️ Option B — Enter Soil Parameters Manually
                  </Typography>
                </Box>
              </Box>

              {soilOption === "upload" ? (
                <SoilUpload
                  onAnalysisComplete={handleSoilUploadComplete}
                  onSwitchToManual={() => setSoilOption("manual")}
                  selectedCrop={farmContext.crop}
                />
              ) : (
                <Box>
                  <Grid container spacing={2} mb={2.5}>
                    <Grid item xs={12} sm={3}>
                      <NumericStepper
                        label="Nitrogen (N)"
                        value={manualInput.n}
                        onChange={(val) => handleInputChange("n", val)}
                        step={1}
                        min={0}
                        unit="kg/ha"
                        error={inputErrors.n}
                        ariaLabel="Nitrogen"
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <NumericStepper
                        label="Phosphorus (P)"
                        value={manualInput.p}
                        onChange={(val) => handleInputChange("p", val)}
                        step={1}
                        min={0}
                        unit="kg/ha"
                        error={inputErrors.p}
                        ariaLabel="Phosphorus"
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <NumericStepper
                        label="Potassium (K)"
                        value={manualInput.k}
                        onChange={(val) => handleInputChange("k", val)}
                        step={1}
                        min={0}
                        unit="kg/ha"
                        error={inputErrors.k}
                        ariaLabel="Potassium"
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <NumericStepper
                        label="Soil pH"
                        value={manualInput.ph}
                        onChange={(val) => handleInputChange("ph", val)}
                        step={0.1}
                        min={0.0}
                        max={14.0}
                        decimalPlaces={1}
                        unit="0.0 – 14.0"
                        error={inputErrors.ph}
                        ariaLabel="Soil pH"
                      />
                    </Grid>
                  </Grid>

                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => handleRunSoilAnalysis(null, "Farmer Input")}
                    disabled={isAnalyzing}
                    endIcon={!isAnalyzing && <ArrowForwardIcon />}
                    sx={{
                      bgcolor: COLORS.primary,
                      color: "white",
                      fontWeight: 800,
                      borderRadius: 3,
                      px: 4,
                      py: 1.3,
                      boxShadow: "0 4px 14px rgba(8,122,75,0.25)",
                      "&:hover": { bgcolor: COLORS.primaryHover, transform: "translateY(-1px)" },
                      transition: "all 0.15s ease"
                    }}
                  >
                    {isAnalyzing ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Analyze Soil & Compute Plan →"}
                  </Button>
                </Box>
              )}
            </Paper>

            {/* STEP 3: GET RECOMMENDATIONS */}
            <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 4, bgcolor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, mb: 3.5 }}>
              <Box display="flex" alignItems="center" gap={1.2} mb={2}>
                <Avatar sx={{ bgcolor: analysisResult ? COLORS.primary : "#94A3B8", width: 28, height: 28, fontSize: "0.85rem", fontWeight: 800 }}>3</Avatar>
                <Typography variant="h6" fontWeight="800" color={COLORS.darkText}>
                  Your Dr. Agro Plan
                </Typography>
              </Box>

              {/* Checklist Status Chips */}
              <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
                <Chip icon={<CheckIcon sx={{ fontSize: "14px !important", color: analysisResult ? `${COLORS.primary} !important` : `${COLORS.subtleText} !important` }} />} label="Nutrient Status" size="small" sx={{ bgcolor: analysisResult ? COLORS.cropBg : "#F1F5F9", color: analysisResult ? COLORS.primary : COLORS.subtleText, fontWeight: 700 }} />
                <Chip icon={<CheckIcon sx={{ fontSize: "14px !important", color: analysisResult ? `${COLORS.primary} !important` : `${COLORS.subtleText} !important` }} />} label="Fertilizer Plan" size="small" sx={{ bgcolor: analysisResult ? COLORS.cropBg : "#F1F5F9", color: analysisResult ? COLORS.primary : COLORS.subtleText, fontWeight: 700 }} />
                <Chip icon={<CheckIcon sx={{ fontSize: "14px !important", color: analysisResult ? `${COLORS.primary} !important` : `${COLORS.subtleText} !important` }} />} label="Application Schedule" size="small" sx={{ bgcolor: analysisResult ? COLORS.cropBg : "#F1F5F9", color: analysisResult ? COLORS.primary : COLORS.subtleText, fontWeight: 700 }} />
                <Chip icon={<CheckIcon sx={{ fontSize: "14px !important", color: analysisResult ? `${COLORS.primary} !important` : `${COLORS.subtleText} !important` }} />} label="Product Recommendations" size="small" sx={{ bgcolor: analysisResult ? COLORS.cropBg : "#F1F5F9", color: analysisResult ? COLORS.primary : COLORS.subtleText, fontWeight: 700 }} />
              </Box>

              {/* Pending State */}
              {!analysisResult ? (
                <Paper elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: "#F8FAFC", borderRadius: 3, border: "1px dashed #CBD5E1" }}>
                  <LockIcon sx={{ fontSize: 38, color: "#94A3B8", mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight="700" color="#334155">
                    No Soil Analysis Generated Yet
                  </Typography>
                  <Typography variant="caption" color="#64748B">
                    Enter or upload your soil data in Step 2 to compute a personalized plan.
                  </Typography>
                </Paper>
              ) : (
                /* Dynamic Recommendation Analytical Report */
                <Box>

                  {/* Metric Status Mini Cards */}
                  <Typography variant="subtitle2" fontWeight="800" color={COLORS.darkText} mb={1.5}>
                    Your Soil Profile ({farmContext.cropLabel} · {farmContext.landArea} {farmContext.landUnit})
                  </Typography>
                  <Grid container spacing={1.5} mb={3}>
                    <Grid item xs={6} sm={3}>
                      <Box p={1.5} borderRadius={2.5} bgcolor={COLORS.cropBg} border={`1px solid ${COLORS.cropBorder}`}>
                        <Typography variant="caption" color={COLORS.subtleText} fontWeight="700" display="block">NITROGEN (N)</Typography>
                        <Typography variant="subtitle1" fontWeight="800" color={COLORS.cropText}>{analysisResult.soilStatus.nitrogen}</Typography>
                        <Typography variant="caption" fontWeight="800" color={COLORS.cropText}>● {analysisResult.soilStatus.nitrogenStatus}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box p={1.5} borderRadius={2.5} bgcolor={COLORS.fertBg} border={`1px solid ${COLORS.fertBorder}`}>
                        <Typography variant="caption" color={COLORS.subtleText} fontWeight="700" display="block">PHOSPHORUS (P)</Typography>
                        <Typography variant="subtitle1" fontWeight="800" color={COLORS.fertText}>{analysisResult.soilStatus.phosphorus}</Typography>
                        <Typography variant="caption" fontWeight="800" color={COLORS.fertText}>● {analysisResult.soilStatus.phosphorusStatus}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box p={1.5} borderRadius={2.5} bgcolor={COLORS.soilBg} border={`1px solid ${COLORS.soilBorder}`}>
                        <Typography variant="caption" color={COLORS.subtleText} fontWeight="700" display="block">POTASSIUM (K)</Typography>
                        <Typography variant="subtitle1" fontWeight="800" color={COLORS.soilText}>{analysisResult.soilStatus.potassium}</Typography>
                        <Typography variant="caption" fontWeight="800" color={COLORS.soilText}>● {analysisResult.soilStatus.potassiumStatus}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box p={1.5} borderRadius={2.5} bgcolor={COLORS.weatherBg} border={`1px solid ${COLORS.weatherBorder}`}>
                        <Typography variant="caption" color={COLORS.subtleText} fontWeight="700" display="block">SOIL pH</Typography>
                        <Typography variant="subtitle1" fontWeight="800" color={COLORS.weatherText}>{analysisResult.soilStatus.ph}</Typography>
                        <Typography variant="caption" fontWeight="800" color={COLORS.weatherText}>● {analysisResult.soilStatus.phStatus}</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Nutrient Table (RIGHT-ALIGNED NUMERIC COLUMNS) */}
                  <Typography variant="subtitle2" fontWeight="800" color={COLORS.darkText} mb={1}>
                    Nutrient Plan (What your soil needs & What to apply)
                  </Typography>
                  <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 3, mb: 3 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Nutrient Element</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Current Level</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Calculated Need</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Recommended Input</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analysisResult.nutrientPlan.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell fontWeight="700">{row.nutrient}</TableCell>
                            <TableCell align="right">{row.current}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: COLORS.primary }}>{row.requirement}</TableCell>
                            <TableCell>
                              <Chip label={row.fertilizer} size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, bgcolor: row.badgeBg, color: row.badgeColor }} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Crop-Specific Timeline */}
                  <Typography variant="subtitle2" fontWeight="800" color={COLORS.darkText} mb={1.5}>
                    Recommended Application Schedule ({farmContext.cropLabel})
                  </Typography>
                  <Box sx={{ position: "relative", pl: 3, mb: 3.5, borderLeft: `2px solid ${COLORS.primary}` }}>
                    {analysisResult.schedule.map((item, idx) => (
                      <Box key={idx} sx={{ position: "relative", mb: idx === analysisResult.schedule.length - 1 ? 0 : 2 }}>
                        <Avatar
                          sx={{
                            width: 14,
                            height: 14,
                            bgcolor: COLORS.primary,
                            position: "absolute",
                            left: -31,
                            top: 4,
                            border: "3px solid #FFFFFF"
                          }}
                        />
                        <Typography variant="subtitle2" fontWeight="800" color={COLORS.primary}>
                          {item.stage}
                        </Typography>
                        <Typography variant="body2" color="#334155" sx={{ fontSize: "0.85rem" }}>
                          {item.details}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Product Cards */}
                  <Typography variant="subtitle2" fontWeight="800" color={COLORS.darkText} mb={1.5}>
                    Recommended Inputs on AgroKart
                  </Typography>
                  <Grid container spacing={2}>
                    {analysisResult.recommendedProducts.map((prod) => (
                      <Grid item xs={12} sm={4} key={prod.id}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            border: `1px solid ${COLORS.border}`,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            height: "100%",
                            transition: "all 0.15s ease",
                            "&:hover": { borderColor: COLORS.primary, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }
                          }}
                        >
                          <Box>
                            <Box sx={{ height: 110, borderRadius: 2, bgcolor: "#FFFFFF", p: 0.5, mb: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <img src={prod.image} alt={prod.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                            </Box>
                            <Chip label="RECOMMENDED BY DR. AGRO" size="small" sx={{ height: 16, fontSize: "0.58rem", fontWeight: 800, bgcolor: COLORS.cropBg, color: COLORS.cropText, mb: 0.5 }} />
                            <Typography variant="subtitle2" fontWeight="800" color={COLORS.darkText} noWrap>{prod.name}</Typography>
                            <Typography variant="caption" color={COLORS.subtleText} display="block" mb={1}>{prod.reason}</Typography>
                          </Box>

                          <Box display="flex" alignItems="center" justifyContent="space-between" pt={1} borderTop={`1px solid ${COLORS.border}`}>
                            <Typography variant="subtitle2" fontWeight="800" color={COLORS.primary}>₹{prod.price}</Typography>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleAddToCart(prod)}
                              startIcon={<ShoppingCartIcon sx={{ fontSize: "14px !important" }} />}
                              sx={{ bgcolor: COLORS.primary, borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: "0.75rem", "&:hover": { bgcolor: COLORS.primaryHover } }}
                            >
                              Add to Cart
                            </Button>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Paper>

            {/* OTHER AI TOOLS GRID */}
            <Box mb={3.5}>
              <Typography variant="h6" fontWeight="800" color={COLORS.darkText} mb={1.5}>
                Other AI Tools & Services
              </Typography>
              <Grid container spacing={2}>
                {[
                  { id: "cropDiag", icon: <SpaIcon sx={{ color: COLORS.cropText }} />, title: "Crop Diagnosis", desc: "Upload crop photo to identify disease symptoms.", bg: COLORS.cropBg, border: COLORS.cropBorder, color: COLORS.cropText, action: () => setActiveModal("cropDiag") },
                  { id: "fertilizerCalc", icon: <ScienceIcon sx={{ color: COLORS.fertText }} />, title: "Fertilizer Calculator", desc: "Calculate split N-P-K fertilizer dosage.", bg: COLORS.fertBg, border: COLORS.fertBorder, color: COLORS.fertText, action: () => setActiveModal("fertilizerCalc") },
                  { id: "weatherAdv", icon: <WbSunnyIcon sx={{ color: COLORS.weatherText }} />, title: "Weather Advisory", desc: "Local agricultural weather forecast.", bg: COLORS.weatherBg, border: COLORS.weatherBorder, color: COLORS.weatherText, action: () => navigate("/customer/dr-agro/weather") },
                  { id: "irrigationAdv", icon: <WaterDropIcon sx={{ color: COLORS.irrigText }} />, title: "Irrigation Advisor", desc: "Critical irrigation timing advice.", bg: COLORS.irrigBg, border: COLORS.irrigBorder, color: COLORS.irrigText, action: () => setActiveModal("irrigation") },
                  { id: "pestDisease", icon: <BugReportIcon sx={{ color: COLORS.pestText }} />, title: "Pest & Disease", desc: "Identify pest vectors & treatment measures.", bg: COLORS.pestBg, border: COLORS.pestBorder, color: COLORS.pestText, action: () => setActiveModal("pest") },
                  { id: "mandiRates", icon: <CurrencyRupeeIcon sx={{ color: COLORS.mandiText }} />, title: "Mandi Prices", desc: "Check live crop prices across local mandis.", bg: COLORS.mandiBg, border: COLORS.mandiBorder, color: COLORS.mandiText, action: () => navigate("/customer/mandi-rates") },
                ].map((tool) => (
                  <Grid item xs={12} sm={6} md={4} key={tool.id}>
                    <Paper
                      elevation={0}
                      onClick={tool.action}
                      sx={{
                        p: 2.2,
                        borderRadius: 3,
                        bgcolor: tool.bg,
                        border: `1px solid ${tool.border}`,
                        cursor: "pointer",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "all 0.15s ease-in-out",
                        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }
                      }}
                    >
                      <Box>
                        <Avatar sx={{ bgcolor: "#FFFFFF", width: 36, height: 36, mb: 1, boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
                          {tool.icon}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight="800" color={tool.color} mb={0.3}>
                          {tool.title}
                        </Typography>
                        <Typography variant="caption" color="#475569" sx={{ lineHeight: 1.3, display: "block" }}>
                          {tool.desc}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5} mt={1.5} color={tool.color}>
                        <Typography variant="caption" fontWeight="800">Launch Tool</Typography>
                        <ArrowForwardIcon sx={{ fontSize: 13 }} />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* RECENT ANALYSES */}
            <Box mb={4}>
              <Typography variant="h6" fontWeight="800" color={COLORS.darkText} mb={1.5}>
                Recent Analyses
              </Typography>

              {recentAnalyses.length === 0 ? (
                <Paper elevation={0} sx={{ p: 3, textAlign: "center", bgcolor: COLORS.cardBg, borderRadius: 3, border: `1px solid ${COLORS.border}` }}>
                  <DescriptionIcon sx={{ fontSize: 36, color: "#94A3B8", mb: 0.5 }} />
                  <Typography variant="subtitle2" fontWeight="700" color="#334155">No analyses yet</Typography>
                  <Typography variant="caption" color={COLORS.subtleText}>Your completed farm analyses will appear here.</Typography>
                </Paper>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {recentAnalyses.map((item) => (
                    <Paper key={item.id} elevation={0} sx={{ p: 2, borderRadius: 3, border: `1px solid ${COLORS.border}`, bgcolor: COLORS.cardBg, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: COLORS.cropBg, color: COLORS.primary }}><CheckCircleIcon /></Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="800" color={COLORS.darkText}>{item.title}</Typography>
                          <Typography variant="caption" color={COLORS.subtleText}>{item.details} · {item.date}</Typography>
                        </Box>
                      </Box>
                      <Chip label="Verified" size="small" sx={{ bgcolor: COLORS.cropBg, color: COLORS.primary, fontWeight: 700 }} />
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>

          </Grid>

          {/* FAR-RIGHT UNIFIED FARM INTELLIGENCE PANEL */}
          <Grid item xs={12} lg={3.7}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                bgcolor: COLORS.cardBg,
                border: `1px solid ${COLORS.border}`,
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                position: { lg: "sticky" },
                top: { lg: 90 },
                display: "flex",
                flexDirection: "column",
                gap: 2.5
              }}
            >
              {/* HEADER */}
              <Box display="flex" alignItems="center" justifyContent="space-between" pb={1.5} borderBottom={`1px solid ${COLORS.border}`}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="800" color={COLORS.darkText} sx={{ lineHeight: 1.1 }}>
                    FARM INTELLIGENCE
                  </Typography>
                  <Typography variant="caption" color={COLORS.subtleText} fontWeight="600">
                    Your current farm context
                  </Typography>
                </Box>
                <Chip
                  icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#10B981" }} />}
                  label="LIVE"
                  size="small"
                  sx={{ height: 20, fontSize: "0.62rem", fontWeight: 800, bgcolor: COLORS.cropBg, color: COLORS.cropText, border: `1px solid ${COLORS.cropBorder}` }}
                />
              </Box>

              {/* MODULE 1 — CURRENT FARM CONTEXT */}
              <Box pb={2} borderBottom={`1px solid ${COLORS.border}`}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2.5,
                      bgcolor: COLORS.cropBg,
                      border: `1px solid ${COLORS.cropBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem"
                    }}
                  >
                    🌾
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="800" color={COLORS.darkText}>
                      {farmContext.cropLabel}
                    </Typography>
                    <Typography variant="caption" fontWeight="700" color={COLORS.primary} display="block">
                      {farmContext.landArea} {farmContext.landUnit} · {farmContext.growthStage}
                    </Typography>
                    <Typography variant="caption" color={COLORS.subtleText}>
                      📍 {farmContext.location}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* MODULE 2 — WEATHER TODAY BLOCK */}
              <Box p={2} borderRadius={3} bgcolor="#F0F9FF" border="1px solid #BAE6FD">
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" fontWeight="800" color={COLORS.weatherText} letterSpacing={0.5}>
                    ☀️ WEATHER TODAY
                  </Typography>
                  <Button size="small" onClick={() => navigate("/customer/dr-agro/weather")} sx={{ fontSize: "0.68rem", p: 0, minWidth: 0, textTransform: "none", color: COLORS.weatherText, fontWeight: 700 }}>
                    Forecast →
                  </Button>
                </Box>
                <Typography variant="h5" fontWeight="800" color={COLORS.weatherText}>28°C</Typography>
                <Typography variant="caption" fontWeight="600" color="#334155" display="block" mb={1}>Partly Cloudy</Typography>
                <Grid container spacing={1} textAlign="left">
                  <Grid item xs={4}>
                    <Typography variant="caption" color={COLORS.subtleText} display="block" sx={{ fontSize: "0.68rem" }}>Humidity</Typography>
                    <Typography variant="caption" fontWeight="800" color={COLORS.darkText}>65%</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color={COLORS.subtleText} display="block" sx={{ fontSize: "0.68rem" }}>Rain Prob</Typography>
                    <Typography variant="caption" fontWeight="800" color={COLORS.darkText}>20%</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color={COLORS.subtleText} display="block" sx={{ fontSize: "0.68rem" }}>Wind</Typography>
                    <Typography variant="caption" fontWeight="800" color={COLORS.darkText}>12 km/h</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* MODULE 3 — SOIL HEALTH METRICS */}
              <Box pb={2} borderBottom={`1px solid ${COLORS.border}`}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.2}>
                  <Typography variant="subtitle2" fontWeight="800" color={COLORS.darkText}>
                    Soil Health
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => {
                      setSoilOption("manual");
                      window.scrollTo({ top: 350, behavior: "smooth" });
                    }}
                    sx={{ fontSize: "0.7rem", p: 0, minWidth: 0, textTransform: "none", color: COLORS.primary, fontWeight: 700 }}
                  >
                    + Add Soil Information
                  </Button>
                </Box>

                <Grid container spacing={1} textAlign="center" mb={1}>
                  <Grid item xs={3}>
                    <Box p={0.8} bgcolor="#F8FAFC" borderRadius={2} border={`1px solid ${COLORS.border}`}>
                      <Typography variant="caption" color={COLORS.subtleText} display="block" sx={{ fontSize: "0.68rem" }}>N</Typography>
                      <Typography variant="caption" fontWeight="800" color={farmContext.soilN ? COLORS.primary : COLORS.subtleText}>
                        {farmContext.soilN || "—"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box p={0.8} bgcolor="#F8FAFC" borderRadius={2} border={`1px solid ${COLORS.border}`}>
                      <Typography variant="caption" color={COLORS.subtleText} display="block" sx={{ fontSize: "0.68rem" }}>P</Typography>
                      <Typography variant="caption" fontWeight="800" color={farmContext.soilP ? COLORS.primary : COLORS.subtleText}>
                        {farmContext.soilP || "—"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box p={0.8} bgcolor="#F8FAFC" borderRadius={2} border={`1px solid ${COLORS.border}`}>
                      <Typography variant="caption" color={COLORS.subtleText} display="block" sx={{ fontSize: "0.68rem" }}>K</Typography>
                      <Typography variant="caption" fontWeight="800" color={farmContext.soilK ? COLORS.primary : COLORS.subtleText}>
                        {farmContext.soilK || "—"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box p={0.8} bgcolor="#F8FAFC" borderRadius={2} border={`1px solid ${COLORS.border}`}>
                      <Typography variant="caption" color={COLORS.subtleText} display="block" sx={{ fontSize: "0.68rem" }}>pH</Typography>
                      <Typography variant="caption" fontWeight="800" color={farmContext.soilPh ? COLORS.primary : COLORS.subtleText}>
                        {farmContext.soilPh || "—"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box display="flex" alignItems="center" justifyContent="space-between" px={0.5}>
                  <Typography variant="caption" color={COLORS.subtleText} fontWeight="600">Soil Type:</Typography>
                  <Typography variant="caption" fontWeight="800" color={farmContext.soilType ? COLORS.primary : COLORS.subtleText}>
                    {farmContext.soilType || "Not provided"}
                  </Typography>
                </Box>
                {farmContext.soilSource && (
                  <Typography variant="caption" color={COLORS.subtleText} display="block" textAlign="right" sx={{ fontSize: "0.68rem" }}>
                    Source: {farmContext.soilSource}
                  </Typography>
                )}
              </Box>

              {/* MODULE 4 — FARM ANALYSIS STATUS CHECKLIST */}
              <Box pb={2} borderBottom={`1px solid ${COLORS.border}`}>
                <Typography variant="subtitle2" fontWeight="800" color={COLORS.darkText} mb={1.2}>
                  FARM ANALYSIS STATUS
                </Typography>

                <Box display="flex" flexDirection="column" gap={1}>
                  {[
                    { label: "Crop Selected", done: true },
                    { label: "Farm Area Added", done: true },
                    { label: "Location Available", done: true },
                    { label: "Soil Data Pending", done: Boolean(farmContext.soilN), customLabel: farmContext.soilN ? "Soil Data Available" : "Soil Data Pending" },
                    { label: "Analysis Pending", done: Boolean(analysisResult), customLabel: analysisResult ? "Analysis Completed" : "Analysis Pending" }
                  ].map((st, i) => (
                    <Box key={i} display="flex" alignItems="center" gap={1}>
                      {st.done ? (
                        <CheckIcon sx={{ fontSize: 16, color: COLORS.primary }} />
                      ) : (
                        <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: COLORS.subtleText }} />
                      )}
                      <Typography variant="caption" fontWeight={st.done ? 700 : 500} color={st.done ? COLORS.darkText : COLORS.subtleText}>
                        {st.customLabel || st.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* MODULE 5 — FARM NOTES WORKSPACE */}
              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2" fontWeight="800" color={COLORS.darkText}>Farm Notes</Typography>
                  {farmNotes && !isEditingNotes && (
                    <Button size="small" onClick={() => { setTempNotes(farmNotes); setIsEditingNotes(true); }} sx={{ fontSize: "0.7rem", p: 0, textTransform: "none", color: COLORS.primary, fontWeight: 700 }}>
                      Edit
                    </Button>
                  )}
                </Box>

                {isEditingNotes ? (
                  <Box display="flex" flexDirection="column" gap={1}>
                    <TextField
                      multiline
                      rows={3}
                      fullWidth
                      size="small"
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="Enter farm observations, spraying records..."
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, fontSize: "0.82rem" } }}
                    />
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                      <Button size="small" onClick={() => setIsEditingNotes(false)} sx={{ fontSize: "0.75rem" }}>Cancel</Button>
                      <Button size="small" variant="contained" onClick={() => { setFarmNotes(tempNotes); setIsEditingNotes(false); setSnackbar({ open: true, message: "Farm note saved!", severity: "success" }); }} sx={{ bgcolor: COLORS.primary, borderRadius: 2, fontSize: "0.75rem" }}>
                        Save Note
                      </Button>
                    </Box>
                  </Box>
                ) : farmNotes ? (
                  <Typography variant="body2" color={COLORS.darkText} sx={{ bgcolor: "#F8FAFC", p: 1.5, borderRadius: 2, fontSize: "0.82rem", lineHeight: 1.5 }}>
                    {farmNotes}
                  </Typography>
                ) : (
                  <Box py={0.5} textAlign="center">
                    <Typography variant="caption" color={COLORS.subtleText} display="block" mb={0.8}>
                      No farm notes yet.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon fontSize="small" />}
                      onClick={() => { setTempNotes(""); setIsEditingNotes(true); }}
                      sx={{ borderRadius: 2.5, textTransform: "none", color: COLORS.primary, borderColor: COLORS.primary, fontSize: "0.72rem", fontWeight: 700 }}
                    >
                      Add Note
                    </Button>
                  </Box>
                )}
              </Box>

            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* OCR EXTRACTED SOIL DATA CONFIRMATION DIALOG */}
      {ocrConfirmation && (
        <Dialog open={Boolean(ocrConfirmation)} onClose={() => setOcrConfirmation(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 800, color: COLORS.darkText }}>
            📄 Confirm Extracted Soil Data
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="#475569" mb={2}>
              We extracted the following values from your soil report. Please verify or edit them before analysis:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Nitrogen (N) kg/ha"
                  size="small"
                  fullWidth
                  value={ocrConfirmation.n}
                  onChange={(e) => setOcrConfirmation({ ...ocrConfirmation, n: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Phosphorus (P) kg/ha"
                  size="small"
                  fullWidth
                  value={ocrConfirmation.p}
                  onChange={(e) => setOcrConfirmation({ ...ocrConfirmation, p: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Potassium (K) kg/ha"
                  size="small"
                  fullWidth
                  value={ocrConfirmation.k}
                  onChange={(e) => setOcrConfirmation({ ...ocrConfirmation, k: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Soil pH (0 - 14)"
                  size="small"
                  fullWidth
                  value={ocrConfirmation.ph}
                  onChange={(e) => setOcrConfirmation({ ...ocrConfirmation, ph: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Soil Type"
                  size="small"
                  fullWidth
                  value={ocrConfirmation.soilType}
                  onChange={(e) => setOcrConfirmation({ ...ocrConfirmation, soilType: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOcrConfirmation(null)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                const conf = ocrConfirmation;
                setOcrConfirmation(null);
                setManualInput({ n: conf.n, p: conf.p, k: conf.k, ph: conf.ph });
                handleRunSoilAnalysis(conf, "Soil Report", conf.soilType);
              }}
              sx={{ bgcolor: COLORS.primary, borderRadius: 2.5 }}
            >
              Confirm & Compute Plan →
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* CROP DIAGNOSIS MODAL */}
      <Dialog open={activeModal === "cropDiag"} onClose={() => setActiveModal(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.darkText, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          🌱 Crop Disease Diagnosis
          <IconButton onClick={() => setActiveModal(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="#475569" mb={2}>
            Upload a leaf photo of your affected crop for instant symptom and disease detection:
          </Typography>

          <input
            type="file"
            id="diag-file-input"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setCropImageFile(file);
                setCropImagePreview(URL.createObjectURL(file));
              }
            }}
          />

          <label htmlFor="diag-file-input">
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderStyle: "dashed", borderColor: COLORS.primary, bgcolor: COLORS.cropBg, cursor: "pointer", textAlign: "center" }}>
              {cropImagePreview ? (
                <img src={cropImagePreview} alt="preview" style={{ maxHeight: 150, maxWidth: "100%", borderRadius: 8 }} />
              ) : (
                <Box>
                  <PhotoCameraIcon sx={{ fontSize: 40, color: COLORS.primary, mb: 1 }} />
                  <Typography variant="subtitle2" fontWeight="700" color={COLORS.primary}>Click to select crop photo</Typography>
                </Box>
              )}
            </Paper>
          </label>

          {cropDiagResult && (
            <Box mt={2} p={2} bgcolor={COLORS.cropBg} borderRadius={2.5} border={`1px solid ${COLORS.cropBorder}`}>
              <Typography variant="subtitle2" fontWeight="800" color={COLORS.primary}>{cropDiagResult.issue}</Typography>
              <Typography variant="caption" color={COLORS.primary} fontWeight="700" display="block" mb={1}>{cropDiagResult.confidence}</Typography>
              <Typography variant="body2" color="#334155" mb={1}><strong>Symptoms:</strong> {cropDiagResult.symptoms}</Typography>
              <Typography variant="body2" color={COLORS.primary}><strong>Action:</strong> {cropDiagResult.action}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActiveModal(null)}>Close</Button>
          <Button variant="contained" onClick={handleRunCropDiag} disabled={!cropImageFile} sx={{ bgcolor: COLORS.primary, borderRadius: 2.5 }}>
            Run Diagnosis
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT FARM CONTEXT MODAL */}
      <Dialog open={activeModal === "editContext"} onClose={() => setActiveModal(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Update Farm Context</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Select Crop"
              select
              fullWidth
              size="small"
              value={farmContext.crop}
              onChange={(e) => {
                const val = e.target.value;
                const labels = { wheat: "Wheat (गहू)", rice: "Rice / Paddy (भात)", cotton: "Cotton (कापूस)", sugarcane: "Sugarcane (ऊस)", soybean: "Soybean (सोयाबीन)", maize: "Maize (मका)" };
                handleCropOrAreaChange({ crop: val, cropLabel: labels[val] || val });
              }}
              SelectProps={{ native: true }}
            >
              <option value="wheat">Wheat (गहू)</option>
              <option value="rice">Rice / Paddy (भात)</option>
              <option value="cotton">Cotton (कापूस)</option>
              <option value="sugarcane">Sugarcane (ऊस)</option>
              <option value="soybean">Soybean (सोयाबीन)</option>
              <option value="maize">Maize (मका)</option>
            </TextField>

            <Grid container spacing={1}>
              <Grid item xs={7}>
                <TextField fullWidth size="small" label="Land Area Size" type="number" value={farmContext.landArea} onChange={(e) => handleCropOrAreaChange({ landArea: e.target.value })} />
              </Grid>
              <Grid item xs={5}>
                <TextField select fullWidth size="small" label="Unit" value={farmContext.landUnit} onChange={(e) => handleCropOrAreaChange({ landUnit: e.target.value })} SelectProps={{ native: true }}>
                  <option value="Acres">Acres</option>
                  <option value="Hectares">Hectares</option>
                  <option value="Gunthas">Gunthas</option>
                </TextField>
              </Grid>
            </Grid>

            <TextField fullWidth size="small" label="Location" value={farmContext.location} onChange={(e) => setFarmContext({ ...farmContext, location: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActiveModal(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setActiveModal(null); setSnackbar({ open: true, message: "Farm context updated!", severity: "success" }); }} sx={{ bgcolor: COLORS.primary, borderRadius: 2 }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR NOTIFICATIONS */}
      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: 3, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default DrAgro;
