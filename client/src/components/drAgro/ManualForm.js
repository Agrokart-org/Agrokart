import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  TextField,
  Button,
  Grid,
  InputAdornment,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
// import { safeFetch, API_BASE_URL } from '../../services/api';
import RecommendationEngine from "../../services/ai/RecommendationEngine";

const ManualForm = ({ onAnalysisComplete, selectedCrop }) => {
  const { t, i18n } = useTranslation();

  const validationSchema = Yup.object({
    ph: Yup.number().min(0).max(14).required(t("drAgro.validation.ph")),
    nitrogen: Yup.number().min(0).required(t("drAgro.validation.required")),
    phosphorus: Yup.number().min(0).required(t("drAgro.validation.required")),
    potassium: Yup.number().min(0).required(t("drAgro.validation.required")),
    crop: Yup.string().required(t("drAgro.validation.required")),
    landArea: Yup.number().min(0.01).required(t("drAgro.validation.required")),
    unit: Yup.string().required(t("drAgro.validation.required")),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      ph: "",
      nitrogen: "",
      phosphorus: "",
      potassium: "",
      crop: selectedCrop || "",
      landArea: "1",
      unit: "acre",
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        console.log(
          `Dr.Agro: Starting Manual Offline Analysis for ${values.crop}...`,
        );

        // Prepare Data
        const soilData = {
          ph: parseFloat(values.ph),
          nitrogen: parseFloat(values.nitrogen),
          phosphorus: parseFloat(values.phosphorus),
          potassium: parseFloat(values.potassium),
          // Default OC if not in form (UI doesn't show it but engine likes it)
          organic_carbon: 0.5,
        };

        // Call Offline Engine with land area
        const response = await RecommendationEngine.processManualData(
          soilData,
          values.crop,
          i18n.language,
          parseFloat(values.landArea),
          values.unit,
        );

        if (response.success) {
          const enrichedResult = {
            ...response.data,
            landDetails: {
              area: parseFloat(values.landArea),
              unit: values.unit,
            },
          };
          onAnalysisComplete(enrichedResult);
        } else {
          console.error("Manual Analysis Failed:", response.message);
        }
      } catch (err) {
        console.error("Manual Analysis Runtime Error:", err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Crop Field Removed from UI, handled by parent */}

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="ph"
            label={t("drAgro.form.ph")}
            type="number"
            inputProps={{ step: "0.1" }}
            value={formik.values.ph}
            onChange={formik.handleChange}
            error={formik.touched.ph && Boolean(formik.errors.ph)}
            helperText={formik.touched.ph && formik.errors.ph}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="nitrogen"
            label={t("drAgro.form.nitrogen")}
            type="number"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">kg/ha</InputAdornment>
              ),
            }}
            value={formik.values.nitrogen}
            onChange={formik.handleChange}
            error={formik.touched.nitrogen && Boolean(formik.errors.nitrogen)}
            helperText={formik.touched.nitrogen && formik.errors.nitrogen}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="phosphorus"
            label={t("drAgro.form.phosphorus")}
            type="number"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">kg/ha</InputAdornment>
              ),
            }}
            value={formik.values.phosphorus}
            onChange={formik.handleChange}
            error={
              formik.touched.phosphorus && Boolean(formik.errors.phosphorus)
            }
            helperText={formik.touched.phosphorus && formik.errors.phosphorus}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="potassium"
            label={t("drAgro.form.potassium")}
            type="number"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">kg/ha</InputAdornment>
              ),
            }}
            value={formik.values.potassium}
            onChange={formik.handleChange}
            error={formik.touched.potassium && Boolean(formik.errors.potassium)}
            helperText={formik.touched.potassium && formik.errors.potassium}
          />
        </Grid>

        {/* Land Area Inputs */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom mt={2}>
            Land Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Land Area Size"
                name="landArea"
                type="number"
                value={formik.values.landArea}
                onChange={formik.handleChange}
                error={
                  formik.touched.landArea && Boolean(formik.errors.landArea)
                }
                helperText={formik.touched.landArea && formik.errors.landArea}
                InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                select
                fullWidth
                label="Unit"
                name="unit"
                value={formik.values.unit}
                onChange={formik.handleChange}
                SelectProps={{ native: true }}
              >
                <option value="acre">Acre</option>
                <option value="hectare">Hectare</option>
                <option value="guntha">Guntha</option>
              </TextField>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Button
            color="primary"
            variant="contained"
            fullWidth
            type="submit"
            disabled={formik.isSubmitting || !selectedCrop}
            size="large"
          >
            {formik.isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t("drAgro.analyzeButton")
            )}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManualForm;
