/**
 * demoConfig.js
 * Configuration for college demo mode.
 *
 * DEMO_MODE = true  → All roles use same GPS on one device
 * DEMO_MODE = false → Normal multi-device tracking
 */

export const DEMO_MODE = false;

// How often to send location updates (ms)
export const LOCATION_UPDATE_INTERVAL = 3000;

// Average speed for ETA calculation (km/h)
export const AVG_SPEED_KMH = 25;

/**
 * getDeviceGPS - Returns a Promise that resolves to { lat, lng } from the device's GPS.
 * In DEMO_MODE this is used so ALL roles (customer, vendor, delivery) show at the
 * same real location when running on a single device.
 * Adds small random offsets so markers don't perfectly overlap (50-150m apart).
 */
let _cachedGPS = null;

export async function getDeviceGPS(offsetMeters = 0) {
  if (_cachedGPS && Date.now() - _cachedGPS.ts < 30000) {
    return applyOffset(_cachedGPS, offsetMeters);
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 18.5204, lng: 73.8567 }); // ultimate fallback
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        _cachedGPS = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          ts: Date.now(),
        };
        resolve(applyOffset(_cachedGPS, offsetMeters));
      },
      () => {
        resolve({ lat: 18.5204, lng: 73.8567 }); // fallback on error
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  });
}

function applyOffset(pos, meters) {
  if (!meters) return { lat: pos.lat, lng: pos.lng };
  // ~111,320 meters per degree latitude
  const latOffset = (meters / 111320) * (Math.random() - 0.5) * 2;
  const lngOffset =
    (meters / (111320 * Math.cos((pos.lat * Math.PI) / 180))) *
    (Math.random() - 0.5) *
    2;
  return { lat: pos.lat + latOffset, lng: pos.lng + lngOffset };
}
