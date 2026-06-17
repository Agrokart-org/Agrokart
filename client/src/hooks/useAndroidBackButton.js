import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

export const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only attach listener if running as a native Android app
    if (Capacitor.isNativePlatform()) {
      const handleBackButton = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        // If we are at the root or dashboard, we shouldn't exit unless specified
        const exitPaths = ['/', '/login', '/customer-dashboard', '/mobile-vendor-dashboard', '/mobile-delivery-dashboard'];
        
        if (exitPaths.includes(location.pathname)) {
          // If on a root page, exit app
          CapacitorApp.exitApp();
        } else if (canGoBack) {
          // Normal back navigation
          navigate(-1);
        } else {
          CapacitorApp.exitApp();
        }
      });

      return () => {
        handleBackButton.then(listener => listener.remove());
      };
    }
  }, [navigate, location]);
};
