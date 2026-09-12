import { createTheme, alpha } from "@mui/material/styles";

const glassEffect = (mode, opacity = 0.95) => ({
  backdropFilter: "blur(12px)",
  backgroundColor: alpha(mode === "dark" ? "#1A202C" : "#FFFFFF", opacity),
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
  border: `1px solid ${alpha(mode === "dark" ? "#2D3748" : "#E5E7EB", 0.8)}`,
});

export const getTheme = (mode = "light") =>
  createTheme({
    palette: {
      mode,
      ...(mode === "light"
        ? {
            primary: {
              main: "#1B5E20",
              light: "#2E7D32",
              dark: "#0F4A14",
              contrastText: "#ffffff",
            },
            secondary: {
              main: "#0284C7",
              light: "#38BDF8",
              dark: "#0369A1",
              contrastText: "#ffffff",
            },
            text: {
              primary: "#111827",
              secondary: "#4B5563",
              disabled: "#9CA3AF",
            },
            divider: "#E5E7EB",
            background: {
              default: "#F9FAFB",
              paper: "#FFFFFF",
              glass: "rgba(255, 255, 255, 0.95)",
            },
          }
        : {
            primary: {
              main: "#4CAF50",
              light: "#81C784",
              dark: "#2E7D32",
              contrastText: "#000000",
            },
            secondary: {
              main: "#38BDF8",
              light: "#7DD3FC",
              dark: "#0284C7",
              contrastText: "#000000",
            },
            text: {
              primary: "#F9FAFB",
              secondary: "#9CA3AF",
              disabled: "#6B7280",
            },
            divider: "#374151",
            background: {
              default: "#111827",
              paper: "#1F2937",
              glass: "rgba(31, 41, 55, 0.95)",
            },
          }),
      success: {
        main: "#16A34A",
        light: "#86EFAC",
        dark: "#15803D",
      },
      warning: {
        main: "#D97706",
        light: "#FDE68A",
        dark: "#B45309",
      },
      error: {
        main: "#DC2626",
        light: "#FCA5A5",
        dark: "#B91C1C",
      },
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 800, letterSpacing: "-0.025em", fontSize: "2rem" },
      h2: { fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1.65rem" },
      h3: { fontWeight: 700, letterSpacing: "-0.015em", fontSize: "1.4rem" },
      h4: { fontWeight: 600, letterSpacing: "-0.01em", fontSize: "1.2rem" },
      h5: { fontWeight: 600, fontSize: "1.05rem" },
      h6: { fontWeight: 600, fontSize: "0.95rem" },
      subtitle1: { fontWeight: 600, fontSize: "0.9rem" },
      subtitle2: { fontWeight: 500, fontSize: "0.85rem" },
      body1: { fontSize: "0.9rem", lineHeight: 1.5 },
      body2: { fontSize: "0.825rem", lineHeight: 1.5 },
      button: { fontWeight: 600, textTransform: "none", fontSize: "0.85rem" },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: "8px 16px",
            boxShadow: "none",
            fontWeight: 600,
            transition: "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
            "&:hover": {
              boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
            },
          },
          containedPrimary: {
            backgroundColor: "#1B5E20",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "#144A18",
              boxShadow: "0 2px 6px rgba(27,94,32,0.25)",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            backgroundColor: mode === "dark" ? "#1F2937" : "#FFFFFF",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
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
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 600,
            fontSize: "0.75rem",
          },
        },
      },
    },
    glass: (opacity) => glassEffect(mode, opacity),
  });

const theme = getTheme("light");
export default theme;
