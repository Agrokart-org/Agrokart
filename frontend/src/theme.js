import { createTheme, alpha } from '@mui/material/styles';

const glassEffect = (opacity = 0.7) => ({
  backdropFilter: 'blur(20px)',
  backgroundColor: alpha('#FFFFFF', opacity),
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D32', // Deep nature green
      light: '#4CAF50',
      dark: '#1B5E20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6200EA', // Deep violet for premium feel
      light: '#A78BFA',
      dark: '#4A00B0',
      contrastText: '#ffffff',
    },
    tertiary: {
      main: '#FF6D00', // Vibrant Orange
      contrastText: '#fff'
    },
    background: {
      default: '#F4F7F5', // Soft gray-green tint
      paper: '#FFFFFF',
      glass: 'rgba(255, 255, 255, 0.7)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #2E7D32 0%, #00C853 100%)',
      secondary: 'linear-gradient(135deg, #6200EA 0%, #B388FF 100%)',
      orange: 'linear-gradient(135deg, #FF6D00 0%, #FFAB40 100%)',
      glass: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
    }
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Poppins", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2E7D32 0%, #00C853 100%)',
          color: 'white',
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)',
          ...glassEffect(0.9),
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
  glass: glassEffect,
});

export default theme;