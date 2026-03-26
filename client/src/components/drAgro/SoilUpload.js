import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  TextField,
  Grid,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useTranslation } from "react-i18next";
// import { safeFetch, API_BASE_URL } from '../../services/api'; // Disabling API
import RecommendationEngine from "../../services/ai/RecommendationEngine";

const SoilUpload = ({ onAnalysisComplete, onSwitchToManual, selectedCrop }) => {
  const { t, i18n } = useTranslation();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Land Details State
  const [landArea, setLandArea] = useState(1);
  const [unit, setUnit] = useState("acre");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError(t("drAgro.fileSizeError"));
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedCrop) {
      setError(
        t("drAgro.validation.required") || "Please select a crop first.",
      );
      return;
    }
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      console.log(`Dr.Agro: Starting Offline Analysis for ${selectedCrop}...`);

      // Call Offline Engine directly with land area
      const response = await RecommendationEngine.processReport(
        file,
        selectedCrop,
        i18n.language,
        landArea,
        unit,
      );

      if (response.success) {
        // Pass Land Area info along with result for final calculation in Results page if needed
        const enrichedResult = {
          ...response.data,
          landDetails: { area: landArea, unit: unit },
        };
        onAnalysisComplete(enrichedResult);
      } else if (response.isInvalidReport) {
        setError({
          type: "validation",
          message: response.message || t("drAgro.invalidReportError"),
          details:
            "Please upload a valid soil test report or enter data manually.",
        });
      } else {
        throw new Error(response.message || "Analysis failed");
      }
    } catch (err) {
      console.error("Dr.Agro Analysis Error:", err);
      setError(`Analysis Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper
        variant="outlined"
        sx={{
          p: 8,
          minHeight: 300,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          borderStyle: "dashed",
          borderWidth: 2,
          borderColor:
            error && error.type === "validation"
              ? "error.main"
              : "primary.main",
          textAlign: "center",
          bgcolor: "background.default",
        }}
      >
        <input
          accept="image/*,application/pdf"
          style={{ display: "none" }}
          id="raised-button-file"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="raised-button-file">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
          >
            {t("drAgro.selectFile")}
          </Button>
        </label>

        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {t("drAgro.supportedFormats")}
        </Typography>

        {preview && (
          <Box
            sx={{ mt: 2, maxHeight: 200, overflow: "hidden", borderRadius: 1 }}
          >
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: "200px" }}
            />
            <Typography variant="caption" display="block">
              {file.name}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Land Area Inputs */}
      <Box mt={3} mb={1}>
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <TextField
              fullWidth
              label="Land Area Size"
              type="number"
              value={landArea}
              onChange={(e) => setLandArea(e.target.value)}
              InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
              helperText="Total area for fertilizer calculation"
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              select
              fullWidth
              label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="acre">Acre</option>
              <option value="hectare">Hectare</option>
              <option value="guntha">Guntha</option>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {error &&
        (error.type === "validation" ? (
          <Alert severity="warning" sx={{ mt: 2, textAlign: "left" }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {error.message}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
              {error.details}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={onSwitchToManual}
              sx={{ mt: 1 }}
            >
              {t("drAgro.switchToManual") || "Enter Data Manually"}
            </Button>
          </Alert>
        ) : (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ))}

      <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!file || loading || !selectedCrop}
          size="large"
        >
          {loading ? <CircularProgress size={24} /> : t("drAgro.analyzeButton")}
        </Button>
      </Box>
    </Box>
  );
};

export default SoilUpload;
