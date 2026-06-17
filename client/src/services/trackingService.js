/**
 * trackingService.js
 * Real-time GPS tracking service for delivery partners.
 *
 * Features:
 *  - Capacitor Geolocation.watchPosition() for native GPS (high accuracy)
 *  - Falls back to navigator.geolocation.watchPosition() on web
 *  - Throttled socket emission (every LOCATION_UPDATE_INTERVAL ms)
 *  - Smooth coordinate interpolation via requestAnimationFrame
 *  - Bearing/heading calculation for bike icon rotation
 *  - DEMO_MODE support (same GPS for all roles on one device)
 *  - Haversine distance + ETA calculation
 */

import { LOCATION_UPDATE_INTERVAL, AVG_SPEED_KMH } from "../config/demoConfig";
import { Capacitor } from "@capacitor/core";

// ─── State ───────────────────────────────────────────────────────────────────
let watchId = null;
let lastEmitTime = 0;
let currentSocket = null;
let currentAssignmentId = null;
let currentOrderId = null;
let isCapacitorWatch = false; // Track which API we used to start

// ─── GPS Tracking ────────────────────────────────────────────────────────────

/**
 * Start sending live GPS coordinates via socket.
 * Call this when delivery partner taps "Start Delivery".
 *
 * @param {Object} socket - Socket.IO instance from useSocket()
 * @param {string} assignmentId - DeliveryAssignment._id
 * @param {string} orderId - Order._id (used for room broadcasting)
 * @param {function} onLocationUpdate - Optional callback with { lat, lng, heading, speed }
 */
export async function startLocationTracking(
  socket,
  assignmentId,
  orderId,
  onLocationUpdate,
) {
  if (watchId !== null) {
    console.warn(
      "⚠️ Tracking already active. Call stopLocationTracking() first.",
    );
    return;
  }

  currentSocket = socket;
  currentAssignmentId = assignmentId;
  currentOrderId = orderId;

  console.log(
    `📍 Starting GPS tracking for assignment=${assignmentId}, order=${orderId}`,
  );

  // Join the tracking room
  if (socket) {
    socket.emit("join_tracking", orderId);
  }

  let prevLat = null;
  let prevLng = null;

  const handlePosition = (lat, lng, speed, gpsHeading) => {
    const now = Date.now();

    // Calculate heading from previous position if GPS doesn't provide it
    let heading = gpsHeading || 0;
    if (
      prevLat !== null &&
      prevLng !== null &&
      (!gpsHeading || gpsHeading < 0)
    ) {
      heading = calculateBearing(prevLat, prevLng, lat, lng);
    }

    // Throttle socket emissions
    if (now - lastEmitTime >= LOCATION_UPDATE_INTERVAL && socket) {
      lastEmitTime = now;

      socket.emit("delivery_location_update", {
        assignmentId,
        orderId,
        lat,
        lng,
        heading,
        speed: speed || 0,
        timestamp: now,
      });
    }

    // Always call the local callback (for delivery partner's own UI)
    if (onLocationUpdate) {
      onLocationUpdate({ lat, lng, heading, speed: speed || 0 });
    }

    prevLat = lat;
    prevLng = lng;
  };

  // Try Capacitor Geolocation first (native GPS — much more accurate)
  if (Capacitor.isNativePlatform()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");

      // Request permission first
      const permResult = await Geolocation.checkPermissions();
      if (permResult.location !== "granted") {
        await Geolocation.requestPermissions();
      }

      watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
        (position, err) => {
          if (err) {
            console.error("❌ Capacitor Geolocation error:", err);
            return;
          }
          if (position) {
            handlePosition(
              position.coords.latitude,
              position.coords.longitude,
              position.coords.speed,
              position.coords.heading,
            );
          }
        },
      );
      isCapacitorWatch = true;
      console.log("📍 Using Capacitor native GPS for tracking");
      return;
    } catch (e) {
      console.warn("⚠️ Capacitor Geolocation failed, falling back to navigator:", e);
    }
  }

  // Fallback: browser navigator.geolocation
  if (!navigator.geolocation) {
    console.error("❌ Geolocation not supported by this browser.");
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      handlePosition(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.speed,
        position.coords.heading,
      );
    },
    (error) => {
      console.error("❌ Geolocation error:", error.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    },
  );
  isCapacitorWatch = false;
  console.log("📍 Using browser navigator.geolocation for tracking");
}

/**
 * Stop GPS tracking and clean up.
 * Call this when delivery is marked as "Delivered" or cancelled.
 */
export async function stopLocationTracking() {
  if (watchId !== null) {
    if (isCapacitorWatch) {
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        await Geolocation.clearWatch({ id: watchId });
      } catch (e) {
        console.warn("⚠️ Failed to clear Capacitor watch:", e);
      }
    } else {
      navigator.geolocation.clearWatch(watchId);
    }
    watchId = null;
    isCapacitorWatch = false;
    console.log("📍 GPS tracking stopped.");
  }

  if (currentSocket && currentOrderId) {
    currentSocket.emit("leave_tracking", currentOrderId);
  }

  currentSocket = null;
  currentAssignmentId = null;
  currentOrderId = null;
  lastEmitTime = 0;
}

/**
 * Check if tracking is currently active.
 */
export function isTrackingActive() {
  return watchId !== null;
}

// ─── Smooth Interpolation ────────────────────────────────────────────────────

/**
 * Smoothly interpolate a marker from one position to another.
 * Uses requestAnimationFrame for buttery-smooth 60fps animation.
 *
 * @param {{ lat: number, lng: number }} from - Start position
 * @param {{ lat: number, lng: number }} to   - End position
 * @param {number} duration - Animation duration in ms (default 2500ms)
 * @param {function} onFrame - Callback with interpolated { lat, lng } each frame
 * @returns {function} Cancel function
 */
export function smoothInterpolate(from, to, duration = 2500, onFrame) {
  const startTime = performance.now();
  let animId = null;

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out cubic for natural deceleration
    const eased = 1 - Math.pow(1 - progress, 3);

    const lat = from.lat + (to.lat - from.lat) * eased;
    const lng = from.lng + (to.lng - from.lng) * eased;

    onFrame({ lat, lng });

    if (progress < 1) {
      animId = requestAnimationFrame(animate);
    }
  }

  animId = requestAnimationFrame(animate);

  // Return cancel function
  return () => {
    if (animId) cancelAnimationFrame(animId);
  };
}

// ─── Bearing / Heading ───────────────────────────────────────────────────────

/**
 * Calculate bearing angle between two GPS coordinates.
 * Used to rotate the bike/vehicle icon on the map.
 *
 * @returns {number} Bearing in degrees (0-360, 0 = North)
 */
export function calculateBearing(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  let bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

// ─── Distance & ETA ──────────────────────────────────────────────────────────

/**
 * Haversine distance between two GPS points (in km).
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estimate arrival time in minutes.
 *
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} speedKmh - Speed in km/h (default from config)
 * @returns {number} ETA in minutes
 */
export function calculateETA(distanceKm, speedKmh = AVG_SPEED_KMH) {
  if (distanceKm <= 0 || speedKmh <= 0) return 0;
  return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
}

/**
 * Format ETA into human-readable string.
 * @param {number} minutes
 */
export function formatETA(minutes) {
  if (minutes <= 0) return "Arrived";
  if (minutes < 1) return "Less than a minute";
  if (minutes === 1) return "1 min";
  if (minutes < 60) return `${minutes} mins`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export default {
  startLocationTracking,
  stopLocationTracking,
  isTrackingActive,
  smoothInterpolate,
  calculateBearing,
  haversineDistance,
  calculateETA,
  formatETA,
};
