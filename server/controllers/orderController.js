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
    let assignedVendor = null;
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

    // Step 2: Pick nearest qualified vendor
    if (
      deliveryAddress.coordinates &&
      deliveryAddress.coordinates.coordinates &&
      vendors.length > 0
    ) {
      const [lng, lat] = deliveryAddress.coordinates.coordinates;
      let nearestDist = Infinity;

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
          if (ds < nearestDist) {
            nearestDist = ds;
            assignedVendor = v;
          }
        }
      }
    }

    // Fallback: If no qualified vendor found by inventory+distance, try any vendor
    // (this keeps backward compat for mock/test scenarios where VendorInventory is empty)
    if (!assignedVendor && vendors.length > 0) {
      console.log("⚠️ No vendor matched inventory filter — checking location");
      if (
        deliveryAddress.coordinates &&
        deliveryAddress.coordinates.coordinates
      ) {
        const [lng, lat] = deliveryAddress.coordinates.coordinates;
        let nearestDist = Infinity;
        for (let v of vendors) {
          if (v.address && v.address.coordinates && v.address.coordinates.coordinates) {
            const [vlng, vlat] = v.address.coordinates.coordinates;
            const ds = getDistanceFromLatLonInM(lat, lng, vlat, vlng);
            if (ds < nearestDist) {
              nearestDist = ds;
              assignedVendor = v;
            }
          }
        }
      }
      // REMOVED fallback to vendors[0] to allow broadcast ("finding_vendor")
    }

    // --- HACK FOR DEMO / TESTING ---
    // Force assign to Jack if requested by user for testing notifications
    const jackVendor = vendors.find(v => v.email === "jack@gmail.com");
    if (jackVendor) {
      assignedVendor = jackVendor;
      console.log("🛠️ DEMO MODE: Forced assignment to Jack");
    }
    // ---------------------------------

    // Assign the found vendor to all item objects (but keep status as 'pending' until vendor accepts)
    if (assignedVendor) {
      refinedItems.forEach((i) => {
        i.vendor = assignedVendor._id;
        i.status = "pending"; // Will be confirmed when vendor accepts
      });
    }

    // Generate Verification PINs and Order Data
    const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));
    const pickupPin = String(Math.floor(1000 + Math.random() * 9000));
    const trackingNumber = `ORD${Date.now().toString().slice(-6)}`;

    // ──────────────────────────────────────────────────────────────────────
    // VENDOR APPROVAL FLOW: Set status to "pending_vendor_approval" so
    // vendor can explicitly accept or reject the order.
    // ──────────────────────────────────────────────────────────────────────
    const initialStatus = assignedVendor ? "pending_vendor_approval" : "finding_vendor";

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
    console.log(`✅ Order ${trackingNumber} created with status: ${initialStatus} | Vendor payout: ₹${vendorPayoutAmount} (${vendorPayoutMethod})`);

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

    if (assignedVendor) {
      const io = getIo();
      if (io) {
        // ── Step 1: Reserve stock in VendorInventory ─────────────────────
        for (const { productId, quantity } of validProductIds) {
          try {
            const invItem = await VendorInventory.findOne({
              vendor: assignedVendor._id,
              product: productId,
            });
            if (invItem) {
              invItem.reservedStock += quantity;
              await invItem.save();
              console.log(`📦 Auto-reserved ${quantity} units of product ${productId} for vendor ${assignedVendor._id}`);
            }
          } catch (stockErr) {
            console.error("Stock reservation error (non-critical):", stockErr.message);
          }
        }

        // ── Step 2: Notify Vendor of PENDING order (vendor must accept/reject) ──
        console.log(`📦 Order sent to vendor ${assignedVendor._id} (${assignedVendor.vendorProfile?.businessName || assignedVendor.name}) for approval`);
        
        // Include payout info in the notification data
        populatedOrderObj.vendorPayout = {
          amount: vendorPayoutAmount,
          method: vendorPayoutMethod,
        };
        populatedOrderObj.subtotalAmount = subtotalAmount;
        populatedOrderObj.deliveryCharge = deliveryCharge;

        io.to(`vendor_${assignedVendor._id}`).emit("new_order_available", populatedOrderObj);
        if (assignedVendor.firebaseUid) {
          io.to(`vendor_${assignedVendor.firebaseUid}`).emit("new_order_available", populatedOrderObj);
        }
        // Removed io.to("all_vendors").emit("new_order_available", populatedOrderObj); so other vendors don't falsely receive this assigned order.

        await Notification.createNotification({
          recipient: assignedVendor._id,
          recipientType: "vendor",
          type: "new_order_available",
          title: "New Order — Accept or Reject",
          message: `Order ${trackingNumber} (₹${subtotalAmount}) is waiting for your approval. Your payout: ₹${vendorPayoutAmount}.`,
          data: { orderId: savedOrder._id, trackingNumber },
        });

        // NOTE: DeliveryAssignment is NOT created here anymore.
        // It will be created only when vendor accepts the order.
        // See vendor.js routes -> POST /orders/:orderId/respond

        // Notify Customer that order is waiting for vendor approval
        io.to(`order_${savedOrder._id}`).emit("order_status_updated", {
          status: "pending_vendor_approval",
          orderId: savedOrder._id,
          message: "Your order is being reviewed by the vendor.",
        });
      }
    } else {
      const io = getIo();
      if (io) {
        // Include payout info in the notification data
        populatedOrderObj.vendorPayout = {
          amount: vendorPayoutAmount,
          method: vendorPayoutMethod,
        };
        populatedOrderObj.subtotalAmount = subtotalAmount;
        populatedOrderObj.deliveryCharge = deliveryCharge;

        console.log(`📦 Order broadcast to all vendors for claiming`);
        io.to("all_vendors").emit("new_order_available", populatedOrderObj);

        // Notify Customer that order is waiting for a vendor
        io.to(`order_${savedOrder._id}`).emit("order_status_updated", {
          status: "finding_vendor",
          orderId: savedOrder._id,
          message: "Your order is being broadcasted to nearby vendors.",
        });
      }
    }

    res.status(201).json({
      success: true,
      message: assignedVendor
        ? "Order placed! Waiting for vendor approval."
        : "Order placed. Searching for a vendor...",
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
