/**
 * socketService.js
 * Real-time Socket.IO service for AgroKart.
 *
 * Events handled:
 *   join_tracking / leave_tracking           — Customer joins/leaves order room
 *   join_vendor_room                         — Vendor joins their room
 *   join_delivery_partner_room               — Delivery partner joins their room
 *   delivery_partner_online / offline        — Availability toggling
 *   delivery_location_update                 — Delivery partner sends live GPS coords (throttled)
 *   delivery_status_change                   — Delivery partner changes order status
 *   update_location                          — Legacy location update (kept for backward compat)
 */

const socketIo = require("socket.io");
const DeliveryAssignment = require("../models/DeliveryAssignment");
const { THROTTLE_DB_WRITE_MS } = require("../config/trackingConfig");

let io;

// Track last DB write time per assignment to throttle writes
const lastDbWrite = new Map();

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // ─── Room Management ─────────────────────────────────────────────

    socket.on("join_tracking", (orderId) => {
      console.log(
        `📡 Socket ${socket.id} → join tracking room: order_${orderId}`,
      );
      socket.join(`order_${orderId}`);
    });

    socket.on("leave_tracking", (orderId) => {
      console.log(
        `📡 Socket ${socket.id} → leave tracking room: order_${orderId}`,
      );
      socket.leave(`order_${orderId}`);
    });

    socket.on("join_vendor_room", (vendorId) => {
      console.log(`🏪 Vendor ${vendorId} joined room vendor_${vendorId}`);
      socket.join(`vendor_${vendorId}`);
    });

    socket.on("join_delivery_partner_room", (partnerId) => {
      console.log(
        `🚴 Delivery partner ${partnerId} joined room delivery_partner_${partnerId}`,
      );
      socket.join(`delivery_partner_${partnerId}`);
    });

    socket.on("delivery_partner_online", (data) => {
      if (data && data.partnerId) {
        console.log(`🟢 Delivery partner ${data.partnerId} ONLINE`);
        socket.join(`delivery_partner_${data.partnerId}`);
      }
    });

    socket.on("delivery_partner_offline", (data) => {
      if (data && data.partnerId) {
        console.log(`🔴 Delivery partner ${data.partnerId} OFFLINE`);
        socket.leave(`delivery_partner_${data.partnerId}`);
      }
    });

    // ─── Real-Time Location Updates (Blinkit-style) ──────────────────

    /**
     * delivery_location_update
     * Sent by delivery partner every 3 seconds.
     * Payload: { assignmentId, orderId, lat, lng, heading, speed, timestamp }
     *
     * 1. Broadcasts to order room immediately (low latency for customer)
     * 2. Persists to DB throttled (every THROTTLE_DB_WRITE_MS)
     */
    socket.on("delivery_location_update", async (data) => {
      try {
        const { assignmentId, orderId, lat, lng, heading, speed, timestamp } =
          data;

        if (!orderId || !lat || !lng) return;

        // 1) Broadcast to everyone in the order room (customer sees this)
        io.to(`order_${orderId}`).emit("location_updated", {
          orderId,
          assignmentId,
          latitude: lat,
          longitude: lng,
          heading: heading || 0,
          speed: speed || 0,
          timestamp: timestamp || Date.now(),
        });

        // 2) Throttled DB write
        if (assignmentId) {
          const now = Date.now();
          const lastWrite = lastDbWrite.get(assignmentId) || 0;

          if (now - lastWrite >= THROTTLE_DB_WRITE_MS) {
            lastDbWrite.set(assignmentId, now);

            // Non-blocking DB update
            DeliveryAssignment.findByIdAndUpdate(assignmentId, {
              "tracking.currentLocation.coordinates": [lng, lat], // GeoJSON: [lng, lat]
              "tracking.lastUpdated": new Date(),
              "tracking.speed": speed || 0,
              "tracking.heading": heading || 0,
            }).catch((err) => {
              console.error("❌ Location DB write error:", err.message);
            });
          }
        }
      } catch (err) {
        console.error("❌ delivery_location_update error:", err.message);
      }
    });

    // ─── Real-Time Status Changes ────────────────────────────────────

    /**
     * delivery_status_change
     * Sent by delivery partner when status changes.
     * Payload: { orderId, assignmentId, status, timestamp }
     *
     * Status values: 'confirmed' | 'packed' | 'picked_up' | 'on_the_way' | 'arriving' | 'delivered'
     */
    socket.on("delivery_status_change", (data) => {
      try {
        const { orderId, status, assignmentId, timestamp } = data;

        if (!orderId || !status) return;

        console.log(`📦 Status change → order_${orderId}: ${status}`);

        // Broadcast to everyone in the order room
        io.to(`order_${orderId}`).emit("delivery_status_changed", {
          orderId,
          assignmentId,
          status,
          timestamp: timestamp || Date.now(),
        });
      } catch (err) {
        console.error("❌ delivery_status_change error:", err.message);
      }
    });

    // ─── Legacy Location Update (backward compatibility) ─────────────

    socket.on("update_location", (data) => {
      const { orderId, latitude, longitude } = data;
      if (orderId) {
        socket.to(`order_${orderId}`).emit("location_updated", data);
      }
    });

    // ─── Disconnect ──────────────────────────────────────────────────

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIo,
};
