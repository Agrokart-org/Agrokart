import React, { useState } from 'react';
import {
    Box, Button, Typography, Paper, CircularProgress,
    Alert, Stack, TextField, Grid, MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTranslation } from 'react-i18next';


const SoilUpload = ({ onAnalysisComplete, onSwitchToManual }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Land Details State
    const [landArea, setLandArea] = useState(1);
    const [unit, setUnit] = useState('acre');

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError(t('drAgro.fileSizeError'));
                return;
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('report', file);
        formData.append('landArea', landArea);
        formData.append('unit', unit);

        try {
            // Force correct backend URL for debugging
            const baseUrl = 'http://localhost:5000';
            console.log(`Dr.Agro: Uploading to ${baseUrl}/api/dr-agro/analyze-report`);

            const response = await fetch(`${baseUrl}/api/dr-agro/analyze-report`, {
                method: 'POST',
                body: formData,
            });

            const responseText = await response.text();
            console.log('Dr.Agro: Raw server response:', responseText.substring(0, 200)); // Log first 200 chars

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Dr.Agro: Failed to parse JSON response');
                throw new Error(`Server returned non-JSON response (likely HTML error). Status: ${response.status}`);
            }

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            if (data.success) {
                onAnalysisComplete(data.data);
            } else if (data.isInvalidReport) {
                // Handle specific validation error
                setError({
                    type: 'validation',
                    message: data.message || t('drAgro.invalidReportError'),
                    details: 'Please upload a valid soil test report or enter data manually.'
                });
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Dr.Agro Upload Error:', err);
            setError(`Upload Failed: ${err.message}`);
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
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderColor: 'primary.main',
                    textAlign: 'center',
                    bgcolor: 'background.default'
                }}
            >
                <input
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    type="file"
                    onChange={handleFileChange}
                />
                <label htmlFor="raised-button-file">
                    <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                        {t('drAgro.selectFile')}
                    </Button>
                </label>

                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {t('drAgro.supportedFormats')}
                </Typography>

                {preview && (
                    <Box sx={{ mt: 2, maxHeight: 200, overflow: 'hidden', borderRadius: 1 }}>
                        <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
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

            {error && (
                error.type === 'validation' ? (
                    <Alert severity="warning" sx={{ mt: 2, textAlign: 'left' }}>
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
                            {t('drAgro.switchToManual') || 'Enter Data Manually'}
                        </Button>
                    </Alert>
                ) : (
                    <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                )
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpload}
                    disabled={!file || loading}
                    size="large"
                >
                    {loading ? <CircularProgress size={24} /> : t('drAgro.analyzeButton')}
                </Button>
            </Box>
        </Box>
    );
};

export default SoilUpload;
