import { createTheme, alpha } from "@mui/material/styles";

const glassEffect = (mode, opacity = 0.7) => ({
  backdropFilter: "blur(20px)",
  backgroundColor: alpha(mode === "dark" ? "#121212" : "#FFFFFF", opacity),
  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
  border: `1px solid ${alpha(mode === "dark" ? "#FFFFFF" : "#FFFFFF", 0.18)}`,
});

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === "light"
        ? {
            // Light Mode Palette
            primary: {
              main: "#2E7D32",
              light: "#4CAF50",
              dark: "#1B5E20",
              contrastText: "#ffffff",
            },
            secondary: {
              main: "#6200EA",
              light: "#A78BFA",
              dark: "#4A00B0",
              contrastText: "#ffffff",
            },
            background: {
              default: "#F4F7F5",
              paper: "#FFFFFF",
              glass: "rgba(255, 255, 255, 0.7)",
            },
          }
        : {
            // Dark Mode Palette
            primary: {
              main: "#66bb6a", // Lighter green for dark mode
              light: "#81c784",
              dark: "#388e3c",
              contrastText: "#000000",
            },
            secondary: {
              main: "#7c4dff",
              light: "#b388ff",
              dark: "#651fff",
              contrastText: "#ffffff",
            },
            background: {
              default: "#121212",
              paper: "#1E1E1E",
              glass: "rgba(30, 30, 30, 0.7)",
            },
          }),
      tertiary: {
        main: "#FF6D00",
        contrastText: "#fff",
      },
      gradients: {
        primary:
          mode === "light"
            ? "linear-gradient(135deg, #2E7D32 0%, #00C853 100%)"
            : "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
        secondary: "linear-gradient(135deg, #6200EA 0%, #B388FF 100%)",
        orange: "linear-gradient(135deg, #FF6D00 0%, #FFAB40 100%)",
        glass:
          "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)",
      },
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", "Poppins", sans-serif',
      h1: { fontWeight: 800, letterSpacing: "-0.02em", fontSize: "2rem" },
      h2: { fontWeight: 700, letterSpacing: "-0.01em", fontSize: "1.75rem" },
      h3: { fontWeight: 700, fontSize: "1.5rem" },
      h4: { fontWeight: 600, fontSize: "1.25rem" },
      h5: { fontWeight: 600, fontSize: "1.125rem" },
      h6: { fontWeight: 600, fontSize: "1rem" },
      subtitle1: { fontWeight: 600, fontSize: "0.9rem" },
      subtitle2: { fontWeight: 500, fontSize: "0.85rem" },
      body1: { fontSize: "0.9rem" },
      body2: { fontSize: "0.85rem" },
      button: { fontWeight: 600, textTransform: "none", fontSize: "0.85rem" },
    },
    shape: {
      borderRadius: 20,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: "8px 16px",
            boxShadow: "none",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
            },
          },
          containedPrimary: {
            background:
              mode === "light"
                ? "linear-gradient(135deg, #2E7D32 0%, #00C853 100%)"
                : "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
            color: "white",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            ...glassEffect(mode, 0.95),
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
    glass: (opacity) => glassEffect(mode, opacity),
  });

const theme = getTheme("light"); // Default for backward compatibility if imported directly
export default theme;
