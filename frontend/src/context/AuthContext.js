import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider
} from 'firebase/auth';
import { auth } from '../config/firebase';
import AgrokartLoader from '../components/AgrokartLoader';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(true);

  useEffect(() => {
    // Check for Firebase auth state and localStorage role
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
    }

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is signed in
        setUser({
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email.split('@')[0],
          email: currentUser.email,
          phone: currentUser.phoneNumber,
          role: localStorage.getItem('userRole') || 'customer'
        });
        setIsAuthenticated(true);
        setShowRoleSelection(false); // Hide role selection if user is logged in
      } else {
        // User is signed out
        setUser(null);
        setIsAuthenticated(false);
        setShowRoleSelection(true); // Show unified auth page for new users
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Firebase register with email and password
  const register = useCallback(async (userData) => {
    console.log('🔄 AuthContext register function called with:', {
      email: userData.email,
      name: userData.name,
      role: userData.role
    });
    setLoading(true);
    try {
      // Check if Firebase auth is properly initialized
      if (!auth) {
        console.error('❌ Firebase Auth is not initialized:', auth);
        throw new Error('Firebase authentication is not available');
      }

      console.log('⏳ Attempting to create user with Firebase Authentication');
      // Create user with Firebase Authentication
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );
        const user = userCredential.user;
        console.log('✅ User created successfully:', user.uid);
      } catch (createUserError) {
        console.error('❌ Error creating user:', createUserError.code, createUserError.message);
        // Check for specific Firebase errors
        if (createUserError.code === 'auth/email-already-in-use') {
          throw new Error('Email is already in use. Please use a different email or try logging in.');
        } else if (createUserError.code === 'auth/network-request-failed') {
          throw new Error('Network error. Please check your internet connection and try again.');
        } else if (createUserError.code === 'auth/weak-password') {
          throw new Error('Password is too weak. Please use a stronger password.');
        } else {
          throw createUserError;
        }
      }

      const user = userCredential.user;

      console.log('⏳ Updating user profile with name');
      // Update profile with name
      try {
        await updateProfile(user, {
          displayName: userData.name
        });
        console.log('✅ User profile updated successfully');
      } catch (profileError) {
        console.error('⚠️ Error updating profile:', profileError);
        // Continue despite profile update error
      }

      // Store role in localStorage
      if (userData.role) {
        try {
          console.log('⏳ Storing user role in localStorage:', userData.role);
          localStorage.setItem('userRole', userData.role);
          setUserRole(userData.role);
        } catch (storageError) {
          console.error('⚠️ Error storing user role in localStorage:', storageError);
          // Continue despite localStorage error
        }
      }

      console.log('✅ Firebase registration successful:', user.email);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Firebase registration error:', error.code || 'unknown', error.message, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Firebase login with email and password
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store role in localStorage
      if (userRole) {
        localStorage.setItem('userRole', userRole);
      }

      console.log('Firebase login successful:', user.email);
      return { success: true, user };
    } catch (error) {
      console.error('Firebase login error:', error.code, error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Google Login
  const googleLogin = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Initiating Google Login...');
      alert('Clicking Google Login...'); // Visual confirmation
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      alert('Popup finished'); // Visual confirmation
      const user = result.user;

      // Store role in localStorage if exists
      if (userRole) {
        localStorage.setItem('userRole', userRole);
      }

      console.log('✅ Google login successful:', user.email);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Google login error:', error.code, error.message);
      alert(`Google Login Error: ${error.message}`); // Show error to user
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Send OTP
  const sendOtp = useCallback(async (phoneNumber, recaptchaContainerId) => {
    try {
      console.log('📱 Sending OTP to:', phoneNumber);

      // Initialize RecaptchaVerifier
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
          'size': 'invisible',
          'callback': (response) => {
            console.log('Recaptcha verified');
          }
        });
      }

      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

      // Store confirmation result in window to verify later
      window.confirmationResult = confirmationResult;

      console.log('✅ OTP sent successfully');
      return { success: true, confirmationResult };
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      // Reset recaptcha if error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      throw error;
    }
  }, []);

  // Verify OTP
  const verifyOtp = useCallback(async (otpCode) => {
    setLoading(true);
    try {
      if (!window.confirmationResult) {
        throw new Error('No OTP request found. Please request OTP first.');
      }

      const result = await window.confirmationResult.confirm(otpCode);
      const user = result.user;

      // Store role
      if (userRole) {
        localStorage.setItem('userRole', userRole);
      }

      console.log('✅ OTP Verified:', user.phoneNumber);
      return { success: true, user };
    } catch (error) {
      console.error('❌ OTP Verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userRole]);





  // Firebase password reset
  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Firebase password reset error:', error);
      throw error;
    }
  }, []);

  // Firebase logout
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userRole');
      setUserRole(null);
      setIsAuthenticated(false);
      setUser(null);
      setShowRoleSelection(true);
      return { success: true };
    } catch (error) {
      console.error('Firebase logout error:', error);
      throw error;
    }
  }, []);

  // Set user role (used during role selection)
  const setRole = useCallback((role) => {
    localStorage.setItem('userRole', role);
    setUserRole(role);
  }, []);

  // Role selection helper used by RoleSelectionPage
  const selectRole = useCallback((role) => {
    setRole(role);
    // Don't hide role selection here - let the route implementation handle visibility
    // This prevents showing the 'home' page if the user navigates back to '/' without logging in
    // setShowRoleSelection(false); 
  }, [setRole]);

  // Update user data (used after registration)
  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  // Set authentication status
  const setAuthenticationStatus = useCallback((status) => {
    setIsAuthenticated(status);
  }, []);

  const hideRoleSelection = useCallback(() => {
    setShowRoleSelection(false);
  }, []);

  const value = React.useMemo(() => ({
    isAuthenticated,
    user,
    userRole,
    loading,
    showRoleSelection,
    setUserRole,
    setShowRoleSelection,
    setRole,
    selectRole,
    updateUser,
    setIsAuthenticated: setAuthenticationStatus,
    hideRoleSelection,
    login,
    logout,
    register,
    resetPassword,
    googleLogin,
    sendOtp,
    verifyOtp,
    getCurrentUser: () => auth.currentUser,
    isUserAuthenticated: () => !!auth.currentUser,
    // Legacy API compatibility
    authLogin: (credentials) => login(credentials.email, credentials.password),
    authRegister: (userData) => register(userData)
  }), [
    isAuthenticated,
    user,
    userRole,
    loading,
    showRoleSelection,
    setRole,
    selectRole,
    updateUser,
    setAuthenticationStatus,
    hideRoleSelection,
    login,
    logout,
    register,
    resetPassword
  ]);

  if (loading) {
    return <AgrokartLoader message="Connecting with Agrokart app..." />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};