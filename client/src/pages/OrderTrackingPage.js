/**
 * OrderTrackingPage.js
 * Blinkit-style real-time order tracking page for customers.
 *
 * Layout:
 *   Top ~55%    → Full-screen LiveTrackingMap
 *   Bottom ~45% → Draggable bottom sheet with:
 *                   - ETA countdown
 *                   - Status stepper (6 steps)
 *                   - Delivery partner card
 *                   - Order info
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Chip,
  Divider,
  LinearProgress,
  Button,
  SwipeableDrawer,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  MyLocation as MyLocationIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckIcon,
  AccessTime as TimeIcon,
  TwoWheeler as BikeIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { getOrderById } from "../services/api";
import LiveTrackingMap from "../components/map/LiveTrackingMap";
import {
  smoothInterpolate,
  haversineDistance,
  calculateETA,
  formatETA,
} from "../services/trackingService";
import { DEMO_MODE, getDeviceGPS } from "../config/demoConfig";

// ─── Status Steps ────────────────────────────────────────────────────────────

const STATUS_STEPS = [
  { key: "confirmed", label: "Order Confirmed", icon: "✅" },
  { key: "packed", label: "Packed", icon: "📦" },
  { key: "picked_up", label: "Picked Up", icon: "🏪" },
  { key: "on_the_way", label: "On The Way", icon: "🚴" },
  { key: "arriving", label: "Arriving", icon: "📍" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
];

function getStepIndex(status) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

// ─── Component ───────────────────────────────────────────────────────────────

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const socket = useSocket();

  // Positions
  const [riderPosition, setRiderPosition] = useState(null);
  const [displayPosition, setDisplayPosition] = useState(null);
  const [pickupPosition, setPickupPosition] = useState({
    lat: 18.5204,
    lng: 73.8567,
  });
  const [customerPosition, setCustomerPosition] = useState({
    lat: 18.53,
    lng: 73.86,
  });

  // Status & ETA
  const [currentStatus, setCurrentStatus] = useState("confirmed");
  const [eta, setEta] = useState(null);
  const [followRider, setFollowRider] = useState(true);

  // Order data (for PIN etc.)
  const { token } = useAuth();
  const [orderData, setOrderData] = useState(null);
  const [deliveryPin, setDeliveryPin] = useState(null);

  // Partner details
  const [partner] = useState({
    name: "Rahul Kumar",
    vehicle: "Hero Splendor",
    vehicleNumber: "MH14 GC 2299",
    avatar: "https://i.pravatar.cc/150?img=12",
    phone: "+919876543210",
    rating: 4.8,
  });

  // Bottom sheet
  const [sheetOpen, setSheetOpen] = useState(true);

  // Animation ref
  const cancelAnimRef = useRef(null);

  // DEMO_MODE: Use device GPS for ALL positions so all roles appear at real location
  useEffect(() => {
    if (!DEMO_MODE) return;
    const setPositions = async () => {
      const [pickup, customer] = await Promise.all([
        getDeviceGPS(100), // pickup offset ~100m
        getDeviceGPS(80), // customer offset ~80m
      ]);
      setPickupPosition(pickup);
      setCustomerPosition(customer);
    };
    setPositions();
  }, []);

  // Fetch order data (to get delivery PIN)
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || orderId === "demo-order" || !token) return;
      try {
        const response = await getOrderById(orderId, token);
        const order = response.data || response;
        setOrderData(order);
        if (order.deliveryPin) {
          setDeliveryPin(order.deliveryPin);
        }
        // Use order status if available
        if (order.orderStatus || order.status) {
          const status = order.orderStatus || order.status;
          // Map order statuses to tracking steps
          if (status === "out_for_delivery") setCurrentStatus("on_the_way");
          else if (status === "delivered") setCurrentStatus("delivered");
          else if (status === "processing") setCurrentStatus("packed");
          else if (status === "confirmed") setCurrentStatus("confirmed");
        }
      } catch (err) {
        console.warn("Could not fetch order details for PIN:", err.message);
      }
    };
    fetchOrder();
  }, [orderId, token]);

  // Socket: Listen for location updates
  useEffect(() => {
    if (!socket) return;

    const trackingId = orderId || "demo-order";
    socket.emit("join_tracking", trackingId);

    const handleLocation = (data) => {
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);
      const heading = parseFloat(data.heading) || 0;

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const newPos = { lat, lng, heading };

      // Smooth animation from current to new position
      if (displayPosition) {
        if (cancelAnimRef.current) cancelAnimRef.current();
        cancelAnimRef.current = smoothInterpolate(
          displayPosition,
          newPos,
          2500,
          (interpolated) => setDisplayPosition({ ...interpolated, heading }),
        );
      } else {
        setDisplayPosition(newPos);
      }

      setRiderPosition(newPos);

      // Calculate ETA
      if (customerPosition?.lat) {
        const dist = haversineDistance(
          lat,
          lng,
          customerPosition.lat,
          customerPosition.lng,
        );
        const etaMins = calculateETA(dist);
        setEta(etaMins);
      }
    };

    socket.on("location_updated", handleLocation);

    // Status updates
    const handleStatus = (data) => {
      if (data.status) {
        setCurrentStatus(data.status);
      }
    };
    socket.on("delivery_status_changed", handleStatus);

    return () => {
      socket.off("location_updated", handleLocation);
      socket.off("delivery_status_changed", handleStatus);
      socket.emit("leave_tracking", trackingId);
      if (cancelAnimRef.current) cancelAnimRef.current();
    };
  }, [socket, orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const stepIndex = getStepIndex(currentStatus);
  const isDelivered = currentStatus === "delivered";

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        mx: "auto",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#F5F5F5",
      }}
    >
      {/* ── Top Bar (floating overlay) ── */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          p: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            bgcolor: "rgba(255,255,255,0.9)",
            "&:hover": { bgcolor: "white" },
          }}
          size="small"
        >
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography
          variant="subtitle2"
          sx={{
            color: "white",
            fontWeight: 700,
            textShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          Order #{orderId || "demo-order"}
        </Typography>
        <IconButton
          onClick={() => setFollowRider(!followRider)}
          sx={{
            bgcolor: followRider ? "#2E7D32" : "rgba(255,255,255,0.9)",
            color: followRider ? "white" : "#333",
            "&:hover": { bgcolor: followRider ? "#1B5E20" : "white" },
          }}
          size="small"
        >
          <MyLocationIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* ── ETA Badge (floating) ── */}
      {eta !== null && !isDelivered && (
        <Box
          sx={{
            position: "absolute",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            bgcolor: "white",
            borderRadius: 3,
            px: 2.5,
            py: 1,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <TimeIcon sx={{ fontSize: 18, color: "#2E7D32" }} />
          <Box>
            <Typography
              variant="h6"
              fontWeight={800}
              color="#2E7D32"
              lineHeight={1}
            >
              {formatETA(eta)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.6rem" }}
            >
              Estimated arrival
            </Typography>
          </Box>
        </Box>
      )}

      {isDelivered && (
        <Box
          sx={{
            position: "absolute",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            bgcolor: "#2E7D32",
            borderRadius: 3,
            px: 3,
            py: 1.5,
            boxShadow: "0 4px 20px rgba(46,125,50,0.3)",
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={800}
            color="white"
            textAlign="center"
          >
            🎉 Delivered!
          </Typography>
        </Box>
      )}

      {/* ── Map ── */}
      <Box sx={{ flex: 1, position: "relative" }}>
        <LiveTrackingMap
          riderPosition={displayPosition}
          pickupPosition={pickupPosition}
          customerPosition={customerPosition}
          followRider={followRider}
          riderName={partner.name}
        />
      </Box>

      {/* ── Bottom Sheet ── */}
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.1)",
          p: 2.5,
          pb: 3,
          maxHeight: "45vh",
          overflowY: "auto",
        }}
      >
        {/* Handle */}
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: "#E0E0E0",
            borderRadius: 2,
            mx: "auto",
            mb: 2,
          }}
        />

        {/* ─ Status Stepper ─ */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{
              textTransform: "uppercase",
              letterSpacing: 0.5,
              mb: 1.5,
              display: "block",
              fontSize: "0.65rem",
            }}
          >
            Delivery Status
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
            {STATUS_STEPS.map((step, i) => {
              const isComplete = i <= stepIndex;
              const isCurrent = i === stepIndex;
              return (
                <React.Fragment key={step.key}>
                  {/* Step dot */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: 0,
                      flex: "0 0 auto",
                    }}
                  >
                    <Box
                      sx={{
                        width: isCurrent ? 28 : 20,
                        height: isCurrent ? 28 : 20,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isComplete ? "#2E7D32" : "#E0E0E0",
                        color: "white",
                        fontSize: isCurrent ? "0.75rem" : "0.55rem",
                        transition: "all 0.3s",
                        boxShadow: isCurrent
                          ? "0 0 0 4px rgba(46,125,50,0.2)"
                          : "none",
                      }}
                    >
                      {isComplete ? step.icon : ""}
                    </Box>
                    {isCurrent && (
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="#2E7D32"
                        sx={{
                          fontSize: "0.55rem",
                          mt: 0.3,
                          whiteSpace: "nowrap",
                          textAlign: "center",
                        }}
                      >
                        {step.label}
                      </Typography>
                    )}
                  </Box>

                  {/* Connection line */}
                  {i < STATUS_STEPS.length - 1 && (
                    <Box
                      sx={{
                        flex: 1,
                        height: 3,
                        mx: 0.3,
                        borderRadius: 2,
                        bgcolor: i < stepIndex ? "#2E7D32" : "#E0E0E0",
                        transition: "background 0.5s",
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* ─ Delivery PIN Banner ─ */}
        {deliveryPin && !isDelivered && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 3,
              background: "linear-gradient(135deg, #E8F5E9, #C8E6C9)",
              border: "2px dashed #2E7D32",
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              color="#2E7D32"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: "0.6rem",
              }}
            >
              🔐 Share this PIN with delivery partner
            </Typography>
            <Typography
              variant="h3"
              fontWeight={900}
              color="#1B5E20"
              sx={{ letterSpacing: 6, mt: 0.3 }}
            >
              {deliveryPin}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.6rem" }}
            >
              Required for delivery verification
            </Typography>
          </Box>
        )}

        {/* ─ Delivery Partner Card ─ */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: "#F8FFF8",
            borderRadius: 3,
            p: 1.5,
            mb: 2,
            border: "1px solid #E8F5E9",
          }}
        >
          <Avatar
            src={partner.avatar}
            sx={{ width: 48, height: 48, border: "2px solid #C8E6C9" }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {partner.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <BikeIcon sx={{ fontSize: 13, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {partner.vehicle} · {partner.vehicleNumber}
              </Typography>
            </Box>
            <Chip
              label={`⭐ ${partner.rating}`}
              size="small"
              sx={{
                mt: 0.3,
                height: 18,
                fontSize: "0.6rem",
                fontWeight: 700,
                bgcolor: "#FFF8E1",
                color: "#F57F17",
              }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton
              href={`tel:${partner.phone}`}
              sx={{ bgcolor: "#E3F2FD", "&:hover": { bgcolor: "#BBDEFB" } }}
              size="small"
            >
              <PhoneIcon sx={{ fontSize: 18, color: "#1565C0" }} />
            </IconButton>
            <IconButton
              href={`https://wa.me/${partner.phone.replace(/\D/g, "")}`}
              sx={{ bgcolor: "#E8F5E9", "&:hover": { bgcolor: "#C8E6C9" } }}
              size="small"
            >
              <WhatsAppIcon sx={{ fontSize: 18, color: "#25D366" }} />
            </IconButton>
          </Box>
        </Box>

        {/* ─ Order Info ─ */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Order ID
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              #{orderId || "demo-order"}
            </Typography>
          </Box>
          {eta !== null && !isDelivered && (
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary">
                Distance
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#2E7D32">
                {riderPosition && customerPosition
                  ? `${haversineDistance(riderPosition.lat, riderPosition.lng, customerPosition.lat, customerPosition.lng).toFixed(1)} km`
                  : "—"}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default OrderTrackingPage;
