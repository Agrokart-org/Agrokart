const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const User = require("../models/User");
const DeliveryAssignment = require("../models/DeliveryAssignment");
const Order = require("../models/Order");
const Earnings = require("../models/Earnings");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const { auth: firebaseAuth } = require("../config/firebase");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/delivery-documents/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images (JPEG, JPG, PNG) and PDF files are allowed"));
    }
  },
});

// Delivery partner login with role validation
router.post("/login", async (req, res) => {
  try {
    const { email, password, firebaseUid } = req.body;

    console.log("🔄 Delivery partner login attempt:", {
      email,
      firebaseUid: firebaseUid ? "Present" : "Missing",
    });

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user in database
    let user = await User.findOne({ email });

    if (!user) {
      // User not in MongoDB - auto-create as delivery partner
      // This handles users who exist in Firebase Auth but were never synced to MongoDB
      console.log(
        "📝 User not in MongoDB. Auto-creating delivery partner for:",
        email,
      );
      try {
        user = new User({
          name: email.split("@")[0],
          email: email,
          firebaseUid: firebaseUid || "pending",
          phone: "0000000000",
          role: "delivery_partner",
          deliveryProfile: {
            isAvailable: true,
            isVerified: false,
            verificationStatus: "pending",
          },
        });

        await user.save();
        console.log("✅ Auto-created delivery partner in MongoDB:", {
          id: user._id,
          email: user.email,
        });
      } catch (createError) {
        console.error("❌ Failed to auto-create user:", createError.message);
        return res
          .status(401)
          .json({
            message: "Failed to create account. Please try registering first.",
          });
      }
    }

    // Validate user role
    if (user.role !== "delivery_partner") {
      console.log(
        "❌ Role mismatch - Expected: delivery_partner, Found:",
        user.role,
      );
      return res.status(403).json({
        message: `Access denied. This account is registered as ${user.role}, not delivery partner. Please use the correct login page for your account type.`,
        userRole: user.role,
      });
    }

    console.log("✅ Delivery partner login successful:", {
      id: user._id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vehicleType: user.deliveryProfile?.vehicleType,
        vehicleNumber: user.deliveryProfile?.vehicleNumber,
        serviceRadius: user.deliveryProfile?.serviceRadius,
        isVerified: user.deliveryProfile?.isVerified || false,
        isAvailable: user.deliveryProfile?.isAvailable || true,
      },
      token: "delivery-jwt-token", // In a real app, generate a proper JWT
    });
  } catch (error) {
    console.error("Delivery partner login error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Delivery partner registration with Firebase UID
router.post("/register", async (req, res) => {
  try {
    const {
      firebaseUid,
      name,
      email,
      phone,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      aadharNumber,
      serviceRadius,
    } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({
        message: "Firebase UID is required",
      });
    }

    // Check if user already exists
    let existingUser = await User.findOne({
      $or: [{ email }, { phone }, { firebaseUid }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email, phone, or Firebase UID already exists",
      });
    }

    // Create new delivery partner user
    const deliveryPartner = new User({
      firebaseUid,
      name,
      email,
      phone,
      role: "delivery_partner",
      deliveryProfile: {
        vehicleType,
        vehicleNumber,
        licenseNumber,
        aadharNumber,
        serviceRadius,
        isAvailable: true,
        isVerified: false,
        verificationStatus: "pending",
      },
    });

    await deliveryPartner.save();

    // Create notification for admin
    await Notification.createNotification({
      recipient: null,
      recipientType: "admin",
      type: "new_delivery_partner_registration",
      title: "New Delivery Partner Registration",
      message: `New delivery partner ${name} has registered and needs verification`,
      data: {
        deliveryPartnerId: deliveryPartner._id,
        actionUrl: `/admin/delivery-partners/${deliveryPartner._id}`,
      },
      priority: "medium",
    });

    res.status(201).json({
      message: "Delivery partner registered successfully",
      user: {
        id: deliveryPartner._id,
        name: deliveryPartner.name,
        email: deliveryPartner.email,
        role: deliveryPartner.role,
        firebaseUid: deliveryPartner.firebaseUid,
        deliveryProfile: deliveryPartner.deliveryProfile,
      },
    });
  } catch (error) {
    console.error("Delivery partner registration error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Upload delivery partner documents
router.post(
  "/upload-documents",
  auth,
  upload.fields([
    { name: "drivingLicense", maxCount: 1 },
    { name: "vehicleRC", maxCount: 1 },
    { name: "aadharCard", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const deliveryPartner = await User.findById(req.user.id);

      if (!deliveryPartner || deliveryPartner.role !== "delivery_partner") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update document paths
      if (req.files) {
        const documents = {};
        Object.keys(req.files).forEach((key) => {
          if (req.files[key][0]) {
            documents[key] = req.files[key][0].path;
          }
        });

        deliveryPartner.deliveryProfile.documents = {
          ...deliveryPartner.deliveryProfile.documents,
          ...documents,
        };

        deliveryPartner.deliveryProfile.verificationStatus = "under_review";
        await deliveryPartner.save();

        // Notify admin about document upload
        await Notification.createNotification({
          recipient: null,
          recipientType: "admin",
          type: "document_uploaded",
          title: "Delivery Partner Documents Uploaded",
          message: `${deliveryPartner.name} has uploaded verification documents`,
          data: {
            deliveryPartnerId: deliveryPartner._id,
            actionUrl: `/admin/delivery-partners/${deliveryPartner._id}/verify`,
          },
          priority: "medium",
        });
      }

      res.json({
        message: "Documents uploaded successfully",
        documents: deliveryPartner.deliveryProfile.documents,
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ message: "Server error", details: error.message });
    }
  },
);

// Get delivery partner dashboard data
router.get("/dashboard", auth, async (req, res) => {
  try {
    const deliveryPartner = await User.findById(req.user.id);

    if (!deliveryPartner || deliveryPartner.role !== "delivery_partner") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get earnings summary for today
    const earningsSummary = await Earnings.getEarningsSummary(
      deliveryPartner._id,
      "delivery_partner",
      { year: currentYear, month: currentMonth, day: now.getDate() },
    );

    // Get earnings summary for the month
    const monthlyEarningsSummary = await Earnings.getEarningsSummary(
      deliveryPartner._id,
      "delivery_partner",
      { year: currentYear, month: currentMonth },
    );

    // Get available assignments
    const availableAssignments = await DeliveryAssignment.find({
      status: "assigned",
      deliveryPartner: { $exists: false },
    })
      .populate("order", "trackingNumber totalAmount")
      .populate("customer", "name phone")
      .populate("vendor", "name vendorProfile.businessName")
      .limit(10);

    // Get current assignments
    const currentAssignments = await DeliveryAssignment.find({
      deliveryPartner: deliveryPartner._id,
      status: { $in: ["accepted", "picked_up", "in_transit"] },
    })
      .populate("order", "trackingNumber totalAmount")
      .populate("customer", "name phone")
      .populate("vendor", "name vendorProfile.businessName");

    // Get completed deliveries today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDeliveries = await DeliveryAssignment.countDocuments({
      deliveryPartner: deliveryPartner._id,
      status: "delivered",
      actualDeliveryTime: { $gte: today, $lt: tomorrow },
    });

    // Get monthly earnings trend
    const monthlyTrend = await Earnings.getMonthlyTrend(
      deliveryPartner._id,
      "delivery_partner",
      currentYear,
    );

    res.json({
      deliveryPartner: {
        name: deliveryPartner.name,
        isVerified: deliveryPartner.deliveryProfile.isVerified,
        verificationStatus: deliveryPartner.deliveryProfile.verificationStatus,
        isAvailable: deliveryPartner.deliveryProfile.isAvailable,
        rating: deliveryPartner.deliveryProfile.rating,
        vehicleType: deliveryPartner.deliveryProfile.vehicleType,
      },
      stats: {
        todayDeliveries,
        totalEarnings: earningsSummary.totalNet,
        pendingEarnings: earningsSummary.pendingAmount,
        deliveriesThisMonth: monthlyEarningsSummary.transactionCount,
        availableAssignments: availableAssignments.length,
      },
      earningsSummary,
      availableAssignments,
      currentAssignments,
      monthlyTrend,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Get available assignments
router.get("/assignments/available", auth, async (req, res) => {
  try {
    const deliveryPartner = await User.findById(req.user.id);

    if (!deliveryPartner || deliveryPartner.role !== "delivery_partner") {
      return res.status(403).json({ message: "Access denied" });
    }

    const assignments = await DeliveryAssignment.find({
      status: "assigned",
      deliveryPartner: { $exists: false },
      rejectedBy: { $ne: deliveryPartner._id }, // Exclude assignments rejected by this user
    })
      .populate("order", "trackingNumber totalAmount")
      .populate("customer", "name phone")
      .populate("vendor", "name vendorProfile.businessName")
      .sort({ priority: -1, createdAt: 1 });

    res.json({ assignments });
  } catch (error) {
    console.error("Get available assignments error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Reject assignment
router.post("/assignments/:id/reject", auth, async (req, res) => {
  try {
    const deliveryPartner = await User.findById(req.user.id);

    if (!deliveryPartner || deliveryPartner.role !== "delivery_partner") {
      return res.status(403).json({ message: "Access denied" });
    }

    const assignment = await DeliveryAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Add user to rejectedBy array if not already present
    if (!assignment.rejectedBy.includes(deliveryPartner._id)) {
      assignment.rejectedBy.push(deliveryPartner._id);
      await assignment.save();
    }

    res.json({
      message: "Assignment rejected successfully",
      assignmentId: assignment._id,
    });
  } catch (error) {
    console.error("Reject assignment error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Accept assignment
router.post("/assignments/:id/accept", auth, async (req, res) => {
  try {
    const deliveryPartner = await User.findById(req.user.id);

    if (!deliveryPartner || deliveryPartner.role !== "delivery_partner") {
      return res.status(403).json({ message: "Access denied" });
    }

    const assignment = await DeliveryAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.status !== "assigned") {
      return res
        .status(400)
        .json({ message: "Assignment is no longer available" });
    }

    assignment.deliveryPartner = deliveryPartner._id;
    assignment.status = "accepted";
    assignment.acceptedAt = new Date();
    await assignment.save();

    // Update order status
    const order = await Order.findById(assignment.order);
    if (order) {
      // Do not set to out_for_delivery yet. Wait for Vendor Pickup Verification.
      order.deliveryPartner = deliveryPartner._id;
      await order.save();
    }
    // Notify Vendor
    const io = require("../services/socketService").getIo();
    // Emit to vendor's personal room
    io.to(order.items[0].vendor.toString()).emit("order_status_updated", {
      orderId: order._id,
      status: order.orderStatus,
      deliveryPartner: {
        name: deliveryPartner.name,
        phone: deliveryPartner.phone,
      },
    });
    // Notify customer
    await Notification.createNotification({
      recipient: assignment.customer,
      recipientType: "customer",
      type: "delivery_assigned",
      title: "Delivery Partner Assigned",
      message: `Your order is now out for delivery with ${deliveryPartner.name}`,
      data: {
        orderId: assignment.order,
        deliveryPartnerId: deliveryPartner._id,
        actionUrl: `/orders/${assignment.order}/track`,
      },
      priority: "medium",
    });

    res.json({
      message: "Assignment accepted successfully",
      assignment,
    });
  } catch (error) {
    console.error("Accept assignment error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Update delivery status
router.post("/assignments/:id/status", auth, async (req, res) => {
  try {
    const deliveryPartner = await User.findById(req.user.id);

    if (!deliveryPartner || deliveryPartner.role !== "delivery_partner") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status, location, notes, proofOfDelivery } = req.body;

    const assignment = await DeliveryAssignment.findOne({
      _id: req.params.id,
      deliveryPartner: deliveryPartner._id,
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    assignment.status = status;

    if (location) {
      assignment.updateLocation(
        location.coordinates,
        location.speed,
        location.heading,
      );
    }

    if (status === "picked_up") {
      const order = await Order.findById(assignment.order);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify pickup PIN from vendor
      const { vendorPickupPin } = req.body;
      if (
        order.pickupPin &&
        String(order.pickupPin).trim() !== String(vendorPickupPin).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid pickup PIN. Please ask the vendor for the exact PIN.`,
        });
      }

      assignment.actualPickupTime = new Date();
      if (req.body.proofOfPickup) {
        assignment.proofOfPickup = req.body.proofOfPickup;
      }
      
      const VendorInventory = require("../models/VendorInventory");
      
      // Release the reservedStock and deduct from actual stock
      for (const item of order.items) {
        if (item.vendor) {
          const inventoryItem = await VendorInventory.findOne({
            vendor: item.vendor,
            product: item.product._id || item.product,
          });
          if (inventoryItem) {
            inventoryItem.reservedStock = Math.max(
              0,
              (inventoryItem.reservedStock || 0) - item.quantity,
            );
            inventoryItem.stock = Math.max(
              0,
              (inventoryItem.stock || 0) - item.quantity,
            );
            await inventoryItem.save();
          }
        }
      }

      // Update order status as well
      order.orderStatus = "out_for_delivery";
      await order.save();
      
      // Notify Vendor and Customer using Socket if needed here (handled by socket event emitting elsewhere or can be added here)
    }

    if (status === "delivered") {
      // Verify delivery PIN from customer
      const { deliveryPin } = req.body;
      console.log(
        `DEBUG: Verifying PIN for assignment ${assignment._id}. Received PIN: '${deliveryPin}'`,
      );

      const order = await Order.findById(assignment.order);

      if (!order) {
        console.log("DEBUG: Order not found for assignment");
        return res.status(404).json({ message: "Order not found" });
      }

      console.log(`DEBUG: Order PIN: '${order.deliveryPin}'`);

      if (
        order.deliveryPin &&
        String(order.deliveryPin).trim() !== String(deliveryPin).trim()
      ) {
        console.log("DEBUG: PIN mismatch");
        return res.status(400).json({
          success: false,
          message: `Invalid delivery PIN. Expected: ${order.deliveryPin}, Received: ${deliveryPin}`,
        });
      }
      console.log("DEBUG: PIN verified successfully");

      assignment.actualDeliveryTime = new Date();
      assignment.completedAt = new Date();

      if (proofOfDelivery) {
        assignment.proofOfDelivery = proofOfDelivery;
      }

      // Update order status
      // Update order status
      order.orderStatus = "delivered";
      order.actualDeliveryTime = new Date();
      await order.save();

      // Create earnings record for delivery partner (non-critical)
      try {
        const grossAmount =
          (assignment.deliveryFee || 0) + (assignment.tips || 0);
        await Earnings.create({
          user: deliveryPartner._id,
          userType: "delivery_partner",
          order: assignment.order,
          deliveryAssignment: assignment._id,
          transactionType: "delivery",
          grossAmount,
          netAmount: grossAmount,
          description: `Delivery for order ${order?.trackingNumber || assignment.order}`,
        });
      } catch (earningsErr) {
        console.error(
          "Earnings creation error (non-critical):",
          earningsErr.message,
        );
      }

      // Notify customer (non-critical)
      try {
        await Notification.createNotification({
          recipient: assignment.customer,
          recipientType: "customer",
          type: "order_delivered",
          title: "Order Delivered",
          message: "Your order has been delivered successfully",
          data: {
            orderId: assignment.order,
            actionUrl: `/orders/${assignment.order}`,
          },
          priority: "high",
        });
      } catch (notifErr) {
        console.error(
          "Notification creation error (non-critical):",
          notifErr.message,
        );
      }
    }

    if (notes) {
      assignment.notes = notes;
    }

    await assignment.save();

    res.json({
      success: true,
      message: "Status updated successfully",
      assignment,
    });
  } catch (error) {
    console.error("Update status error:", error);

    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Update delivery partner availability status
router.put("/availability", auth, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "delivery_partner") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Initialize deliveryProfile if it doesn't exist (legacy data safety)
    if (!user.deliveryProfile) {
      user.deliveryProfile = {};
    }

    user.deliveryProfile.isAvailable = isAvailable;
    await user.save();

    console.log(
      `Delivery Partner ${user.name} (${user._id}) is now ${isAvailable ? "ONLINE" : "OFFLINE"}`,
    );

    res.json({
      message: `Status updated to ${isAvailable ? "Online" : "Offline"}`,
      isAvailable: user.deliveryProfile.isAvailable,
    });
  } catch (error) {
    console.error("Update availability error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// BANK ACCOUNT LINKING
// ══════════════════════════════════════════════════════════════════════════

// Get bank account details
router.get("/bank-account", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "delivery_partner") {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json({
      bankDetails: user.deliveryProfile?.bankDetails || { isLinked: false },
    });
  } catch (error) {
    console.error("Get bank account error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Link/update bank account
router.put("/bank-account", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "delivery_partner") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { accountNumber, ifscCode, accountHolderName, bankName } = req.body;

    if (!accountNumber || !ifscCode || !accountHolderName || !bankName) {
      return res.status(400).json({ message: "All bank details are required" });
    }

    if (!user.deliveryProfile) user.deliveryProfile = {};

    user.deliveryProfile.bankDetails = {
      accountNumber,
      ifscCode: ifscCode.toUpperCase(),
      accountHolderName,
      bankName,
      isLinked: true,
    };

    await user.save();
    console.log(`🏦 Bank account linked for delivery partner ${user._id}`);

    res.json({
      message: "Bank account linked successfully",
      bankDetails: user.deliveryProfile.bankDetails,
    });
  } catch (error) {
    console.error("Link bank account error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// CASH COLLECTION MANAGEMENT (Uber-style ₹5000 limit)
// ══════════════════════════════════════════════════════════════════════════

// Get cash collection status
router.get("/cash-collection", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "delivery_partner") {
      return res.status(403).json({ message: "Access denied" });
    }

    const cashData = user.deliveryProfile?.cashCollection || {
      currentAmount: 0,
      isAccountFrozen: false,
    };

    // Check if 24h deadline has passed since threshold was reached
    if (cashData.thresholdReachedAt && !cashData.isAccountFrozen) {
      const hoursSinceThreshold = (Date.now() - new Date(cashData.thresholdReachedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceThreshold >= 24) {
        // Auto-freeze account
        user.deliveryProfile.cashCollection.isAccountFrozen = true;
        user.deliveryProfile.cashCollection.frozenAt = new Date();
        user.deliveryProfile.cashCollection.frozenReason = "Cash collection limit exceeded for more than 24 hours";
        user.deliveryProfile.isAvailable = false;
        await user.save();
        cashData.isAccountFrozen = true;
        cashData.frozenAt = new Date();
        cashData.frozenReason = "Cash collection limit exceeded for more than 24 hours";
        console.log(`🔒 Account FROZEN for delivery partner ${user._id} — cash limit exceeded 24h`);
      }
    }

    const CASH_LIMIT = 5000;
    const hoursRemaining = cashData.thresholdReachedAt
      ? Math.max(0, 24 - ((Date.now() - new Date(cashData.thresholdReachedAt).getTime()) / (1000 * 60 * 60)))
      : null;

    res.json({
      currentAmount: cashData.currentAmount || 0,
      limit: CASH_LIMIT,
      isOverLimit: (cashData.currentAmount || 0) >= CASH_LIMIT,
      isAccountFrozen: cashData.isAccountFrozen || false,
      frozenReason: cashData.frozenReason || null,
      thresholdReachedAt: cashData.thresholdReachedAt || null,
      hoursRemaining: hoursRemaining ? parseFloat(hoursRemaining.toFixed(1)) : null,
      lastDepositDate: cashData.lastDepositDate || null,
      hasBankAccount: user.deliveryProfile?.bankDetails?.isLinked || false,
    });
  } catch (error) {
    console.error("Get cash collection error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Record cash deposit (delivery partner deposits to bank)
router.post("/cash-deposit", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "delivery_partner") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!user.deliveryProfile?.bankDetails?.isLinked) {
      return res.status(400).json({ message: "Please link a bank account first" });
    }

    const { amount } = req.body;
    const currentAmount = user.deliveryProfile?.cashCollection?.currentAmount || 0;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    if (amount > currentAmount) {
      return res.status(400).json({ message: `Cannot deposit more than current cash balance (₹${currentAmount})` });
    }

    // Reset cash collection
    user.deliveryProfile.cashCollection.currentAmount = Math.max(0, currentAmount - amount);
    user.deliveryProfile.cashCollection.lastDepositDate = new Date();

    // If deposited enough to go below limit, reset threshold timer
    if (user.deliveryProfile.cashCollection.currentAmount < 5000) {
      user.deliveryProfile.cashCollection.thresholdReachedAt = null;
    }

    // Unfreeze account if it was frozen
    if (user.deliveryProfile.cashCollection.isAccountFrozen) {
      user.deliveryProfile.cashCollection.isAccountFrozen = false;
      user.deliveryProfile.cashCollection.frozenAt = null;
      user.deliveryProfile.cashCollection.frozenReason = null;
      user.deliveryProfile.isAvailable = true;
      console.log(`🔓 Account UNFROZEN for delivery partner ${user._id} after cash deposit`);
    }

    await user.save();
    console.log(`💰 Cash deposit of ₹${amount} recorded for delivery partner ${user._id}. Remaining: ₹${user.deliveryProfile.cashCollection.currentAmount}`);

    res.json({
      message: `₹${amount} deposit recorded successfully`,
      currentAmount: user.deliveryProfile.cashCollection.currentAmount,
      isAccountFrozen: false,
    });
  } catch (error) {
    console.error("Cash deposit error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// DELIVERY HISTORY
// ══════════════════════════════════════════════════════════════════════════

router.get("/history", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "delivery_partner") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { page = 1, limit = 20, filter } = req.query;

    let dateFilter = {};
    const now = new Date();
    if (filter === "today") {
      dateFilter = { completedAt: { $gte: new Date(now.setHours(0, 0, 0, 0)) } };
    } else if (filter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { completedAt: { $gte: weekAgo } };
    } else if (filter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { completedAt: { $gte: monthAgo } };
    }

    const query = {
      deliveryPartner: user._id,
      status: { $in: ["delivered", "failed", "cancelled"] },
      ...dateFilter,
    };

    const deliveries = await DeliveryAssignment.find(query)
      .populate("order", "trackingNumber totalAmount subtotalAmount deliveryCharge paymentMethod createdAt")
      .populate("customer", "name phone")
      .populate("vendor", "name vendorProfile.businessName")
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await DeliveryAssignment.countDocuments(query);

    // Calculate summary stats
    const allCompleted = await DeliveryAssignment.find({
      deliveryPartner: user._id,
      status: "delivered",
      ...dateFilter,
    });

    const totalEarnings = allCompleted.reduce((sum, d) => sum + (d.deliveryFee || 0), 0);
    const totalDistance = allCompleted.reduce((sum, d) => sum + (d.distance || 0), 0);

    res.json({
      deliveries,
      summary: {
        totalDeliveries: total,
        completedDeliveries: allCompleted.length,
        totalEarnings,
        totalDistance: Math.round(totalDistance * 10) / 10,
      },
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get delivery history error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

module.exports = router;
