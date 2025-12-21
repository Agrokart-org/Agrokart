import { createTheme } from '@mui/material/styles';

const dashboardTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#2E7D32', // Deep Crop Green
            light: '#4CAF50', // Fresh Green
            dark: '#1B5E20', // Forest Green
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#FBC02D', // Sun Gold
            light: '#FFF176', // Light Gold
            dark: '#F57F17', // Dark Gold
            contrastText: '#000000',
        },
        tertiary: {
            main: '#795548', // Earth Brown
            light: '#A1887F',
            dark: '#3E2723',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#FAFAFA', // Soft White (High readability)
            paper: '#FFFFFF',   // Pure White
            subtle: '#F1F8E9',  // Very light green tint
        },
        text: {
            primary: '#1B1B1B', // Almost Black (Softer than #000)
            secondary: '#455A64', // Blue-Grey (Better contrast than standard grey)
        },
        divider: 'rgba(0, 0, 0, 0.08)',
        success: {
            main: '#2E7D32',
        },
        error: {
            main: '#D32F2F',
        },
        warning: {
            main: '#ED6C02',
        },
        info: {
            main: '#0288D1',
        }
    },
    typography: {
        fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", sans-serif',
        h1: { fontWeight: 700, color: '#1B5E20' },
        h2: { fontWeight: 700, color: '#1B5E20' },
        h3: { fontWeight: 700, color: '#2E7D32' },
        h4: { fontWeight: 600, color: '#2E7D32' },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontSize: '1.1rem', fontWeight: 500, color: '#5D4037' }, // Earthy tone for subtitles
        button: { textTransform: 'none', fontWeight: 600, fontSize: '1rem' }, // Larger buttons for better touch targets
    },
    shape: {
        borderRadius: 16, // Softer, organic corners
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 20px', // Larger touch area
                    boxShadow: 'none',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                    },
                    transition: 'all 0.2s ease-in-out',
                },
                contained: {
                    '&:active': {
                        transform: 'translateY(1px)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation1: {
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(0,0,0,0.03)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0px 12px 30px rgba(46, 125, 50, 0.1)', // Green glow on hover
                        borderColor: '#4CAF50',
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#2E7D32', // Deep Crop Green (Primary Main)
                    color: '#FFFFFF', // White text/icons
                    borderBottom: 'none',
                    boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1B5E20', // Deep Forest Green Sidebar
                    color: '#FFFFFF',
                    borderRight: 'none',
                },
            },
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: 'rgba(255, 255, 255, 0.9)',
                },
            },
        },
        MuiListItemText: {
            styleOverrides: {
                primary: {
                    color: '#FFFFFF',
                    fontWeight: 500,
                },
                secondary: {
                    color: 'rgba(255, 255, 255, 0.7)',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    margin: '6px 12px',
                    '&.Mui-selected': {
                        backgroundColor: '#4CAF50', // Brighter green for active
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        '&:hover': {
                            backgroundColor: '#43A047',
                        },
                        '& .MuiListItemIcon-root': {
                            color: '#FFFFFF',
                        },
                    },
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 600,
                },
                filled: {
                    backgroundColor: '#F1F8E9',
                    color: '#2E7D32',
                },
            },
        },
    },
});

export default dashboardTheme;
