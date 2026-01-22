import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Tabs, Tab,
    Paper, Grid, Divider, Alert, useTheme, useMediaQuery,
    Card, CardContent, Chip, Avatar
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import SoilUpload from '../components/drAgro/SoilUpload';
import ManualForm from '../components/drAgro/ManualForm';
import RecommendationCard from '../components/drAgro/RecommendationCard';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import ScienceIcon from '@mui/icons-material/Science';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
            style={{ animation: 'fadeIn 0.5s ease-in-out' }}
        >
            {value === index && (
                <Box sx={{ p: { xs: 2, md: 4 } }}>
                    {children}
                </Box>
            )}
        </div>
    );
};



const DrAgro = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [tabIndex, setTabIndex] = useState(0);
    const navigate = useNavigate();

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    const handleAnalysisComplete = (data) => {
        // Navigate to results page with data
        navigate('/customer/dr-agro/results', { state: { result: data } });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 10, sm: 12 }, mb: 8 }}>
            {/* Header Section */}
            <Box
                textAlign="center"
                mb={6}
                sx={{
                    background: 'linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)',
                    p: 4,
                    borderRadius: 4,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}
            >
                <Avatar
                    sx={{
                        width: 80,
                        height: 80,
                        bgcolor: 'primary.main',
                        margin: '0 auto',
                        mb: 2,
                        boxShadow: '0 8px 16px rgba(46, 125, 50, 0.3)'
                    }}
                >
                    <MedicalServicesIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography
                    variant="h3"
                    component="h1"
                    gutterBottom
                    color="primary.dark"
                    fontWeight="800"
                    sx={{ fontSize: { xs: '2rem', md: '3rem' } }}
                >
                    {t('drAgro.title')}
                </Typography>
                <Typography variant="h6" color="text.secondary" maxWidth="600px" mx="auto">
                    {t('drAgro.subtitle')}
                </Typography>
            </Box>

            {/* Main Content Area */}
            <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} md={12} lg={10}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: 1,
                            borderColor: 'divider',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        }}
                    >
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                            <Tabs
                                value={tabIndex}
                                onChange={handleTabChange}
                                variant="fullWidth"
                                centered
                                indicatorColor="primary"
                                textColor="primary"
                                sx={{
                                    '& .MuiTab-root': {
                                        py: 2,
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        textTransform: 'none'
                                    }
                                }}
                            >
                                <Tab icon={<ScienceIcon />} label={t('drAgro.uploadTab')} iconPosition="start" />
                                <Tab icon={<AgricultureIcon />} label={t('drAgro.manualTab')} iconPosition="start" />
                            </Tabs>
                        </Box>

                        <TabPanel value={tabIndex} index={0}>
                            <Typography variant="h6" gutterBottom color="text.primary" fontWeight="600">
                                {t('drAgro.uploadInstructions')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Upload a clear photo or PDF of your soil test report provided by a lab.
                            </Typography>
                            <SoilUpload
                                onAnalysisComplete={handleAnalysisComplete}
                                onSwitchToManual={() => setTabIndex(1)}
                            />
                        </TabPanel>

                        <TabPanel value={tabIndex} index={1}>
                            <Typography variant="h6" gutterBottom color="text.primary" fontWeight="600">
                                {t('drAgro.manualInstructions')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Don't have a soft copy? Enter the values from your physical report manually.
                            </Typography>
                            <ManualForm onAnalysisComplete={handleAnalysisComplete} />
                        </TabPanel>
                    </Paper>
                </Grid>
            </Grid>

            <style>
                {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
            </style>
        </Container>
    );
};

export default DrAgro;
