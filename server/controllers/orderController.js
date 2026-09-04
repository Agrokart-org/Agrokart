const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const VendorInventory = require("../models/VendorInventory");
const { getIo } = require("../services/socketService");
const Notification = require("../models/Notification");
const { getCustomerPrice, getDeliveryCharge, getPlatformCommission, getVendorPayout } = require("../utils/pricing");

const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const createOrder = async (req, res, next) => {
  try {
    const { items, deliveryAddress, deliverySlot, paymentMethod } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: "Items are required" });
    }
    if (!deliveryAddress) {
      return res.status(400).json({ success: false, message: "Delivery address is required" });
    }

    let totalAmount = 0;
    const refinedItems = [];
    const validProductIds = []; // Track valid product IDs for inventory check

    // Verify products and calculate total
    for (const item of items) {
      let finalPrice = Number(item.price) || 100;
      let validProductObjId = new mongoose.Types.ObjectId(); // Fallback for invalid mock strings like 'fert1'
      let isValidProduct = false;

      if (item.product) {
        try {
          // If the product exists in MongoDB and is valid ObjectId, use its actual price
          if (mongoose.Types.ObjectId.isValid(item.product)) {
            validProductObjId = item.product;
            const pDoc = await Product.findById(item.product);
            if (pDoc) {
              finalPrice = Number(pDoc.price);
              isValidProduct = true;
            }
          }
        } catch (e) {
          console.error("Product lookup error (possibly mocking fallback):", e);
        }
      }

      // Apply platform markup — customer pays base + markup
      const customerPrice = getCustomerPrice(finalPrice);

      totalAmount += customerPrice * Number(item.quantity);
      refinedItems.push({
        product: validProductObjId,
        quantity: Number(item.quantity),
        basePrice: finalPrice,
        price: customerPrice,
        status: "pending",
      });

      if (isValidProduct) {
        validProductIds.push({ productId: validProductObjId, quantity: Number(item.quantity) });
      }
    }

    // ──────────────────────────────────────────────────────────────────────
    // DELIVERY CHARGE LOGIC
    // Orders with subtotal > ₹699 → FREE | Otherwise → ₹40
    // ──────────────────────────────────────────────────────────────────────
    const subtotalAmount = totalAmount;
    const deliveryCharge = getDeliveryCharge(subtotalAmount);
    totalAmount = subtotalAmount + deliveryCharge;
    
    // Calculate platform commission (1% for online payments)
    const platformFee = getPlatformCommission(subtotalAmount, paymentMethod || 'cod');
    console.log(`💰 Subtotal: ₹${subtotalAmount} | Delivery: ₹${deliveryCharge} | Platform Fee: ₹${platformFee} | Total: ₹${totalAmount}`);

    // ──────────────────────────────────────────────────────────────────────
    // INVENTORY-AWARE VENDOR ASSIGNMENT
    // Find the nearest vendor who has ALL ordered items in sufficient stock.
    // ──────────────────────────────────────────────────────────────────────
    let targetVendors = [];
    let vendors = await User.find({ role: "vendor" });

    // Step 1: If we have valid product IDs, filter vendors by stock availability
    let qualifiedVendorIds = null;
    if (validProductIds.length > 0) {
      // For each product, find which vendors carry it with enough available stock
      const vendorSetsPerProduct = [];
      for (const { productId, quantity } of validProductIds) {
        const inventoryHits = await VendorInventory.find({
          product: productId,
          isActive: true,
          availableStock: { $gte: quantity },
        }).select("vendor");

        const vendorIdSet = new Set(inventoryHits.map(inv => inv.vendor.toString()));
        vendorSetsPerProduct.push(vendorIdSet);
      }

      // Intersect all sets — vendors who have ALL items in stock
      if (vendorSetsPerProduct.length > 0) {
        qualifiedVendorIds = vendorSetsPerProduct.reduce((intersection, currentSet) => {
          return new Set([...intersection].filter(id => currentSet.has(id)));
        });
        console.log(`📦 Vendors with ALL items in stock: [${[...qualifiedVendorIds].join(", ")}]`);
      }
    }

    // Step 2: Collect all qualified vendors within 10km
    if (
      deliveryAddress.coordinates &&
      deliveryAddress.coordinates.coordinates &&
      vendors.length > 0
    ) {
      const [lng, lat] = deliveryAddress.coordinates.coordinates;
      console.log(`📍 Order placed with delivery coordinates: [lng: ${lng}, lat: ${lat}]`);

      for (let v of vendors) {
        // If we have inventory data, skip vendors who don't have stock
        if (qualifiedVendorIds && qualifiedVendorIds.size > 0) {
          if (!qualifiedVendorIds.has(v._id.toString())) {
            continue; // This vendor doesn't have all items — skip
          }
        }

        if (v.address && v.address.coordinates && v.address.coordinates.coordinates) {
          const [vlng, vlat] = v.address.coordinates.coordinates;
          const ds = getDistanceFromLatLonInM(lat, lng, vlat, vlng);
          console.log(`📏 Distance to vendor ${v.email} at [${vlng}, ${vlat}] is ${ds} meters`);
          if (ds <= 10000) {
            targetVendors.push(v);
          }
        }
      }
    }

    // Fallback: If no qualified vendor found by inventory+distance, collect ANY vendor within 10km
    // (this keeps backward compat for mock/test scenarios where VendorInventory is empty)
    if (targetVendors.length === 0 && vendors.length > 0) {
      console.log("⚠️ No vendor matched inventory filter — checking location only");
      if (
        deliveryAddress.coordinates &&
        deliveryAddress.coordinates.coordinates
      ) {
        const [lng, lat] = deliveryAddress.coordinates.coordinates;
        for (let v of vendors) {
          if (v.address && v.address.coordinates && v.address.coordinates.coordinates) {
            const [vlng, vlat] = v.address.coordinates.coordinates;
            const ds = getDistanceFromLatLonInM(lat, lng, vlat, vlng);
            console.log(`📏 [Fallback] Distance to vendor ${v.email} at [${vlng}, ${vlat}] is ${ds} meters`);
            if (ds <= 10000) {
              targetVendors.push(v);
            }
          }
        }
      }
    }

    if (targetVendors.length === 0 && vendors.length > 0) {
      const { DEMO_MODE } = require("../config/trackingConfig");
      if (DEMO_MODE) {
        console.log("⚠️ [DEMO_MODE] No vendor within 10km; auto-including available vendor for demo.");
        targetVendors.push(vendors[0]);
      }
    }

    if (targetVendors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be placed: No vendors available within a 10km radius of your delivery location."
      });
    }

    // Since this is broadcast-and-claim, we do NOT assign a vendor immediately.
    // Order items remain 'pending' and without a vendor ID.

    // Generate Verification PINs and Order Data
    const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));
    const pickupPin = String(Math.floor(1000 + Math.random() * 9000));
    const trackingNumber = `ORD${Date.now().toString().slice(-6)}`;

    // ──────────────────────────────────────────────────────────────────────
    // VENDOR APPROVAL FLOW: Broadcast to all nearby vendors.
    // First one to accept will claim the order.
    // ──────────────────────────────────────────────────────────────────────
    const initialStatus = "finding_vendor";

    // Calculate vendor payout (99% of subtotal for online, full for COD minus 1%)
    const vendorPayoutAmount = getVendorPayout(subtotalAmount, paymentMethod || 'cod');
    const vendorPayoutMethod = (paymentMethod === 'cod') ? 'cash_deposit' : 'instant';

    const newOrder = new Order({
      user: req.user.id,
      items: refinedItems,
      subtotalAmount,
      deliveryCharge,
      totalAmount,
      platformFee,
      deliveryAddress,
      deliverySlot,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
      orderStatus: initialStatus,
      pickupPin,
      deliveryPin,
      trackingNumber,
      vendorPayout: {
        amount: vendorPayoutAmount,
        status: 'pending',
        method: vendorPayoutMethod,
      },
    });

    const savedOrder = await newOrder.save();
    console.log(`✅ Order ${trackingNumber} created with status: ${initialStatus} | Vendors targeted: ${targetVendors.length}`);

    // Populate user and product info for broadcasting
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate("user", "name phone")
      .populate("items.product", "name price images unit category");

    // Convert to plain object to inject mock product fallbacks if populate failed
    const populatedOrderObj = populatedOrder.toObject();
    populatedOrderObj.items = populatedOrderObj.items.map(item => {
      if (!item.product) {
        item.product = {
          _id: item.product || new mongoose.Types.ObjectId(),
          name: "Mocked Product / Firebase Item",
          price: item.price,
          unit: "unit",
          category: "other"
        };
      }
      return item;
    });

    const io = getIo();
    if (io) {
      populatedOrderObj.vendorPayout = {
        amount: vendorPayoutAmount,
        method: vendorPayoutMethod,
      };
      populatedOrderObj.subtotalAmount = subtotalAmount;
      populatedOrderObj.deliveryCharge = deliveryCharge;

      console.log(`📦 Order broadcast to ${targetVendors.length} nearby vendors for claiming`);
      
      // Emit to each qualified vendor's specific room
      targetVendors.forEach(vendor => {
        io.to(`vendor_${vendor._id}`).emit("new_order_available", populatedOrderObj);
        if (vendor.firebaseUid) {
          io.to(`vendor_${vendor.firebaseUid}`).emit("new_order_available", populatedOrderObj);
        }
      });

      // Notify Customer that order is waiting for a vendor
      io.to(`order_${savedOrder._id}`).emit("order_status_updated", {
        status: "finding_vendor",
        orderId: savedOrder._id,
        message: "Your order is being broadcasted to nearby vendors.",
      });
      
      // Save notification to DB for each target vendor
      for (let vendor of targetVendors) {
        await Notification.createNotification({
          recipient: vendor._id,
          recipientType: "vendor",
          type: "new_order_available",
          title: "New Order — Accept to Claim",
          message: `Order ${trackingNumber} (₹${subtotalAmount}) is available. First to accept claims it!`,
          data: { orderId: savedOrder._id, trackingNumber },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Order placed. Searching for a vendor...",
      order: populatedOrderObj,
      _id: savedOrder._id,
      trackingNumber: savedOrder.trackingNumber
    });
  } catch (error) {
    console.error("Mongoose Order Creation Error", error);
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name price images unit category")
      .populate("items.vendor", "name phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, message: "Orders retrieved", data: orders });
  } catch (e) {
    next(e);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name price images unit category trackingNumber")
      .populate("items.vendor", "name phone");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order retrieved", data: order });
  } catch (e) {
    next(e);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.orderStatus = req.body.status;
    await order.save();

    res.json({ success: true, message: "Status updated", data: order });
  } catch (e) {
    next(e);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.canBeCancelled()) {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled in its current state." });
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.json({ success: true, message: "Order cancelled", data: order });
  } catch (e) {
    next(e);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, message: "Order deleted successfully", data: {} });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
};
