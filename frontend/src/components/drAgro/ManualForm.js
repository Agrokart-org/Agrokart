import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Box, TextField, Button, Grid, MenuItem,
    InputAdornment, CircularProgress, Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const ManualForm = ({ onAnalysisComplete }) => {
    const { t } = useTranslation();

    const validationSchema = Yup.object({
        ph: Yup.number().min(0).max(14).required(t('drAgro.validation.ph')),
        nitrogen: Yup.number().min(0).required(t('drAgro.validation.required')),
        phosphorus: Yup.number().min(0).required(t('drAgro.validation.required')),
        potassium: Yup.number().min(0).required(t('drAgro.validation.required')),
        crop: Yup.string().required(t('drAgro.validation.required')),
        landArea: Yup.number().min(0.01).required(t('drAgro.validation.required')),
        unit: Yup.string().required(t('drAgro.validation.required'))
    });

    const formik = useFormik({
        initialValues: {
            ph: '',
            nitrogen: '',
            phosphorus: '',
            potassium: '',
            crop: '',
            landArea: '1',
            unit: 'acre'
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/dr-agro/analyze-manual`, values);
                if (response.data.success) {
                    onAnalysisComplete(response.data.data);
                }
            } catch (err) {
                console.error(err);
                // handle error
            } finally {
                setSubmitting(false);
            }
        },
    });

    const crops = [
        { id: 'Wheat', label: 'drAgro.crops.wheat' },
        { id: 'Rice', label: 'drAgro.crops.rice' },
        { id: 'Cotton', label: 'drAgro.crops.cotton' },
        { id: 'Sugarcane', label: 'drAgro.crops.sugarcane' },
        { id: 'Soybean', label: 'drAgro.crops.soybean' },
        { id: 'Maize', label: 'drAgro.crops.maize' },
        { id: 'Vegetables', label: 'drAgro.crops.vegetables' }
    ];

    return (
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: 2 }}>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        select
                        name="crop"
                        label={t('drAgro.form.crop')}
                        value={formik.values.crop}
                        onChange={formik.handleChange}
                        error={formik.touched.crop && Boolean(formik.errors.crop)}
                        helperText={formik.touched.crop && formik.errors.crop}
                    >
                        {crops.map((option) => (
                            <MenuItem key={option.id} value={option.id}>
                                {t(option.label)}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        name="ph"
                        label={t('drAgro.form.ph')}
                        type="number"
                        inputProps={{ step: "0.1" }}
                        value={formik.values.ph}
                        onChange={formik.handleChange}
                        error={formik.touched.ph && Boolean(formik.errors.ph)}
                        helperText={formik.touched.ph && formik.errors.ph}
                    />
                </Grid>

                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        name="nitrogen"
                        label={t('drAgro.form.nitrogen')}
                        type="number"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">kg/ha</InputAdornment>,
                        }}
                        value={formik.values.nitrogen}
                        onChange={formik.handleChange}
                        error={formik.touched.nitrogen && Boolean(formik.errors.nitrogen)}
                        helperText={formik.touched.nitrogen && formik.errors.nitrogen}
                    />
                </Grid>

                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        name="phosphorus"
                        label={t('drAgro.form.phosphorus')}
                        type="number"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">kg/ha</InputAdornment>,
                        }}
                        value={formik.values.phosphorus}
                        onChange={formik.handleChange}
                        error={formik.touched.phosphorus && Boolean(formik.errors.phosphorus)}
                        helperText={formik.touched.phosphorus && formik.errors.phosphorus}
                    />
                </Grid>

                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        name="potassium"
                        label={t('drAgro.form.potassium')}
                        type="number"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">kg/ha</InputAdornment>,
                        }}
                        value={formik.values.potassium}
                        onChange={formik.handleChange}
                        error={formik.touched.potassium && Boolean(formik.errors.potassium)}
                        helperText={formik.touched.potassium && formik.errors.potassium}
                    />
                </Grid>



                {/* Land Area Inputs */}
                <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom mt={2}>Land Details</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={8}>
                            <TextField
                                fullWidth
                                label="Land Area Size"
                                name="landArea"
                                type="number"
                                value={formik.values.landArea}
                                onChange={formik.handleChange}
                                error={formik.touched.landArea && Boolean(formik.errors.landArea)}
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
                        disabled={formik.isSubmitting}
                        size="large"
                    >
                        {formik.isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('drAgro.analyzeButton')}
                    </Button>
                </Grid>
            </Grid>
        </Box >
    );
};

export default ManualForm;
