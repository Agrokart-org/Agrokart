/**
 * Service to simulate real-time delivery partner movement
 * mimicking a WebSocket connection.
 */

// Simulated Route (Example Path)
const MOCK_ROUTE = [
  [18.5204, 73.8567], // Shaniwar Wada, Pune (Start)
  [18.5195, 73.8553],
  [18.5184, 73.8542],
  [18.5175, 73.8535],
  [18.516, 73.852],
  [18.5155, 73.8515], // Midpoint
  [18.514, 73.85],
  [18.513, 73.849],
  [18.512, 73.848],
  [18.511, 73.847],
  [18.51, 73.846], // End
];

class DeliverySimulationService {
  constructor() {
    this.intervalId = null;
    this.currentIndex = 0;
    this.listeners = [];
  }

  // Subscribe to location updates
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  emit(location) {
    this.listeners.forEach((cb) => cb(location));
  }

  startTracking() {
    if (this.intervalId) return;

    this.currentIndex = 0;
    console.log("Starting Delivery Simulation...");

    this.intervalId = setInterval(() => {
      if (this.currentIndex >= MOCK_ROUTE.length - 1) {
        // Loop or Stop? Let's loop for demo
        this.currentIndex = 0;
      }

      const current = MOCK_ROUTE[this.currentIndex];
      const next = MOCK_ROUTE[this.currentIndex + 1];

      // Calculate bearing (rotation)
      const heading = this.calculateBearing(
        current[0],
        current[1],
        next[0],
        next[1],
      );

      // Emit data
      this.emit({
        lat: current[0],
        lng: current[1],
        heading: heading,
        timestamp: Date.now(),
      });

      this.currentIndex++;
    }, 2000); // Update every 2 seconds
  }

  stopTracking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Calculate direction in degrees
  calculateBearing(startLat, startLng, destLat, destLng) {
    const startLatRad = this.toRadians(startLat);
    const startLngRad = this.toRadians(startLng);
    const destLatRad = this.toRadians(destLat);
    const destLngRad = this.toRadians(destLng);

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x =
      Math.cos(startLatRad) * Math.sin(destLatRad) -
      Math.sin(startLatRad) *
        Math.cos(destLatRad) *
        Math.cos(destLngRad - startLngRad);
    let brng = Math.atan2(y, x);
    brng = this.toDegrees(brng);
    return (brng + 360) % 360;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  toDegrees(radians) {
    return radians * (180 / Math.PI);
  }
}

export const deliverySimulation = new DeliverySimulationService();
