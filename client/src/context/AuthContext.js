import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { Capacitor } from "@capacitor/core";
import AgrokartLoader from "../components/AgrokartLoader";
import { getApiBaseUrl } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(true);

  const [token, setToken] = useState(localStorage.getItem("authToken"));

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    if (savedRole) {
      setUserRole(savedRole);
    }

    // Handle redirect result for Mobile Google Login
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          console.log("🔥 Redirect login successful:", result.user.email);
          // onAuthStateChanged will handle the rest
        }
      })
      .catch((error) => {
        console.error("❌ Redirect login error:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log(
        "🔥 AuthStateChanged:",
        currentUser ? `User ${currentUser.email}` : "No User",
      );

      if (currentUser) {
        // User is signed in with Firebase
        const idToken = await currentUser.getIdToken();
        localStorage.setItem("firebaseToken", idToken);
        localStorage.setItem("authToken", idToken);
        localStorage.setItem("token", idToken);
        setToken(idToken);

        const currentRole = localStorage.getItem("userRole") || "customer";
        console.log("👤 Setting user in context. Role:", currentRole);

        // Basic info from Firebase
        let userData = {
          id: currentUser.uid,
          _id: currentUser.uid,
          name: currentUser.displayName || currentUser.email.split("@")[0],
          email: currentUser.email,
          phone: currentUser.phoneNumber,
          role: currentRole,
        };

        // Sync with backend using /auth/login to ensure user exists
        try {
          const apiUrl = getApiBaseUrl();
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken, expectedRole: currentRole }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log("✅ Backend sync successful:", data.user);
            userData = { ...userData, ...data.user };
            userData.id = data.user.id || data.user._id || currentUser.uid;
            userData._id = userData.id;

            const finalToken = data.token || idToken;
            localStorage.setItem("authToken", finalToken);
            localStorage.setItem("token", finalToken);
            setToken(finalToken);

            if (data.user.role) {
              localStorage.setItem("userRole", data.user.role);
              setUserRole(data.user.role);
            }
          } else {
            console.warn("Backend sync failed:", response.status);
            userData.role = currentRole;
          }
        } catch (err) {
          console.error("Failed to sync with backend:", err);
          userData.role = currentRole;
        }

        localStorage.setItem("userData", JSON.stringify(userData));
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userRole", userData.role);
        localStorage.setItem("userEmail", userData.email);
        localStorage.setItem("isLoggedIn", "true");

        setUser(userData);
        setIsAuthenticated(true);
        setShowRoleSelection(false);
      } else {
        // Firebase currentUser is null. Check for local backend JWT session
        const savedToken =
          localStorage.getItem("authToken") ||
          localStorage.getItem("token") ||
          localStorage.getItem("firebaseToken");
        const savedUserStr =
          localStorage.getItem("userData") || localStorage.getItem("user");
        const savedRole = localStorage.getItem("userRole");

        if (savedToken && savedUserStr) {
          try {
            const parsedUser = JSON.parse(savedUserStr);
            console.log("✅ Restored persistent user session:", parsedUser.email);
            setUser(parsedUser);
            setUserRole(parsedUser.role || savedRole || "customer");
            setToken(savedToken);
            setIsAuthenticated(true);
            setShowRoleSelection(false);

            // Re-align storage keys
            localStorage.setItem("authToken", savedToken);
            localStorage.setItem("token", savedToken);
            localStorage.setItem("userData", savedUserStr);
            localStorage.setItem("user", savedUserStr);
            localStorage.setItem("isLoggedIn", "true");
          } catch (e) {
            console.error("Failed to parse saved user data:", e);
            localStorage.removeItem("authToken");
            localStorage.removeItem("token");
            localStorage.removeItem("firebaseToken");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userData");
            localStorage.removeItem("user");
            localStorage.removeItem("isLoggedIn");
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            setShowRoleSelection(true);
          }
        } else {
          console.log("👋 User signed out, clearing state");
          localStorage.removeItem("authToken");
          localStorage.removeItem("token");
          localStorage.removeItem("firebaseToken");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userData");
          localStorage.removeItem("user");
          localStorage.removeItem("isLoggedIn");
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          setShowRoleSelection(true);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh token helper
  const refreshToken = useCallback(async () => {
    if (auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken(true);
      localStorage.setItem("authToken", idToken);
      setToken(idToken);
      return idToken;
    }
    return null;
  }, []);

  // ... (keep usage of other functions like register, login etc.)

  // Firebase register with email and password
  const register = useCallback(async (userData) => {
    console.log("🔄 AuthContext register function called with:", {
      email: userData.email,
      name: userData.name,
      role: userData.role,
    });
    setLoading(true);
    try {
      if (!auth) {
        throw new Error("Firebase authentication is not available");
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password,
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: userData.name,
      });

      if (userData.role) {
        localStorage.setItem("userRole", userData.role);
        setUserRole(userData.role);
      }

      return { success: true, user };
    } catch (error) {
      console.error("❌ Firebase registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Backend customer email/password login (POST /api/auth/login)
  // Backend customer email/password login (POST /api/auth/login)
  const login = useCallback(
    async (emailOrCredentials, password, expectedRole = "customer") => {
      setLoading(true);
      try {
        let payload;
        if (typeof emailOrCredentials === "object" && emailOrCredentials !== null) {
          payload = {
            expectedRole: "customer",
            ...emailOrCredentials,
          };
        } else {
          payload = {
            email: emailOrCredentials,
            password: password,
            expectedRole: expectedRole || "customer",
          };
        }

        const apiUrl = getApiBaseUrl();

        const response = await fetch(`${apiUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          const err = new Error(data.message || "Login failed");
          err.status = response.status;
          throw err;
        }

        const userObj = data.user;
        const userToken = data.token;

        localStorage.setItem("authToken", userToken);
        localStorage.setItem("token", userToken);
        localStorage.setItem("userRole", userObj.role);
        localStorage.setItem("userEmail", userObj.email);
        localStorage.setItem("userName", userObj.name || "");
        localStorage.setItem("userData", JSON.stringify(userObj));
        localStorage.setItem("user", JSON.stringify(userObj));
        localStorage.setItem("isLoggedIn", "true");

        setToken(userToken);
        setUser(userObj);
        setUserRole(userObj.role);
        setIsAuthenticated(true);
        setShowRoleSelection(false);

        return { success: true, user: userObj, token: userToken };
      } catch (error) {
        console.error("Backend login error:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Google Login — supports both Web (Popup/Redirect) and Mobile Native APK
  const googleLogin = useCallback(async () => {
    setLoading(true);
    try {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // Native Android APK: use @capgo/capacitor-social-login
        const { SocialLogin } = await import("@capgo/capacitor-social-login");
        await SocialLogin.initialize({
          google: {
            webClientId: "425831974831-2vvplda38aoa1n8vvb2uhbt052udhebl.apps.googleusercontent.com",
          },
        });

        const result = await SocialLogin.login({
          provider: "google",
          options: {
            scopes: ["email", "profile"],
          },
        });

        console.log("📱 Native Google Sign-In result:", result);

        if (result?.result?.idToken) {
          const credential = GoogleAuthProvider.credential(result.result.idToken);
          const firebaseResult = await signInWithCredential(auth, credential);
          if (userRole) localStorage.setItem("userRole", userRole);
          return { success: true, user: firebaseResult.user };
        } else {
          throw new Error("No ID token received from Google Sign-In");
        }
      } else {
        // Standard Web Browser (Desktop / Mobile web on Vercel)
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        let firebaseResult;
        try {
          firebaseResult = await signInWithPopup(auth, provider);
        } catch (popupErr) {
          console.warn("Popup blocked or failed, attempting redirect:", popupErr.code);
          if (popupErr.code === "auth/popup-blocked" || popupErr.code === "auth/cancelled-popup-request") {
            return await signInWithRedirect(auth, provider);
          }
          throw popupErr;
        }

        if (userRole) {
          localStorage.setItem("userRole", userRole);
        }
        return { success: true, user: firebaseResult.user };
      }
    } catch (error) {
      console.error("❌ Google login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Send OTP
  const sendOtp = useCallback(async (phoneNumber, recaptchaContainerId) => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          recaptchaContainerId,
          {
            size: "invisible",
            callback: () => {},
          },
        );
      }
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier,
      );
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
  const verifyOtp = useCallback(
    async (otpCode) => {
      setLoading(true);
      try {
        if (!window.confirmationResult)
          throw new Error("No OTP request found.");
        const result = await window.confirmationResult.confirm(otpCode);
        const user = result.user;
        if (userRole) localStorage.setItem("userRole", userRole);
        return { success: true, user };
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [userRole],
  );

  // Firebase password reset
  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }, []);

  // Complete logout: clears Firebase session and all localStorage auth keys
  const logout = useCallback(async () => {
    try {
      try {
        await signOut(auth);
      } catch (e) {}
      localStorage.removeItem("userRole");
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      localStorage.removeItem("firebaseToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("user");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("isLoggedIn");
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
    localStorage.setItem("userRole", role);
    setUserRole(role);
  }, []);

  const selectRole = useCallback(
    (role) => {
      setRole(role);
    },
    [setRole],
  );

  /*
   * Update User Profile (Name, Photo)
   * Note: Email update requires re-authentication, so it's handled separately or restricted.
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user found");

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      return { success: true };
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(
    async (profileData) => {
      setLoading(true);
      try {
        if (!auth.currentUser) throw new Error("No authenticated user found");

        const updates = {};
        if (profileData.name) updates.displayName = profileData.name;
        if (profileData.photoURL) updates.photoURL = profileData.photoURL;

        // Update Firebase Profile
        await updateProfile(auth.currentUser, updates);

        // Update Local State
        const updatedUser = { ...user, ...profileData };
        if (profileData.name) updatedUser.name = profileData.name;

        setUser(updatedUser);
        return { success: true, user: updatedUser };
      } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  const setAuthenticationStatus = useCallback((status) => {
    setIsAuthenticated(status);
  }, []);

  const hideRoleSelection = useCallback(() => {
    setShowRoleSelection(false);
  }, []);

  const value = React.useMemo(
    () => ({
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
      updateUser, // Legacy local update
      updateUserProfile, // New Firebase update
      changePassword,
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
      authLogin: (credentials) =>
        login(credentials.email, credentials.password),
      authRegister: (userData) => register(userData),
    }),
    [
      isAuthenticated,
      user,
      token,
      userRole,
      loading,
      showRoleSelection,
      setRole,
      selectRole,
      updateUser,
      updateUserProfile,
      changePassword,
      setAuthenticationStatus,
      hideRoleSelection,
      login,
      logout,
      register,
      resetPassword,
      refreshToken,
    ],
  );

  if (loading) {
    return <AgrokartLoader message="Connecting with Agrokart app..." />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
