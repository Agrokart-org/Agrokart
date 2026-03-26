/**
 * LiveTrackingMap.js
 * Blinkit-style real-time delivery tracking map using Leaflet + OpenStreetMap.
 *
 * Features:
 *  - Smooth animated bike marker (CSS transition based)
 *  - Pulsing dot at delivery partner location
 *  - Route polyline from partner → customer (via OSRM)
 *  - Pickup & delivery location markers
 *  - Auto-fit bounds on load, follows rider during delivery
 *  - Clean modern CartoDB Positron tile layer
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Custom Icons ────────────────────────────────────────────────────────────

// Bike / Delivery partner marker (SVG-based, rotatable)
const createBikeIcon = (heading = 0) => {
  return L.divIcon({
    className: "live-bike-marker",
    html: `
            <div style="position:relative; width:44px; height:44px;">
                <div style="
                    position:absolute; inset:0;
                    border-radius:50%;
                    background: rgba(46,125,50,0.15);
                    animation: livePulse 2s ease-out infinite;
                "></div>
                <div style="
                    position:absolute; top:4px; left:4px;
                    width:36px; height:36px;
                    border-radius:50%;
                    background: linear-gradient(135deg, #2E7D32, #43A047);
                    display:flex; align-items:center; justify-content:center;
                    box-shadow: 0 3px 12px rgba(46,125,50,0.5);
                    transform: rotate(${heading}deg);
                    transition: transform 0.8s ease;
                ">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                </div>
            </div>
        `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

// Pickup location marker (vendor/store)
const pickupIcon = L.divIcon({
  className: "custom-pickup-marker",
  html: `
        <div style="
            width:32px; height:32px; border-radius:50%;
            background: linear-gradient(135deg, #FF6B00, #FF9800);
            display:flex; align-items:center; justify-content:center;
            box-shadow: 0 3px 10px rgba(255,107,0,0.4);
            border: 2px solid white;
        ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
            </svg>
        </div>
    `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Delivery location marker (customer home)
const deliveryIcon = L.divIcon({
  className: "custom-delivery-marker",
  html: `
        <div style="
            width:32px; height:32px; border-radius:50%;
            background: linear-gradient(135deg, #1565C0, #42A5F5);
            display:flex; align-items:center; justify-content:center;
            box-shadow: 0 3px 10px rgba(21,101,192,0.4);
            border: 2px solid white;
        ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
        </div>
    `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// ─── Map Controller ──────────────────────────────────────────────────────────

function MapController({ riderPos, pickupPos, customerPos, followRider }) {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      // Fit bounds to show all points on first load
      const points = [pickupPos, customerPos, riderPos].filter(
        (p) => p && p.lat && p.lng,
      );
      if (points.length >= 2) {
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        hasInitialized.current = true;
      } else if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], 15);
        hasInitialized.current = true;
      }
    } else if (followRider && riderPos && riderPos.lat && riderPos.lng) {
      // Smoothly follow the rider
      map.panTo([riderPos.lat, riderPos.lng], { animate: true, duration: 1 });
    }
  }, [riderPos, pickupPos, customerPos, map, followRider]);

  return null;
}

// ─── Route Fetcher (OSRM) ───────────────────────────────────────────────────

async function fetchRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]); // [lat, lng]
      const durationMin = Math.round(data.routes[0].duration / 60);
      const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
      return { coords, durationMin, distanceKm };
    }
  } catch (err) {
    console.warn("OSRM route fetch failed:", err.message);
  }
  return null;
}

// ─── Pulse Animation CSS ─────────────────────────────────────────────────────

const pulseCSS = `
@keyframes livePulse {
    0% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.8); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
}
`;

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * LiveTrackingMap
 *
 * @param {Object} riderPosition - { lat, lng, heading } — delivery partner's live position
 * @param {Object} pickupPosition - { lat, lng } — vendor/store location
 * @param {Object} customerPosition - { lat, lng } — customer's delivery address
 * @param {boolean} followRider - Auto-pan map to follow rider (default: true)
 * @param {string} riderName - Name to show in popup
 */
const LiveTrackingMap = ({
  riderPosition,
  pickupPosition,
  customerPosition,
  followRider = true,
  riderName = "Delivery Partner",
}) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const lastRouteRef = useRef(null);

  // Fetch route when rider or customer position changes significantly
  useEffect(() => {
    if (!riderPosition?.lat || !customerPosition?.lat) return;

    // Only re-fetch route if rider moved significantly (>100m)
    const lastPos = lastRouteRef.current;
    if (lastPos) {
      const dist =
        Math.abs(lastPos.lat - riderPosition.lat) +
        Math.abs(lastPos.lng - riderPosition.lng);
      if (dist < 0.001) return; // ~100m threshold
    }

    lastRouteRef.current = { lat: riderPosition.lat, lng: riderPosition.lng };

    fetchRoute(riderPosition, customerPosition).then((route) => {
      if (route) {
        setRouteCoords(route.coords);
      }
    });
  }, [riderPosition, customerPosition]);

  // Default center (Pune, India)
  const defaultCenter = [
    pickupPosition?.lat || customerPosition?.lat || 18.5204,
    pickupPosition?.lng || customerPosition?.lng || 73.8567,
  ];

  return (
    <>
      {/* Inject pulse animation CSS */}
      <style>{pulseCSS}</style>

      <MapContainer
        center={defaultCenter}
        zoom={15}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* Clean modern tile layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Map controller for auto-panning */}
        <MapController
          riderPos={riderPosition}
          pickupPos={pickupPosition}
          customerPos={customerPosition}
          followRider={followRider}
        />

        {/* Route polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: "#2E7D32",
              weight: 4,
              opacity: 0.7,
              dashArray: "8, 12",
              lineCap: "round",
            }}
          />
        )}

        {/* Pickup marker (vendor) */}
        {pickupPosition?.lat && (
          <Marker
            position={[pickupPosition.lat, pickupPosition.lng]}
            icon={pickupIcon}
          >
            <Popup>
              <strong>📦 Pickup</strong>
              <br />
              {pickupPosition.address || "Vendor location"}
            </Popup>
          </Marker>
        )}

        {/* Delivery marker (customer) */}
        {customerPosition?.lat && (
          <Marker
            position={[customerPosition.lat, customerPosition.lng]}
            icon={deliveryIcon}
          >
            <Popup>
              <strong>📍 Delivery</strong>
              <br />
              {customerPosition.address || "Your location"}
            </Popup>
          </Marker>
        )}

        {/* Delivery partner (rider) marker — animated */}
        {riderPosition?.lat && (
          <Marker
            position={[riderPosition.lat, riderPosition.lng]}
            icon={createBikeIcon(riderPosition.heading || 0)}
          >
            <Popup>
              <strong>🚴 {riderName}</strong>
              <br />
              Live location
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </>
  );
};

export default LiveTrackingMap;
