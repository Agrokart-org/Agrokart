import React from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert,
  Card,
  CardContent,
  Chip,
  Paper,
  Button,
  Divider,
  Stack,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VerifiedIcon from "@mui/icons-material/Verified";
import ScienceIcon from "@mui/icons-material/Science";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CalculateIcon from "@mui/icons-material/Calculate";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useCart } from "../context/CartContext";

const flexRowSpaceBetween = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const flexRowCenter = {
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const DrAgroResults = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const res = location.state?.result;

  if (!res) {
    return (
      <Container maxWidth="lg" sx={{ mt: 12, textAlign: "center" }}>
        <Typography variant="h5" color="error" gutterBottom fontWeight="700">
          No analysis result found.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please upload a soil test report or submit manual soil parameters to generate recommendations.
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/customer/dr-agro")}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          Return to Dr. Agro
        </Button>
      </Container>
    );
  }

  // Handle Invalid Soil Report or Insufficient Data error responses
  const isInvalidReport = Boolean(res.isInvalidReport || res.success === false);
  const isInsufficientData = Boolean(res.insufficientData || (!res.nutrientRequirement && !res.data?.nutrientRequirement));

  const data = res.data || res;
  const sa = data.soilAssessment;
  const req = data.nutrientRequirement;
  const fert = data.fertilizerConversion;
  const source = data.source;
  const app = data.applicability;
  const ev = data.evidence;
  const ai = data.aiExplanation;

  // Add converted fertilizers to shopping cart
  const handleAddFertilizersToCart = () => {
    if (!fert) return;
    const items = [
      { id: "dap", name: "Di-Ammonium Phosphate (DAP)", qty: fert.dap_kg_ha },
      { id: "urea", name: "Urea (46% N)", qty: fert.urea_kg_ha },
      { id: "mop", name: "Muriate of Potash (MOP)", qty: fert.mop_kg_ha },
    ];
    items.forEach((item) => {
      if (item.qty > 0) {
        addToCart({
          _id: `fert-${item.id}`,
          name: item.name,
          price: 450,
          category: "fertilizer",
          description: `Calculated target quantity: ${item.qty} kg/ha`,
          inStock: true,
        }, 1);
      }
    });
  };

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "low") return "error";
    if (s === "high") return "info";
    if (s === "medium" || s === "acidic" || s === "alkaline") return "warning";
    if (s === "neutral") return "success";
    return "default";
  };

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 10, sm: 12 }, mb: 8 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/customer/dr-agro")}
        sx={{ mb: 3, fontWeight: 700, textTransform: "none" }}
      >
        {t("common.back") || "Back to Dr. Agro"}
      </Button>

      {/* Main Container */}
      <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
        
        {/* Page Title & Match Confidence Badge */}
        <Box sx={flexRowSpaceBetween} flexWrap="wrap" gap={2} mb={3}>
          <Box sx={flexRowCenter}>
            <ScienceIcon sx={{ fontSize: 36, color: "#087A4B" }} />
            <Typography variant="h4" fontWeight="800" color="#10231B">
              Dr. Agro Recommendation & Analysis
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<VerifiedIcon sx={{ color: "#087A4B !important" }} />}
              label={`Recommendation Match Confidence: ${data.overallConfidence || 100}%`}
              variant="outlined"
              sx={{ fontWeight: "700", borderColor: "#087A4B", color: "#087A4B", bgcolor: "#ECFDF5" }}
            />
            {data.matchMetadata?.matchLevel && (
              <Chip
                label={`Match: ${data.matchMetadata.matchLevel}`}
                size="small"
                sx={{ fontWeight: "600", bgcolor: "#F3F4F6", color: "#374151" }}
              />
            )}
          </Stack>
        </Box>

        {/* Handling Error / Insufficient Data */}
        {isInvalidReport || isInsufficientData ? (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid #FCA5A5", bgcolor: "#FEF2F2", mb: 4 }}>
            <Alert severity="error" sx={{ mb: 2, bgcolor: "transparent", p: 0 }}>
              <Typography variant="h6" fontWeight="700">
                {isInvalidReport ? "Invalid Soil Test Report" : "Verified Recommendation Not Found"}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {data.soilHealth || res.message || "A verified baseline recommendation matching the supplied soil and agricultural conditions was not found in the official MPKV database."}
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Please verify your soil parameters or select a supported crop (e.g., Wheat, Sugarcane, Paddy, Cotton, Maize).
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            
            {/* SECTION A: Soil Assessment */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                <Box sx={flexRowCenter} mb={2}>
                  <ScienceIcon color="primary" />
                  <Typography variant="h6" fontWeight="700" color="#1E293B">
                    Section A: Soil Health & Parameter Assessment
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  {[
                    { label: "Nitrogen (N)", item: sa?.nitrogen, unit: "kg/ha" },
                    { label: "Phosphorus (P)", item: sa?.phosphorus, unit: "kg/ha" },
                    { label: "Potassium (K)", item: sa?.potassium, unit: "kg/ha" },
                    { label: "Soil Reaction (pH)", item: sa?.ph, unit: "" },
                  ].map((param, idx) => (
                    <Grid item xs={12} sm={6} md={3} key={idx}>
                      <Card variant="outlined" sx={{ borderRadius: 2.5, bgcolor: "#F8FAFC", borderColor: "#E2E8F0" }}>
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="700">
                            {param.label}
                          </Typography>
                          <Typography variant="h6" fontWeight="800" color="#0F172A" sx={{ my: 0.5 }}>
                            {param.item?.value !== null && param.item?.value !== undefined
                              ? `${param.item.value} ${param.unit}`
                              : "Not Tested"}
                          </Typography>
                          <Chip
                            label={param.item?.status || "Unknown"}
                            color={getStatusColor(param.item?.status)}
                            size="small"
                            sx={{ fontWeight: "700", fontSize: "0.72rem" }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* SECTION B & C: Official MPKV Recommendation & Provenance */}
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: "1px solid #A7F3D0", bgcolor: "#ECFDF5", height: "100%" }}>
                <Box sx={flexRowSpaceBetween} mb={2}>
                  <Box sx={flexRowCenter}>
                    <VerifiedIcon sx={{ color: "#047857" }} />
                    <Typography variant="h6" fontWeight="800" color="#065F46">
                      Section B: Official MPKV Nutrient Requirement
                    </Typography>
                  </Box>
                  <Chip label="Official Research Baseline" color="success" size="small" sx={{ fontWeight: "700" }} />
                </Box>
                <Divider sx={{ mb: 3, borderColor: "#6EE7B7" }} />

                {/* Big Dosage Card */}
                <Card elevation={0} sx={{ p: 3, textAlign: "center", bgcolor: "#FFFFFF", borderRadius: 3, border: "2px solid #059669", mb: 3 }}>
                  <Typography variant="caption" fontWeight="800" color="#047857" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                    Baseline Recommended Dose
                  </Typography>
                  <Typography variant="h3" fontWeight="900" color="#065F46" sx={{ my: 1 }}>
                    {req ? `${req.n_kg_ha} : ${req.p2o5_kg_ha} : ${req.k2o_kg_ha}` : "120 : 60 : 40"}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="700" color="text.secondary">
                    N : P₂O₅ : K₂O kg/ha
                  </Typography>
                </Card>

                {/* Applicability Context Metadata */}
                <Typography variant="subtitle2" fontWeight="700" color="#065F46" mb={1}>
                  Applicability Context:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap gap={1} mb={3}>
                  <Chip label={`Crop: ${app?.crop || "Wheat"}`} sx={{ bgcolor: "#D1FAE5", fontWeight: "700", color: "#065F46" }} />
                  <Chip label={`Region: ${app?.region || "Maharashtra"}`} sx={{ bgcolor: "#D1FAE5", fontWeight: "700", color: "#065F46" }} />
                  {app?.season ? <Chip label={`Season: ${app.season}`} sx={{ bgcolor: "#D1FAE5", fontWeight: "700", color: "#065F46" }} /> : null}
                  {app?.soil_condition ? <Chip label={`Soil: ${app.soil_condition}`} sx={{ bgcolor: "#D1FAE5", fontWeight: "700", color: "#065F46" }} /> : null}
                  {app?.conditions ? <Chip label={`Condition: ${app.conditions}`} sx={{ bgcolor: "#D1FAE5", fontWeight: "700", color: "#065F46" }} /> : null}
                </Stack>

                {/* SECTION C: Source & Provenance */}
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#FFFFFF", border: "1px solid #A7F3D0" }}>
                  <Typography variant="caption" fontWeight="800" color="#065F46" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <MenuBookIcon fontSize="small" /> SECTION C: SOURCE PROVENANCE
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Organization:</Typography>
                      <Typography variant="body2" fontWeight="700">{source?.organization || "MPKV"}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Document:</Typography>
                      <Typography variant="body2" fontWeight="700">{source?.document || "MPKV_Wheat.pdf"}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Page Number:</Typography>
                      <Typography variant="body2" fontWeight="700">Page {source?.page || 2}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Year:</Typography>
                      <Typography variant="body2" fontWeight="700">{source?.year || 2025}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>

            {/* SECTION D: Mathematical Fertilizer Conversion */}
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: "1px solid #DDD6FE", bgcolor: "#F3E8FF", height: "100%" }}>
                <Box sx={flexRowCenter} mb={2}>
                  <CalculateIcon sx={{ color: "#6B21A8" }} />
                  <Typography variant="h6" fontWeight="800" color="#581C87">
                    Section D: Fertilizer Conversion
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3, borderColor: "#C084FC" }} />

                <Typography variant="body2" color="#6B21A8" fontWeight="600" mb={2}>
                  Calculated standard fertilizer quantities mathematically corresponding to official baseline targets:
                </Typography>

                <Stack spacing={1.5} mb={3}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #DDD6FE", bgcolor: "#FFFFFF", ...flexRowSpaceBetween }}>
                    <Typography variant="body2" fontWeight="700" color="#3B0764">Di-Ammonium Phosphate (DAP)</Typography>
                    <Typography variant="h6" fontWeight="800" color="#6B21A8">{fert?.dap_kg_ha || 0} kg/ha</Typography>
                  </Paper>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #DDD6FE", bgcolor: "#FFFFFF", ...flexRowSpaceBetween }}>
                    <Typography variant="body2" fontWeight="700" color="#3B0764">Urea (46% N)</Typography>
                    <Typography variant="h6" fontWeight="800" color="#6B21A8">{fert?.urea_kg_ha || 0} kg/ha</Typography>
                  </Paper>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #DDD6FE", bgcolor: "#FFFFFF", ...flexRowSpaceBetween }}>
                    <Typography variant="body2" fontWeight="700" color="#3B0764">Muriate of Potash (MOP)</Typography>
                    <Typography variant="h6" fontWeight="800" color="#6B21A8">{fert?.mop_kg_ha || 0} kg/ha</Typography>
                  </Paper>
                </Stack>

                {/* Mandatory Mathematical Disclaimer Alert */}
                <Alert severity="warning" variant="outlined" sx={{ bgcolor: "#FFFFFF", borderRadius: 2, borderColor: "#F59E0B" }}>
                  <Typography variant="caption" fontWeight="700" color="#B45309">
                    Mathematical Conversion Disclaimer:
                  </Typography>
                  <Typography variant="caption" display="block" color="#92400E" sx={{ mt: 0.5 }}>
                    These quantities are mathematical conversions based on standard FCO fertilizer compositions. They are calculated to supply the required baseline nutrient targets and are not presented as direct MPKV fertilizer prescriptions.
                  </Typography>
                </Alert>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ShoppingCartIcon />}
                  onClick={handleAddFertilizersToCart}
                  sx={{ mt: 2.5, bgcolor: "#6B21A8", "&:hover": { bgcolor: "#581C87" }, fontWeight: "700", py: 1.2, borderRadius: 2, textTransform: "none" }}
                >
                  Add Converted Fertilizers to Cart
                </Button>
              </Paper>
            </Grid>

            {/* SECTION E: AI Explanation & Farmer Guidance */}
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: "1px solid #BAE6FD", bgcolor: "#F0F9FF" }}>
                <Box sx={flexRowSpaceBetween} mb={2}>
                  <Box sx={flexRowCenter}>
                    <AutoAwesomeIcon sx={{ color: "#0284C7" }} />
                    <Typography variant="h6" fontWeight="800" color="#0369A1">
                      Section E: AI Explanation & Farmer Guidance
                    </Typography>
                  </Box>
                  <Chip label="Grounded AI Interpretation" color="info" size="small" sx={{ fontWeight: "700" }} />
                </Box>
                <Divider sx={{ mb: 2, borderColor: "#7DD3FC" }} />

                {ai && ai.available ? (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="700" color="#0369A1">Summary:</Typography>
                      <Typography variant="body2" color="#0C4A6E">{ai.summary}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="700" color="#0369A1">Official Target Explanation:</Typography>
                      <Typography variant="body2" color="#0C4A6E">{ai.officialRecommendation}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="700" color="#0369A1">Fertilizer Conversion Breakdown:</Typography>
                      <Typography variant="body2" color="#0C4A6E">{ai.fertilizerExplanation}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="700" color="#0369A1">Application Guidance:</Typography>
                      <Typography variant="body2" color="#0C4A6E">{ai.applicationGuidance}</Typography>
                    </Box>
                    {ai.warnings && ai.warnings.length > 0 ? (
                      <Box>
                        {ai.warnings.map((w, idx) => (
                          <Alert key={idx} severity="warning" sx={{ mt: 1, borderRadius: 1.5 }}>
                            {w}
                          </Alert>
                        ))}
                      </Box>
                    ) : null}
                  </Stack>
                ) : (
                  <Alert severity="info" sx={{ bgcolor: "#FFFFFF" }}>
                    AI Explanation is currently unavailable. Official MPKV baseline recommendations and fertilizer conversions remain fully verified.
                  </Alert>
                )}
              </Paper>
            </Grid>

            {/* SECTION F: RAG Official Supporting Evidence */}
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: "1px solid #CBD5E1", bgcolor: "#F8FAFC" }}>
                <Box sx={flexRowCenter} mb={2}>
                  <MenuBookIcon sx={{ color: "#475569" }} />
                  <Typography variant="h6" fontWeight="800" color="#334155">
                    Section F: Supporting Document Evidence
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {ev && ev.available ? (
                  <Box>
                    <Stack direction="row" spacing={1} mb={1.5}>
                      <Chip label={`Org: ${ev.source?.organization || "MPKV"}`} size="small" sx={{ fontWeight: 700 }} />
                      <Chip label={`Doc: ${ev.source?.document || "MPKV_Wheat.pdf"}`} size="small" sx={{ fontWeight: 700 }} />
                      <Chip label={`Page: ${ev.source?.page || 2}`} size="small" sx={{ fontWeight: 700 }} />
                    </Stack>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 2 }}>
                      <Typography variant="body2" color="#334155" sx={{ fontStyle: "italic", lineHeight: 1.6 }}>
                        "{ev.supportingText}"
                      </Typography>
                    </Paper>
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ bgcolor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                    No additional MPKV document passage retrieved for this specific query. Recommendation is verified against official MPKV baseline specifications.
                  </Alert>
                )}
              </Paper>
            </Grid>

          </Grid>
        )}
      </Box>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </Container>
  );
};

export default DrAgroResults;
