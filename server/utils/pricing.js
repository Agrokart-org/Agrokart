/**
 * Agrokart Pricing Utility
 * 
 * Central module for all pricing calculations across the platform.
 * Ensures consistent pricing between customer app, vendor app, and delivery partner app.
 * 
 * Business Rules:
 * - Products are stored at vendor (base) price
 * - Customers see base + platform markup
 * - Vendor receives 99% of subtotal (online) or base total minus 1% (COD)
 * - Delivery partner earns ₹25/km, min ₹50, max ₹500
 * - Free delivery for orders with subtotal > ₹699
 */

/**
 * Get the platform markup for a product based on its base (vendor) price.
 * @param {number} basePrice - The vendor's selling price
 * @returns {number} The markup amount in rupees
 */
const getMarkup = (basePrice) => {
  const price = Number(basePrice) || 0;
  if (price <= 600) return 40;
  if (price <= 1000) return 50;
  if (price <= 1600) return 60;
  return 70;
};

/**
 * Get the customer-facing price (base price + markup).
 * @param {number} basePrice - The vendor's selling price
 * @returns {number} The price the customer sees and pays
 */
const getCustomerPrice = (basePrice) => {
  const price = Number(basePrice) || 0;
  return price + getMarkup(price);
};

/**
 * Get the delivery charge for the customer.
 * Free delivery for orders above ₹699.
 * @param {number} subtotal - The order subtotal (after markup)
 * @returns {number} Delivery charge (₹40 or ₹0)
 */
const getDeliveryCharge = (subtotal) => {
  return subtotal > 699 ? 0 : 40;
};

/**
 * Get the platform commission amount.
 * 1% of subtotal for online payments, 1% for COD as well.
 * @param {number} subtotal - The order subtotal (customer-facing, with markup)
 * @param {string} paymentMethod - 'online' or 'cod'
 * @returns {number} Commission amount for Agrokart
 */
const getPlatformCommission = (subtotal, paymentMethod) => {
  // 1% platform commission for online payments
  if (paymentMethod !== 'cod') {
    return Math.round(subtotal * 0.01);
  }
  return 0;
};

/**
 * Get the vendor payout amount.
 * For online: 99% of subtotal (1% goes to Agrokart)
 * For COD: full subtotal (platform fee collected separately)
 * @param {number} subtotal - The order subtotal
 * @param {string} paymentMethod - 'online' or 'cod'
 * @returns {number} Amount the vendor receives
 */
const getVendorPayout = (subtotal, paymentMethod) => {
  const commission = getPlatformCommission(subtotal, paymentMethod);
  return Math.round(subtotal - commission);
};

/**
 * Validate that coordinates are real (not default [0,0] or missing).
 * Prevents insane distance calculations that cause ₹1L delivery fees.
 * @param {object} coordObj - MongoDB GeoJSON { type: "Point", coordinates: [lng, lat] }
 * @returns {boolean} true if coordinates are valid
 */
const validateCoordinates = (coordObj) => {
  if (!coordObj || !coordObj.coordinates || !Array.isArray(coordObj.coordinates)) {
    return false;
  }
  const [lng, lat] = coordObj.coordinates;
  // Check for default [0,0] or NaN
  if (lng === 0 && lat === 0) return false;
  if (isNaN(lng) || isNaN(lat)) return false;
  // Basic range check (India: lat 6-37, lng 68-98)
  if (lat < 5 || lat > 40 || lng < 65 || lng > 100) return false;
  return true;
};

/**
 * Haversine distance in kilometers between two lat/lng points.
 * @returns {number} Distance in km
 */
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get the delivery partner fee based on distance.
 * ₹25/km, minimum ₹50, maximum ₹500.
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Delivery partner earnings for this delivery
 */
const getDeliveryPartnerFee = (distanceKm) => {
  const fee = Math.round(distanceKm * 25);
  return Math.min(500, Math.max(50, fee)); // Clamp between ₹50 and ₹500
};

/**
 * Calculate the delivery partner fee from vendor and customer coordinates.
 * Returns ₹50 flat fee if coordinates are invalid.
 * @param {object} vendorCoords - Vendor's GeoJSON coordinates
 * @param {object} customerCoords - Customer's GeoJSON coordinates
 * @returns {{ fee: number, distanceKm: number, isValid: boolean }}
 */
const calculateDeliveryFee = (vendorCoords, customerCoords) => {
  if (!validateCoordinates(vendorCoords) || !validateCoordinates(customerCoords)) {
    console.log('⚠️ Invalid coordinates detected, using flat ₹50 delivery fee');
    return { fee: 50, distanceKm: 0, isValid: false };
  }

  const [vlng, vlat] = vendorCoords.coordinates;
  const [clng, clat] = customerCoords.coordinates;
  const distanceKm = getDistanceKm(vlat, vlng, clat, clng);
  const fee = getDeliveryPartnerFee(distanceKm);

  console.log(`📏 Delivery distance: ${distanceKm.toFixed(2)} km → Partner fee: ₹${fee}`);
  return { fee, distanceKm, isValid: true };
};

module.exports = {
  getMarkup,
  getCustomerPrice,
  getDeliveryCharge,
  getPlatformCommission,
  getVendorPayout,
  validateCoordinates,
  getDistanceKm,
  getDeliveryPartnerFee,
  calculateDeliveryFee,
};
