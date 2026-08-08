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
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RecommendationCard from "../components/drAgro/RecommendationCard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const DrAgroResults = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const analysisResult = location.state?.result;

  if (!analysisResult) {
    return (
      <Container maxWidth="lg" sx={{ mt: 12, textAlign: "center" }}>
        <Typography variant="h5" color="error" gutterBottom>
          No results found.
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/customer/dr-agro")}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 10, sm: 12 }, mb: 8 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/customer/dr-agro")}
        sx={{ mb: 3 }}
      >
        {t("common.back")}
      </Button>

      <Box sx={{ animation: "slideUp 0.6s ease-out" }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="700" color="text.primary">
            {t("drAgro.analysisResultTitle")}
          </Typography>
          <Chip
            label="AI Generated"
            color="primary"
            variant="outlined"
            size="small"
            sx={{ ml: 2, fontWeight: "bold" }}
          />
        </Box>

        <Grid container spacing={3}>
          {/* Soil Health Summary */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: "100%",
                bgcolor: "#f1f8e9",
                borderRadius: 3,
                border: "1px solid #c5e1a5",
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 4 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  fontWeight="600"
                  color="primary.dark"
                >
                  {t("drAgro.soilHealth")}
                </Typography>
                <Box
                  sx={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    background: "white",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    my: 2,
                    border: "6px solid",
                    borderColor: "success.main",
                  }}
                >
                  <Typography
                    variant="h3"
                    component="div"
                    color="success.main"
                    fontWeight="800"
                  >
                    {analysisResult.overallConfidence || 0}
                  </Typography>
                  <Typography
                    variant="caption"
                    component="div"
                    color="text.secondary"
                    fontWeight="600"
                  >
                    / 100
                  </Typography>
                </Box>
                <Box mt={2}>
                  {analysisResult.alerts?.map((alert, idx) => (
                    <Alert
                      key={idx}
                      severity={alert.includes("Start") ? "warning" : "info"}
                      sx={{
                        mb: 1,
                        textAlign: "left",
                        fontWeight: 500,
                        bgcolor: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {alert}
                    </Alert>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendations */}
          <Grid item xs={12} md={8}>
            <Box mb={2}>
              <Typography variant="h5" color="text.primary" fontWeight="600">
                {t("drAgro.recommendationsTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Based on your soil parameters and crop selection
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {analysisResult.recommendations?.map((rec, index) => (
                <RecommendationCard key={index} recommendation={rec} />
              ))}
            </Box>

            {/* RAG Chat Action Callout */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mt: 3,
                bgcolor: "#E8F5E9",
                border: "1px solid #A5D6A7",
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="700" color="#2E7D32">
                  Have questions about this recommendation? 🌿
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ask Dr. Agro AI Assistant for step-by-step guidance backed by agricultural literature.
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() =>
                  navigate("/customer/dr-agro", {
                    state: {
                      activeTab: 2,
                      mlRecommendation: analysisResult.recommendations
                        ?.map((r) => `${r.product || r.name}: ${r.dosage || r.dose}`)
                        .join(", ")
                    }
                  })
                }
                sx={{
                  bgcolor: "#2E7D32",
                  color: "white",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#1B5E20" }
                }}
              >
                Ask AI Assistant
              </Button>
            </Paper>

            <Alert
              severity="warning"
              variant="outlined"
              sx={{ mt: 3, borderRadius: 2 }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {t("drAgro.disclaimerTitle")}
              </Typography>
              <Typography variant="body2">
                {t("drAgro.disclaimerText")}
              </Typography>
            </Alert>

          </Grid>
        </Grid>
      </Box>

      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
    </Container>
  );
};

export default DrAgroResults;
