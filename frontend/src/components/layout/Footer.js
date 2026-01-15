import React from 'react';
import { Box, Container, Grid, Typography, IconButton, Link, Divider } from '@mui/material';
import { Facebook, Twitter, Instagram, LinkedIn, Phone, Email, LocationOn } from '@mui/icons-material';

const Footer = () => {
    return (
        <Box
            sx={{
                bgcolor: '#1a1a1a',
                color: 'white',
                py: 6,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                mt: 'auto'
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Brand & About */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, background: 'linear-gradient(45deg, #4CAF50, #81C784)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                            Agrokart
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'grey.400', mb: 2, lineHeight: 1.8 }}>
                            Empowering farmers with quality agricultural products delivered directly to their doorstep. The most trusted partner for modern farming.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', '&:hover': { bgcolor: '#1877F2' } }}>
                                <Facebook />
                            </IconButton>
                            <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', '&:hover': { bgcolor: '#E4405F' } }}>
                                <Instagram />
                            </IconButton>
                            <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', '&:hover': { bgcolor: '#1DA1F2' } }}>
                                <Twitter />
                            </IconButton>
                            <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', '&:hover': { bgcolor: '#0A66C2' } }}>
                                <LinkedIn />
                            </IconButton>
                        </Box>
                    </Grid>

                    {/* Quick Links */}
                    <Grid item xs={6} md={2}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
                            Quick Links
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {['Home', 'Products', 'About Us', 'Contact'].map((item) => (
                                <Link key={item} href="#" underline="none" sx={{ color: 'grey.400', '&:hover': { color: '#4CAF50' }, fontSize: '0.9rem' }}>
                                    {item}
                                </Link>
                            ))}
                        </Box>
                    </Grid>

                    {/* Categories */}
                    <Grid item xs={6} md={2}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
                            Categories
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {['Fertilizers', 'Seeds', 'Pesticides', 'Tools'].map((item) => (
                                <Link key={item} href="#" underline="none" sx={{ color: 'grey.400', '&:hover': { color: '#4CAF50' }, fontSize: '0.9rem' }}>
                                    {item}
                                </Link>
                            ))}
                        </Box>
                    </Grid>

                    {/* Contact Info */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
                            Contact Us
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <LocationOn sx={{ color: '#4CAF50' }} />
                                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                    123 Farming Hub, Agriculture District,<br /> Maharashtra, India - 400001
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Phone sx={{ color: '#4CAF50' }} />
                                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                    +91 98765 43210
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Email sx={{ color: '#4CAF50' }} />
                                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                    support@agrokart.com
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: 'grey.500' }}>
                        © 2025 Agrokart. All rights reserved.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Link href="#" underline="none" sx={{ color: 'grey.500', fontSize: '0.85rem' }}>Privacy Policy</Link>
                        <Link href="#" underline="none" sx={{ color: 'grey.500', fontSize: '0.85rem' }}>Terms of Service</Link>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
