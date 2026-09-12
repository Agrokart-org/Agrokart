import axios from "axios";
import { auth } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

import { getApiBaseUrl } from "./api";

const API_URL = getApiBaseUrl();

const authService = {
  // Login with email and password using backend POST /api/auth/login
  login: async (email, password, expectedRole = "customer") => {
    try {
      console.log("Logging in via backend API:", email);

      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        expectedRole,
      });

      const { user, token } = response.data;

      localStorage.setItem("authToken", token);
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userName", user.name || "");
      localStorage.setItem("userData", JSON.stringify(user));
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("isLoggedIn", "true");

      return response.data;
    } catch (error) {
      console.error("Backend login error:", error);
      if (error.response && error.response.data && error.response.data.message) {
        const errObj = new Error(error.response.data.message);
        errObj.status = error.response.status;
        throw errObj;
      }
      throw error;
    }
  },

  // Send OTP
  sendOtp: async (phone) => {
    try {
      console.log("Sending OTP to:", phone);
      const response = await axios.post(`${API_URL}/auth/send-otp`, { phone });
      console.log("OTP sent successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error sending OTP:",
        error.response?.data || error.message,
      );
      throw error.response?.data || { message: "Failed to send OTP" };
    }
  },

  // Verify OTP
  verifyOtp: async (phone, otp) => {
    try {
      console.log("Verifying OTP:", { phone, otp });
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        phone,
        otp,
      });
      console.log("OTP verification response:", response.data);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        console.log("User data stored in localStorage");
      }
      return response.data;
    } catch (error) {
      console.error(
        "Error verifying OTP:",
        error.response?.data || error.message,
      );
      throw error.response?.data || { message: "Failed to verify OTP" };
    }
  },

  // Get current user using Firebase
  getCurrentUser: async () => {
    try {
      // Check if user is logged in with Firebase
      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      // Get the Firebase ID token
      const idToken = await currentUser.getIdToken();
      console.log("Getting current user with Firebase token");

      // Get user data from backend using Firebase token
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { "firebase-auth-token": idToken },
      });

      console.log("Current user data:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error getting current user:", error.message);
      localStorage.removeItem("firebaseToken");
      localStorage.removeItem("isLoggedIn");
      throw { message: "Failed to get user data" };
    }
  },

  // Logout
  logout: async () => {
    try {
      console.log("Logging out user");
      try {
        await signOut(auth);
      } catch (e) {}
      localStorage.removeItem("firebaseToken");
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("userData");
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");
    } catch (error) {
      console.error("Error during logout:", error.message);
      throw { message: "Failed to logout" };
    }
  },

  // Register user
  register: async (name, email, password, phone) => {
    try {
      console.log("Registering user:", { name, email, phone });

      let idToken = null;
      let firebaseUid = null;

      // Try Firebase registration first if available
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const firebaseUser = userCredential.user;
        await updateProfile(firebaseUser, { displayName: name });
        idToken = await firebaseUser.getIdToken();
        firebaseUid = firebaseUser.uid;
      } catch (fbError) {
        console.warn("Firebase direct register skipped/failed:", fbError.code || fbError.message);
        if (fbError.code === "auth/email-already-in-use") {
          throw { message: "An account with this email already exists. Please log in." };
        }
        // If other Firebase error (e.g. domain not authorized), continue to direct backend registration
      }

      // Register user in our backend
      const headers = idToken ? { "firebase-auth-token": idToken } : {};
      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          name,
          email,
          password,
          phone,
          firebaseUid: firebaseUid || undefined,
          role: "customer",
        },
        { headers }
      );

      console.log("Registration successful:", response.data);

      const returnedUser = response.data.user || response.data;
      const finalToken = response.data.token || idToken || "customer-jwt-token";

      // Store token and user data across all storage keys
      localStorage.setItem("authToken", finalToken);
      localStorage.setItem("token", finalToken);
      if (idToken) localStorage.setItem("firebaseToken", idToken);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userName", name);
      localStorage.setItem("userRole", returnedUser.role || "customer");
      localStorage.setItem("userData", JSON.stringify(returnedUser));
      localStorage.setItem("user", JSON.stringify(returnedUser));
      localStorage.setItem("isLoggedIn", "true");

      return {
        token: finalToken,
        user: returnedUser,
      };
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.data?.message) {
        throw { message: error.response.data.message };
      }
      throw { message: error.message || "Failed to register. Please try again." };
    }
  },

  // Reset password using Firebase
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { message: "Password reset email sent successfully" };
    } catch (error) {
      console.error("Error sending password reset email:", error.message);
      throw {
        message: "Failed to send password reset email. " + error.message,
      };
    }
  },
};

export default authService;
