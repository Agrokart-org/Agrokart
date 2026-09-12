import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { API_BASE_URL } from "../services/api";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to the backend server
    const SOCKET_URL =
      process.env.REACT_APP_API_URL ||
      API_BASE_URL.replace(/\/api\/?$/, "") ||
      "https://agrokart-api.onrender.com";
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"], // Force websocket
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err);
    });

    // Debug: Listen for the specific event globally
    newSocket.on("new_order_available", (data) => {
      console.log(
        "📢 GLOBAL SOCKET DEBUG: Received new_order_available:",
        data,
      );
    });

    // Debug: Listen for delivery partner events globally
    newSocket.on("new_assignment", (data) => {
      console.log("📢 GLOBAL SOCKET DEBUG: Received new_assignment:", data);
    });
    newSocket.on("delivery_request", (data) => {
      console.log("📢 GLOBAL SOCKET DEBUG: Received delivery_request:", data);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
