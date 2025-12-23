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

  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is signed in
        const idToken = await currentUser.getIdToken();
        localStorage.setItem('authToken', idToken);
        setToken(idToken);

        setUser({
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email.split('@')[0],
          email: currentUser.email,
          phone: currentUser.phoneNumber,
          role: localStorage.getItem('userRole') || 'customer'
        });
        setIsAuthenticated(true);
        setShowRoleSelection(false);
      } else {
        // User is signed out
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setShowRoleSelection(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh token helper
  const refreshToken = useCallback(async () => {
    if (auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken(true);
      localStorage.setItem('authToken', idToken);
      setToken(idToken);
      return idToken;
    }
    return null;
  }, []);

  // ... (keep usage of other functions like register, login etc.)

  // Firebase register with email and password
  const register = useCallback(async (userData) => {
    console.log('🔄 AuthContext register function called with:', {
      email: userData.email,
      name: userData.name,
      role: userData.role
    });
    setLoading(true);
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not available');
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: userData.name
      });

      if (userData.role) {
        localStorage.setItem('userRole', userData.role);
        setUserRole(userData.role);
      }

      return { success: true, user };
    } catch (error) {
      console.error('❌ Firebase registration error:', error);
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
      if (userRole) {
        localStorage.setItem('userRole', userRole);
      }
      return { success: true, user };
    } catch (error) {
      console.error('Firebase login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Google Login
  const googleLogin = useCallback(async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (userRole) {
        localStorage.setItem('userRole', userRole);
      }
      return { success: true, user };
    } catch (error) {
      console.error('❌ Google login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Send OTP
  const sendOtp = useCallback(async (phoneNumber, recaptchaContainerId) => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
          'size': 'invisible',
          'callback': () => { }
        });
      }
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      return { success: true, confirmationResult };
    } catch (error) {
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
      if (!window.confirmationResult) throw new Error('No OTP request found.');
      const result = await window.confirmationResult.confirm(otpCode);
      const user = result.user;
      if (userRole) localStorage.setItem('userRole', userRole);
      return { success: true, user };
    } catch (error) {
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
      throw error;
    }
  }, []);

  // Firebase logout
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userRole');
      localStorage.removeItem('authToken');
      setUserRole(null);
      setToken(null);
      setIsAuthenticated(false);
      setUser(null);
      setShowRoleSelection(true);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }, []);

  const setRole = useCallback((role) => {
    localStorage.setItem('userRole', role);
    setUserRole(role);
  }, []);

  const selectRole = useCallback((role) => {
    setRole(role);
  }, [setRole]);

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  const setAuthenticationStatus = useCallback((status) => {
    setIsAuthenticated(status);
  }, []);

  const hideRoleSelection = useCallback(() => {
    setShowRoleSelection(false);
  }, []);

  const value = React.useMemo(() => ({
    isAuthenticated,
    user,
    token, // Expose token
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
    refreshToken, // Expose refresh token function
    getCurrentUser: () => auth.currentUser,
    isUserAuthenticated: () => !!auth.currentUser,
    authLogin: (credentials) => login(credentials.email, credentials.password),
    authRegister: (userData) => register(userData)
  }), [
    isAuthenticated,
    user,
    token,
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
    resetPassword,
    refreshToken
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