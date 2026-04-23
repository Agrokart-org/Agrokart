const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const DeliveryAssignment = require("../models/DeliveryAssignment");

// Middleware to check admin access
const adminAuth = (req, res, next) => {
  // For demo purposes, we'll allow access
  // In production, add proper authentication
  next();
};

// Get database statistics
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // Get database stats
    const dbStats = await db.stats();

    // Get collection names
    const collections = await db.listCollections().toArray();

    // Get collection stats
    const collectionStats = [];
    for (const collection of collections) {
      try {
        const stats = await db.collection(collection.name).stats();
        collectionStats.push({
          name: collection.name,
          count: stats.count,
          size: stats.size,
          avgObjSize: stats.avgObjSize,
          storageSize: stats.storageSize,
          indexes: stats.nindexes,
        });
      } catch (error) {
        collectionStats.push({
          name: collection.name,
          error: error.message,
        });
      }
    }

    res.json({
      database: {
        name: db.databaseName,
        collections: dbStats.collections,
        objects: dbStats.objects,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize,
      },
      collections: collectionStats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get collections list
router.get("/collections", adminAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    res.json(collections.map((col) => col.name));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get documents from a collection
router.get("/collections/:name", adminAuth, async (req, res) => {
  try {
    const { name } = req.params;
    const { page = 1, limit = 20, sort = "_id", order = "desc" } = req.query;

    const db = mongoose.connection.db;
    const collection = db.collection(name);

    const skip = (page - 1) * limit;
    const sortObj = { [sort]: order === "desc" ? -1 : 1 };

    const documents = await collection
      .find({})
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await collection.countDocuments();

    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific document
router.get("/collections/:name/:id", adminAuth, async (req, res) => {
  try {
    const { name, id } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection(name);

    const document = await collection.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new document
router.post("/collections/:name", adminAuth, async (req, res) => {
  try {
    const { name } = req.params;
    const document = req.body;

    const db = mongoose.connection.db;
    const collection = db.collection(name);

    const result = await collection.insertOne(document);

    res.json({
      success: true,
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a document
router.put("/collections/:name/:id", adminAuth, async (req, res) => {
  try {
    const { name, id } = req.params;
    const update = req.body;

    const db = mongoose.connection.db;
    const collection = db.collection(name);

    const result = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: update },
    );

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a document
router.delete("/collections/:name/:id", adminAuth, async (req, res) => {
  try {
    const { name, id } = req.params;

    const db = mongoose.connection.db;
    const collection = db.collection(name);

    const result = await collection.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    // Cascade delete related records if deleting an order
    if (name === "orders" || name === "Order") {
      const DeliveryAssignment = require("../models/DeliveryAssignment");
      await DeliveryAssignment.deleteMany({ order: id });
    }

    res.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute a custom query
router.post("/query/:name", adminAuth, async (req, res) => {
  try {
    const { name } = req.params;
    const { query, options = {} } = req.body;

    const db = mongoose.connection.db;
    const collection = db.collection(name);

    const results = await collection.find(query, options).toArray();

    res.json({
      results,
      count: results.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// HIGH-LEVEL ADMIN MANAGEMENT ENDPOINTS
// ========================================

const User = require("../models/User");
const Order = require("../models/Order");

// GET /admin/dashboard-stats — Real counts
router.get("/dashboard-stats", adminAuth, async (req, res) => {
  try {
    const [
      totalCustomers,
      totalVendors,
      totalDelivery,
      totalOrders,
      activeOrders,
      cancelledOrders,
      pendingVendors,
      pendingDelivery,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "vendor" }),
      User.countDocuments({ role: "delivery_partner" }),
      Order.countDocuments(),
      Order.countDocuments({
        orderStatus: { $nin: ["delivered", "cancelled"] },
      }),
      Order.countDocuments({ orderStatus: "cancelled" }),
      User.countDocuments({
        role: "vendor",
        "vendorProfile.verificationStatus": "pending",
      }),
      User.countDocuments({
        role: "delivery_partner",
        "deliveryProfile.verificationStatus": "pending",
      }),
    ]);

    // Revenue from delivered orders
    const revenueResult = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      users: {
        customers: totalCustomers,
        vendors: totalVendors,
        delivery: totalDelivery,
        total: totalCustomers + totalVendors + totalDelivery,
      },
      orders: {
        total: totalOrders,
        active: activeOrders,
        cancelled: cancelledOrders,
      },
      revenue: totalRevenue,
      pendingApprovals: {
        vendors: pendingVendors,
        delivery: pendingDelivery,
        total: pendingVendors + pendingDelivery,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/users — List all users with filters
router.get("/users", adminAuth, async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role && role !== "all") filter.role = role;
    if (status === "verified") filter.isVerified = true;
    if (status === "unverified") filter.isVerified = false;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -firebaseUid")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /admin/users/:id/status — Block/unblock/verify a user
router.patch("/users/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'block', 'unblock', 'verify', 'reject'

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    switch (action) {
      case "block":
        user.isVerified = false;
        if (user.role === "vendor")
          user.vendorProfile.verificationStatus = "rejected";
        if (user.role === "delivery_partner")
          user.deliveryProfile.verificationStatus = "rejected";
        break;
      case "unblock":
      case "verify":
        user.isVerified = true;
        if (user.role === "vendor")
          user.vendorProfile.verificationStatus = "verified";
        if (user.role === "delivery_partner")
          user.deliveryProfile.verificationStatus = "verified";
        break;
      case "reject":
        user.isVerified = false;
        if (user.role === "vendor")
          user.vendorProfile.verificationStatus = "rejected";
        if (user.role === "delivery_partner")
          user.deliveryProfile.verificationStatus = "rejected";
        break;
      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/users/:id — Delete a user account
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "admin")
      return res.status(403).json({ error: "Cannot delete admin accounts" });

    await User.findByIdAndDelete(id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/orders — List all orders with filters and role-based views
router.get("/orders", adminAuth, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, role, userId } = req.query;
    const filter = {};

    if (status && status !== "all") filter.orderStatus = status;
    if (search) {
      filter.$or = [{ trackingNumber: { $regex: search, $options: "i" } }];
    }

    // Role-based filtering
    if (role === "vendor" && userId) {
      filter["items.vendor"] = userId;
    } else if (role === "delivery" && userId) {
      filter.deliveryPartner = userId;
    } else if (role === "customer" && userId) {
      filter.user = userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email phone role")
        .populate("items.vendor", "name email vendorProfile.businessName")
        .populate("deliveryPartner", "name phone email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /admin/orders/:id/status — Force-update order status
router.patch("/orders/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.orderStatus = status;
    if (status === "cancelled") {
      order.items.forEach((item) => {
        item.status = "rejected";
      });
    }
    await order.save();

    // Emit socket event if available
    try {
      const { getIo } = require("../services/socketService");
      const io = getIo();
      io.to(`order_${order._id}`).emit("order_status_updated", {
        orderId: order._id,
        status,
      });
    } catch (e) {
      /* socket not critical for admin */
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/orders/:id — Remove an order entirely
router.delete("/orders/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Cascade delete associated delivery assignments
    await DeliveryAssignment.deleteMany({ order: id });

    await Order.findByIdAndDelete(id);
    res.json({ success: true, message: "Order deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/pending-approvals — Vendors & delivery partners awaiting approval
router.get("/pending-approvals", adminAuth, async (req, res) => {
  try {
    const [pendingVendors, pendingDelivery] = await Promise.all([
      User.find({
        role: "vendor",
        "vendorProfile.verificationStatus": "pending",
      })
        .select(
          "name email phone vendorProfile.businessName vendorProfile.businessType createdAt",
        )
        .sort({ createdAt: -1 }),
      User.find({
        role: "delivery_partner",
        "deliveryProfile.verificationStatus": "pending",
      })
        .select("name email phone deliveryProfile.vehicleType createdAt")
        .sort({ createdAt: -1 }),
    ]);

    res.json({ vendors: pendingVendors, delivery: pendingDelivery });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/delivery-assignments — Delivery assignments with filters
router.get("/delivery-assignments", adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    } else {
      // Default: show ongoing assignments
      filter.status = {
        $in: ["assigned", "accepted", "picked_up", "in_transit"],
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [assignments, total] = await Promise.all([
      DeliveryAssignment.find(filter)
        .populate("order", "trackingNumber totalAmount orderStatus")
        .populate("deliveryPartner", "name email phone")
        .populate("vendor", "name email vendorProfile.businessName")
        .populate("customer", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DeliveryAssignment.countDocuments(filter),
    ]);

    res.json({
      assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// DELETE /delivery-assignments/:id — Delete a delivery assignment and reset order
router.delete("/delivery-assignments/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get the assignment to find related order
    const assignment = await DeliveryAssignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // 2. Reset Order Status
    if (assignment.order) {
      const order = await Order.findById(assignment.order);
      if (order) {
        order.orderStatus = "confirmed"; // Reset to confirmed so it can be re-assigned
        order.deliveryPartner = null; // Remove assigned partner
        await order.save();
      }
    }

    // 3. Delete Assignment
    await DeliveryAssignment.findByIdAndDelete(id);

    res.json({ success: true, message: "Assignment deleted and order reset" });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({ error: error.message });
  }
});
