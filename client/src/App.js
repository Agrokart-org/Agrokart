import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import { MobileProvider } from "./context/MobileContext";
import { NotificationProvider } from "./context/NotificationProvider";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppRoutes from "./routes";
import AIChatbot from "./components/AIChatbot";
import WorkflowProvider from "./components/WorkflowManager";
import SplashScreen from "./components/SplashScreen";
import { css, Global } from "@emotion/react";
import { useTheme, useMediaQuery } from "@mui/material";
import RoleSelectionPage from "./components/RoleSelectionPage";
import DeliveryLogin from "./pages/DeliveryLogin";
import UnifiedAuthPage from "./pages/UnifiedAuthPage";
import { useAuth } from "./context/AuthContext";
import MobileServices from "./services/mobileServices";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import "./i18n"; // Initialize i18n
import ErrorBoundary from "./components/ErrorBoundary";

// Main App Content Component (must be inside AuthProvider)
const AppContent = () => {
  const { showRoleSelection, isAuthenticated, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileInitialized, setMobileInitialized] = useState(false);

  // Initialize mobile services
  useEffect(() => {
    const initializeMobile = async () => {
      try {
        await MobileServices.initialize();
        if (Capacitor.isNativePlatform()) {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: "#4CAF50" });
        }
        setMobileInitialized(true);
        console.log("🚀 Mobile app initialized successfully");
      } catch (error) {
        console.error("❌ Mobile initialization error:", error);
        setMobileInitialized(true);
      }
    };

    initializeMobile();
  }, []);

  // Back Button Listener - Single authoritative handler for Android back button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let lastBackTime = 0;
    let lastHandledTime = 0;
    const DOUBLE_PRESS_DELAY = 2000;
    const DEBOUNCE_MS = 300; // Prevent rapid double-fires

    console.log("📱 Attaching native back button listener...");

    const backListener = CapacitorApp.addListener(
      "backButton",
      async ({ canGoBack }) => {
        const now = Date.now();

        // Debounce: ignore if fired too quickly (prevents double-fire from duplicate listeners)
        if (now - lastHandledTime < DEBOUNCE_MS) {
          console.log("[Back] Debounced — ignoring rapid fire");
          return;
        }
        lastHandledTime = now;

        const path = window.location.pathname;
        console.log(
          `[Back] Path: ${path}, CanGoBack: ${canGoBack}, HistoryLength: ${window.history.length}`,
        );

        // 1. Modal Handling — close any open MUI modals/dialogs first
        const openModals = document.querySelectorAll(
          '.MuiModal-root:not([aria-hidden="true"]), .MuiDialog-root:not([aria-hidden="true"]), .MuiDrawer-root:not([aria-hidden="true"])',
        );
        if (openModals.length > 0) {
          console.log("[Back] Closing modal/dialog/drawer");
          const event = new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true,
          });
          document.dispatchEvent(event);
          return;
        }

        // 2. Root/Exit Check — if on a root screen, show exit toast
        const exitRoutes = [
          "/",
          "/home",
          "/login",
          "/customer/dashboard",
          "/vendor/dashboard",
          "/delivery/dashboard",
          "/role-selection",
        ];
        const isRootScreen = exitRoutes.includes(path);

        if (isRootScreen) {
          if (lastBackTime > 0 && now - lastBackTime < DOUBLE_PRESS_DELAY) {
            console.log("[Back] Double press — exiting app");
            CapacitorApp.exitApp();
          } else {
            lastBackTime = now;
            try {
              const { Toast } = await import("@capacitor/toast");
              await Toast.show({
                text: "Press back again to exit",
                duration: "short",
                position: "bottom",
              });
            } catch (e) {
              console.warn("Toast fail", e);
            }
          }
        } else {
          // 3. Navigate Back using React Router (preserves SPA history correctly)
          console.log("[Back] Navigating back via React Router");
          navigate(-1);
        }
      },
    );

    return () => {
      backListener.then((handle) => handle.remove());
    };
  }, [navigate]);

  // Allow auth-related routes to bypass the role-selection gate
  const authBypassPaths = new Set([
    "/login",
    "/register",
    "/vendor/login",
    "/vendor/register",
    "/delivery/login",
    "/delivery/register",
    "/admin/login",
    "/auth", // unified auth if ever used directly
  ]);
  const shouldBypassRoleGate = authBypassPaths.has(location.pathname);

  // For authenticated customers, skip role selection and go to dashboard
  if (isAuthenticated && location.pathname === "/") {
    return <Navigate to="/customer/dashboard" replace />;
  }

  // For new/unauthenticated users, show role selection on normal entry points,
  // but not when they explicitly navigate to a login/register route.
  if (!shouldBypassRoleGate && showRoleSelection && !isAuthenticated) {
    // Mobile First: Redirect to Customer Login directly on mobile
    if (isMobile && location.pathname === "/") {
      return <Navigate to="/login" replace />;
    }
    return <RoleSelectionPage />;
  }

  return (
    <>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
      {/* AI Chatbot - Available on all pages except vendor and delivery apps */}
      {!location.pathname.startsWith('/vendor') && !location.pathname.startsWith('/delivery') && <AIChatbot />}
    </>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const initTimer = setTimeout(() => {
      setAppReady(true);
    }, 100);

    return () => clearTimeout(initTimer);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show splash screen until app is ready and splash duration is complete
  if (showSplash || !appReady) {
    return (
      <ThemeProvider>
        <CssBaseline />
        <SplashScreen onComplete={handleSplashComplete} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <CssBaseline />
      <Router>
        <MobileProvider>
          <NotificationProvider>
            <LanguageProvider>
              <AuthProvider>
                <CartProvider>
                  <SocketProvider>
                    <WorkflowProvider>
                      <AppContent />
                    </WorkflowProvider>
                  </SocketProvider>
                </CartProvider>
              </AuthProvider>
            </LanguageProvider>
          </NotificationProvider>
        </MobileProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
