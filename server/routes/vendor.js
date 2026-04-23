const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const User = require("../models/User");
const VendorInventory = require("../models/VendorInventory");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Earnings = require("../models/Earnings");
const Notification = require("../models/Notification");
const DeliveryAssignment = require("../models/DeliveryAssignment");
const auth = require("../middleware/auth");
const { auth: firebaseAuth } = require("../config/firebase");
const { getIo } = require("../services/socketService");

// Helper to calculate distance (Haversine Formula) in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/vendor-documents/";
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

// Vendor login with role validation
router.post("/login", async (req, res) => {
  try {
    const { email, password, firebaseUid } = req.body;

    console.log("🔄 Vendor login attempt:", {
      email,
      firebaseUid: firebaseUid ? "Present" : "Missing",
    });

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user in database
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({
          message: "Invalid credentials. No account found with this email.",
        });
    }

    // Validate user role
    if (user.role !== "vendor") {
      console.log("❌ Role mismatch - Expected: vendor, Found:", user.role);
      return res.status(403).json({
        message: `Access denied. This account is registered as ${user.role}, not vendor. Please use the correct login page for your account type.`,
        userRole: user.role,
      });
    }

    console.log("✅ Vendor login successful:", {
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
        businessName: user.vendorProfile?.businessName,
        businessType: user.vendorProfile?.businessType,
        isVerified: user.vendorProfile?.isVerified || false,
      },
      token: "vendor-jwt-token", // In a real app, generate a proper JWT
    });
  } catch (error) {
    console.error("Vendor login error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Vendor registration with Firebase UID
router.post("/register", async (req, res) => {
  try {
    const {
      firebaseUid,
      name,
      email,
      phone,
      businessName,
      businessType,
      gstNumber,
      serviceAreas,
      bankDetails,
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

    // Create new vendor user
    const vendor = new User({
      firebaseUid,
      name,
      email,
      phone,
      role: "vendor",
      vendorProfile: {
        businessName,
        businessType,
        gstNumber,
        serviceAreas,
        bankDetails,
        isVerified: false,
        verificationStatus: "pending",
      },
    });

    await vendor.save();

    // Create notification for admin
    await Notification.createNotification({
      recipient: null, // Admin notification
      recipientType: "admin",
      type: "new_vendor_registration",
      title: "New Vendor Registration",
      message: `New vendor ${businessName} has registered and needs verification`,
      data: {
        vendorId: vendor._id,
        businessName,
        actionUrl: `/admin/vendors/${vendor._id}`,
      },
      priority: "medium",
    });

    res.status(201).json({
      message: "Vendor registered successfully",
      user: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        role: vendor.role,
        firebaseUid: vendor.firebaseUid,
        vendorProfile: vendor.vendorProfile,
      },
    });
  } catch (error) {
    console.error("Vendor registration error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Upload vendor documents
router.post(
  "/upload-documents",
  auth,
  upload.fields([
    { name: "gstCertificate", maxCount: 1 },
    { name: "businessLicense", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const vendor = await User.findById(req.user.id);

      if (!vendor || vendor.role !== "vendor") {
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

        vendor.vendorProfile.documents = {
          ...vendor.vendorProfile.documents,
          ...documents,
        };

        vendor.vendorProfile.verificationStatus = "under_review";
        await vendor.save();

        // Notify admin about document upload
        await Notification.createNotification({
          recipient: null,
          recipientType: "admin",
          type: "document_uploaded",
          title: "Vendor Documents Uploaded",
          message: `${vendor.vendorProfile.businessName} has uploaded verification documents`,
          data: {
            vendorId: vendor._id,
            actionUrl: `/admin/vendors/${vendor._id}/verify`,
          },
          priority: "medium",
        });
      }

      res.json({
        message: "Documents uploaded successfully",
        documents: vendor.vendorProfile.documents,
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ message: "Server error", details: error.message });
    }
  },
);

// Get vendor dashboard data
router.get("/dashboard", auth, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get earnings summary
    const earningsSummary = await Earnings.getEarningsSummary(
      vendor._id,
      "vendor",
      { year: currentYear, month: currentMonth },
    );

    // Get total products
    const totalProducts = await VendorInventory.countDocuments({
      vendor: vendor._id,
      isActive: true,
    });

    // Get low stock alerts
    const lowStockProducts = await VendorInventory.find({
      vendor: vendor._id,
      "alerts.lowStock": true,
      isActive: true,
    })
      .populate("product", "name")
      .limit(5);

    // Get recent orders
    const recentOrders = await Order.find({
      "items.vendor": vendor._id,
    })
      .populate("user", "name phone")
      .populate("items.product", "name price images unit category")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get monthly earnings trend
    const monthlyTrend = await Earnings.getMonthlyTrend(
      vendor._id,
      "vendor",
      currentYear,
    );

    res.json({
      vendor: {
        name: vendor.name,
        businessName: vendor.vendorProfile.businessName,
        isVerified: vendor.vendorProfile.isVerified,
        verificationStatus: vendor.vendorProfile.verificationStatus,
        rating: vendor.vendorProfile.rating,
      },
      stats: {
        totalProducts,
        totalEarnings: earningsSummary.totalNet,
        pendingEarnings: earningsSummary.pendingAmount,
        ordersThisMonth: earningsSummary.transactionCount,
        lowStockCount: lowStockProducts.length,
      },
      earningsSummary,
      lowStockProducts,
      recentOrders,
      monthlyTrend,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Get vendor inventory
router.get("/inventory", auth, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { page = 1, limit = 20, search, category, lowStock } = req.query;

    let query = { vendor: vendor._id, isActive: true };

    if (lowStock === "true") {
      query["alerts.lowStock"] = true;
    }

    const rawInventory = await VendorInventory.find(query)
      .populate(
        "product",
        "name category brand images image price description unit",
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Filter out inventory items where product reference is broken (null after populate)
    const inventory = rawInventory.filter((item) => {
      if (!item.product) {
        console.warn(
          `⚠️ Broken product reference in VendorInventory ${item._id} (product: ${item._doc?.product})`,
        );
        return false;
      }
      return true;
    });

    const total = await VendorInventory.countDocuments(query);

    res.json({
      inventory,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    console.error("Get inventory error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Add product to inventory
router.post("/inventory", auth, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      productId,
      stock,
      costPrice,
      sellingPrice,
      minStockLevel,
      maxStockLevel,
      discountPercentage,
      expiryDate,
      batchNumber,
      manufacturingDate,
    } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if vendor already has this product
    const existingInventory = await VendorInventory.findOne({
      vendor: vendor._id,
      product: productId,
    });

    if (existingInventory) {
      return res.status(400).json({
        message: "Product already exists in inventory. Use update instead.",
      });
    }

    const inventoryItem = new VendorInventory({
      vendor: vendor._id,
      product: productId,
      stock,
      costPrice,
      sellingPrice,
      minStockLevel,
      maxStockLevel,
      discountPercentage,
      expiryDate,
      batchNumber,
      manufacturingDate,
    });

    await inventoryItem.save();

    res.status(201).json({
      message: "Product added to inventory successfully",
      inventoryItem,
    });
  } catch (error) {
    console.error("Add inventory error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Update inventory item
router.put("/inventory/:id", auth, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const inventoryItem = await VendorInventory.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    });

    if (!inventoryItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const updateFields = [
      "stock",
      "costPrice",
      "sellingPrice",
      "minStockLevel",
      "maxStockLevel",
      "discountPercentage",
      "expiryDate",
      "batchNumber",
      "manufacturingDate",
      "isActive",
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        inventoryItem[field] = req.body[field];
      }
    });

    await inventoryItem.save();

    res.json({
      message: "Inventory updated successfully",
      inventoryItem,
    });
  } catch (error) {
    console.error("Update inventory error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Update daily stock for inventory item
router.patch("/inventory/:id/daily-stock", auth, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { dailyAllocatedStock, dailyStockDate } = req.body;

    const inventoryItem = await VendorInventory.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    });

    if (!inventoryItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    if (dailyAllocatedStock !== undefined) {
      inventoryItem.dailyAllocatedStock = dailyAllocatedStock;
    }
    if (dailyStockDate !== undefined) {
      inventoryItem.dailyStockDate = dailyStockDate;
    }

    await inventoryItem.save();

    res.json({ message: "Daily stock updated", inventoryItem });
  } catch (error) {
    console.error("Update daily stock error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Get vendor orders
router.get("/orders", auth, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { page = 1, limit = 20, status } = req.query;

    let query = { "items.vendor": vendor._id };

    if (status) {
      query.orderStatus = status;
    }

    console.log(`DEBUG: Fetching vendor orders.`);
    console.log(`DEBUG: Token User ID: ${req.user.id}`);
    console.log(`DEBUG: Target Vendor ID: ${vendor._id}`);
    console.log(`DEBUG: Query:`, JSON.stringify(query));

    const orders = await Order.find(query)
      .populate("user", "name phone address")
      .populate("items.product", "name price images unit category")
      .populate("deliveryPartner", "name phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
    });
  } catch (error) {
    console.error("Get vendor orders error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Accept/Reject order (Deprecated with auto-assign logic, but kept for reference/fallback if needed)
router.post("/orders/:orderId/respond", auth, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { action, reason } = req.body; // action: 'accept' or 'reject'

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if vendor has items in this order
    const hasVendorItems = order.items.some(
      (item) => item.vendor && item.vendor.toString() === vendor._id.toString(),
    );

    if (!hasVendorItems) {
      return res
        .status(403)
        .json({ message: "Order does not belong to this vendor" });
    }

    if (action === "accept") {
      order.orderStatus = "confirmed";

      // Generate 4-digit delivery PIN for customer verification
      const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));
      order.deliveryPin = deliveryPin;

      // Reserve stock for order items
      for (const item of order.items) {
        if (item.vendor && item.vendor.toString() === vendor._id.toString()) {
          const inventoryItem = await VendorInventory.findOne({
            vendor: vendor._id,
            product: item.product,
          });

          if (inventoryItem) {
            const reserved = inventoryItem.reserveStock(item.quantity);
            if (!reserved) {
              return res.status(400).json({
                message: `Insufficient stock for ${item.product.name}`,
              });
            }
            await inventoryItem.save();
          }
        }
      }

      // Create earnings record
      const totalAmount = order.items
        .filter(
          (item) =>
            item.vendor && item.vendor.toString() === vendor._id.toString(),
        )
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

      await Earnings.create({
        user: vendor._id,
        userType: "vendor",
        order: order._id,
        transactionType: "sale",
        grossAmount: totalAmount,
        commissionRate: vendor.vendorProfile.commissionRate || 10,
        description: `Sale for order ${order.trackingNumber}`,
      });
    } else if (action === "reject") {
      order.orderStatus = "cancelled";
      order.notes = reason || "Rejected by vendor";
    }

    await order.save();

    // Notify customer
    await Notification.createNotification({
      recipient: order.user,
      recipientType: "customer",
      type: action === "accept" ? "order_confirmed" : "order_cancelled",
      title: action === "accept" ? "Order Confirmed" : "Order Cancelled",
      message:
        action === "accept"
          ? `Your order ${order.trackingNumber} has been confirmed! Your delivery PIN is ${order.deliveryPin}. Share this PIN with the delivery partner upon arrival.`
          : `Your order ${order.trackingNumber} has been cancelled. Reason: ${reason}`,
      data: {
        orderId: order._id,
        trackingNumber: order.trackingNumber,
        actionUrl: `/orders/${order._id}`,
      },
      priority: "high",
    });

    // 6. Generate 4-digit Vendor Pickup PIN
    const vendorPickupPin = String(Math.floor(1000 + Math.random() * 9000));

    // If accepted, create delivery assignment and notify nearby delivery partners
    if (action === "accept") {
      // Kept for legacy support...
    }

    // Notify Customer via Socket
    const io = getIo();
    io.to(`order_${order._id}`).emit("order_status_updated", {
      status: action === "accept" ? "confirmed" : "cancelled",
      orderId: order._id,
    });

    res.json({
      message: `Order ${action}ed successfully`,
      order,
    });
  } catch (error) {
    console.error("Order response error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Claim an available order (Race Condition Logic)
router.post("/orders/:orderId/claim", auth, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);
    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied" });
    }

    // 1. Fetch Order and Verify Status (Race Condition Check)
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    // ... (skip unchanged lines)
    if (order.orderStatus !== "finding_vendor") {
      return res
        .status(400)
        .json({
          message:
            "This order is no longer available (already taken or cancelled)",
        });
    }

    // 2. Verify Stock Availability (Enabled — checks VendorInventory)
    const insufficientItems = [];
    for (const item of order.items) {
      const hasStock = await VendorInventory.exists({
        vendor: vendor._id,
        product: item.product,
        availableStock: { $gte: item.quantity },
        isActive: true,
      });
      if (!hasStock) {
        insufficientItems.push(item.product);
      }
    }

    // If no inventory records exist at all for this vendor, allow fallback (backward compat)
    const vendorInventoryCount = await VendorInventory.countDocuments({ vendor: vendor._id });
    if (insufficientItems.length > 0 && vendorInventoryCount > 0) {
      return res
        .status(400)
        .json({
          message: "One or more items are out of stock in your inventory",
          products: insufficientItems,
        });
    }

    // 3. Deduct Stock and Assign Vendor
    for (const item of order.items) {
      const inventoryItem = await VendorInventory.findOne({
        vendor: vendor._id,
        product: item.product,
      });

      // Reserve stock so other orders can't claim the same units
      if (inventoryItem) {
        inventoryItem.reservedStock += item.quantity;
        await inventoryItem.save();
        console.log(`📦 Reserved ${item.quantity} units of product ${item.product} for vendor ${vendor._id}`);
      }

      // Assign vendor to item
      item.vendor = vendor._id;
      item.status = "confirmed"; // Vendor confirmed
    }

    // 4. Update Order Status & Generate Delivery PIN
    order.orderStatus = "confirmed";
    const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));
    order.deliveryPin = deliveryPin;

    // Debug: Log items before save
    console.log("DEBUG: Saving order with items:", JSON.stringify(order.items));

    await order.save();
    console.log("DEBUG: Order saved successfully. Status:", order.orderStatus);

    // 5. Create Delivery Assignment (The "Pool" Record)
    const vendorPickupPin = String(Math.floor(1000 + Math.random() * 9000));

    const assignment = new DeliveryAssignment({
      order: order._id,
      vendor: vendor._id,
      customer: order.user,
      // deliveryPartner is undefined initially (Open Pool)
      status: "assigned", // Waiting for partner acceptance
      vendorPickupPin: vendorPickupPin,
      pickupLocation: {
        address: vendor.address,
        coordinates: vendor.address?.coordinates,
        contactPerson: vendor.vendorProfile?.businessName || vendor.name,
        contactPhone: vendor.phone,
      },
      deliveryLocation: {
        address: order.deliveryAddress,
        coordinates: order.deliveryAddress?.coordinates,
        contactPerson: "Customer",
        contactPhone: "N/A",
      },
      deliveryFee: Math.floor(order.totalAmount * 0.1), // 10% delivery fee logic
      priority: "high",
      tracking: {
        currentLocation: {
          type: "Point",
          coordinates: vendor.address?.coordinates?.coordinates || [0, 0], // Initialize with vendor location or default
        },
        status: "assigned",
        updatedAt: new Date(),
      },
    });
    await assignment.save();
    console.log("Delivery Assignment created:", assignment._id);

    // 6. Trigger Delivery Partner Search
    // Find delivery partners near the VENDOR
    if (vendor.address && vendor.address.coordinates) {
      const [lng, lat] = vendor.address.coordinates.coordinates;

      // Find partners within 10km
      const deliveryPartners = await User.find({
        role: "delivery_partner",
        "deliveryProfile.isAvailable": true,
        "address.coordinates": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: 10000, // 10km search
          },
        },
      });

      console.log(
        `Found ${deliveryPartners.length} nearby delivery partners for Order ${order.trackingNumber}`,
      );

      const io = getIo();

      // Build base notification data for broadcast fallback
      const claimDeliveryNotificationData = {
        orderId: order._id,
        _id: assignment._id,
        pickupLocation: vendor.address,
        dropLocation: order.deliveryAddress,
        vendorShopName: vendor.vendorProfile?.businessName || "Agro Shop",
        vendorContact: vendor.phone,
        earnings: Math.floor(order.totalAmount * 0.1),
        actionUrl: "/delivery/dashboard",
        message: `New Delivery Request: ${vendor.vendorProfile?.businessName || "Agro Shop"}`,
      };

      // Notify Delivery Partners
      for (const partner of deliveryPartners) {
        // Calculate distance from Partner to Vendor
        let distance = 0;
        if (partner.address && partner.address.coordinates) {
          const [pLng, pLat] = partner.address.coordinates.coordinates;
          distance = getDistanceFromLatLonInKm(lat, lng, pLat, pLng).toFixed(2); // Distance to Vendor
        }

        const notificationData = {
          ...claimDeliveryNotificationData,
          distance: distance + " km",
        };

        // Create DB Notification
        await Notification.createNotification({
          recipient: partner._id,
          recipientType: "delivery_partner",
          type: "delivery_request",
          title: "New Delivery Request",
          message: `Pickup from ${notificationData.vendorShopName} (${distance} km away). Earnings: ₹${notificationData.earnings}`,
          data: notificationData,
          priority: "urgent",
        });

        // Emit Socket Events (both event names for frontend compatibility)
        io.to(`delivery_partner_${partner._id}`).emit(
          "new_assignment",
          notificationData,
        );
        io.to(`delivery_partner_${partner._id}`).emit(
          "delivery_request",
          notificationData,
        );

        // Also emit to firebase UID room if available
        if (partner.firebaseUid) {
          io.to(`delivery_partner_${partner.firebaseUid}`).emit(
            "new_assignment",
            notificationData,
          );
          io.to(`delivery_partner_${partner.firebaseUid}`).emit(
            "delivery_request",
            notificationData,
          );
        }
      }

      // BROADCAST FALLBACK: Send to all connected delivery partners room
      console.log(
        "📡 BROADCAST: Emitting delivery_request & new_assignment to all_delivery_partners room",
      );
      io.to("all_delivery_partners").emit("new_assignment", claimDeliveryNotificationData);
      io.to("all_delivery_partners").emit("delivery_request", claimDeliveryNotificationData);
    }

    // Notify Customer
    await Notification.createNotification({
      recipient: order.user,
      recipientType: "customer",
      type: "order_confirmed",
      title: "Order Confirmed!",
      message: `Your order has been accepted by ${vendor.vendorProfile?.businessName || "Vendor"}. Your delivery PIN is ${deliveryPin}. Share this PIN with the delivery partner upon arrival.`,
      data: {
        orderId: order._id,
        vendorName: vendor.vendorProfile?.businessName,
      },
    });

    // ---------------------------------------------------------
    // REAL-TIME UPDATE: Notify all vendors that this order is taken
    // ---------------------------------------------------------
    const ioRef = getIo();

    // Emit globally to all vendors (or use a specific room if created)
    // For now, we emit to a general 'vendors' room if it exists, or loop through eligible vendors if we tracked them.
    // A simpler approach for "Available Orders" list update:
    // Emit an event that simply says "Order X is no longer available"
    ioRef.emit("order_no_longer_available", {
      orderId: order._id,
      reason: "claimed",
    });

    // Also emit to the specific vendor who claimed it (for confirmation/UI update)
    ioRef.to(`vendor_${vendor._id}`).emit("order_claimed_success", {
      orderId: order._id,
      order: order,
    });

    // Emit update to Customer Room
    ioRef.to(`order_${order._id}`).emit("order_status_updated", {
      status: "confirmed",
      orderId: order._id,
    });

    res.json({
      message: "Order claimed successfully",
      order,
    });
  } catch (error) {
    console.error("Claim order error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Get available orders for vendor (Geospatial)
router.get("/orders/available", auth, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);
    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!vendor.address || !vendor.address.coordinates) {
      return res.json([]); // No address, no nearby orders
    }

    const [lng, lat] = vendor.address.coordinates.coordinates;

    // Find orders with status 'finding_vendor' within 15km
    const orders = await Order.find({
      orderStatus: "finding_vendor",
      "deliveryAddress.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: 15000, // 15km
        },
      },
    })
      .populate("user", "name address")
      .sort({ createdAt: -1 });

    // Filter orders where THIS vendor actually has stock for the items
    // This is an expensive operation, but necessary to be accurate?
    // Or we can just let them see all, and fail on claim if no stock?
    // Let's filter to provide a better UX.

    // Return all nearby orders regardless of stock
    // The claim endpoint will validate stock availability
    res.json(orders);
    return;

    /* Stock filtering disabled to allow vendors to see demand
        const eligibleOrders = [];
        for (const order of orders) {
           ...
        }
        */

    res.json(eligibleOrders);
  } catch (error) {
    console.error("Get available orders error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// ── PATCH /vendor/inventory/:id/daily-stock ───────────────────────────────────
// Vendor sets how many units they are allocating for today
router.patch("/inventory/:id/daily-stock", auth, async (req, res) => {
  try {
    const { dailyAllocatedStock } = req.body;

    if (dailyAllocatedStock === undefined || dailyAllocatedStock < 0) {
      return res.status(400).json({ message: "Invalid dailyAllocatedStock value" });
    }

    const inventoryItem = await VendorInventory.findById(req.params.id);

    if (!inventoryItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    inventoryItem.dailyAllocatedStock = parseInt(dailyAllocatedStock);
    inventoryItem.dailyStockDate = new Date().toDateString();
    await inventoryItem.save();

    res.json({
      message: "Daily stock updated",
      inventoryItem: {
        _id: inventoryItem._id,
        dailyAllocatedStock: inventoryItem.dailyAllocatedStock,
        availableStock: inventoryItem.availableStock,
      },
    });
  } catch (error) {
    console.error("Daily stock update error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

module.exports = router;
