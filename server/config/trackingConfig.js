/**
 * trackingConfig.js
 * Configuration for real-time delivery tracking system.
 *
 * DEMO_MODE (default: true)
 *   true  → All roles share the same GPS on one device (college demo)
 *   false → Normal multi-device tracking
 */

module.exports = {
  DEMO_MODE: process.env.DEMO_MODE === "false" ? false : true,
  LOCATION_UPDATE_INTERVAL_MS: 3000, // How often delivery partner sends location
  THROTTLE_DB_WRITE_MS: 5000, // Min interval between DB writes for location
  ETA_SPEED_KMH: 25, // Average speed for ETA calculation (km/h)
};
