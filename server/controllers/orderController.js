const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const VendorInventory = require("../models/VendorInventory");
const { getIo } = require("../services/socketService");
const Notification = require("../models/Notification");

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

      totalAmount += finalPrice * Number(item.quantity);
      refinedItems.push({
        product: validProductObjId,
        quantity: Number(item.quantity),
        price: finalPrice,
        status: "pending",
      });

      if (isValidProduct) {
        validProductIds.push({ productId: validProductObjId, quantity: Number(item.quantity) });
      }
    }

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
      console.log("⚠️ No vendor matched inventory filter — falling back to nearest vendor regardless of stock");
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
      if (!assignedVendor) assignedVendor = vendors[0];
    }

    // Assign the found vendor to all item objects and mark as confirmed
    if (assignedVendor) {
      refinedItems.forEach((i) => {
        i.vendor = assignedVendor._id;
        i.status = "confirmed"; // Auto-confirmed since vendor was matched by stock
      });
    }

    // Generate Verification PINs and Order Data
    const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));
    const pickupPin = String(Math.floor(1000 + Math.random() * 9000));
    const trackingNumber = `ORD${Date.now().toString().slice(-6)}`;

    // ──────────────────────────────────────────────────────────────────────
    // AUTO-ASSIGN: If a vendor was found, set status directly to "confirmed"
    // instead of "finding_vendor" — no manual vendor claim step needed.
    // ──────────────────────────────────────────────────────────────────────
    const autoAssigned = !!assignedVendor;
    const initialStatus = autoAssigned ? "confirmed" : "finding_vendor";

    const newOrder = new Order({
      user: req.user.id,
      items: refinedItems,
      totalAmount,
      deliveryAddress,
      deliverySlot,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: "completed",
      orderStatus: initialStatus,
      pickupPin,
      deliveryPin,
      trackingNumber,
    });

    const savedOrder = await newOrder.save();
    console.log(`✅ Order ${trackingNumber} created with status: ${initialStatus}`);

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

        // ── Step 2: Notify Vendor ────────────────────────────────────────
        console.log(`📦 Order auto-assigned to vendor ${assignedVendor._id} (${assignedVendor.vendorProfile?.businessName || assignedVendor.name})`);
        
        io.to(`vendor_${assignedVendor._id}`).emit("new_order_available", populatedOrderObj);
        if (assignedVendor.firebaseUid) {
          io.to(`vendor_${assignedVendor.firebaseUid}`).emit("new_order_available", populatedOrderObj);
        }
        io.to("all_vendors").emit("new_order_available", populatedOrderObj);

        await Notification.createNotification({
          recipient: assignedVendor._id,
          recipientType: "vendor",
          type: "new_order_available",
          title: "New Order Auto-Assigned",
          message: `Order ${trackingNumber} has been auto-assigned to you. Please prepare the items.`,
          data: { orderId: savedOrder._id, trackingNumber },
        });

        // ── Step 3: Create DeliveryAssignment for delivery partner pool ──
        const DeliveryAssignment = require("../models/DeliveryAssignment");
        const vendorPickupPin = pickupPin;

        // Calculate distance-based delivery fee (₹10/km, min ₹40)
        let deliveryFee = 40;
        if (
          assignedVendor.address?.coordinates?.coordinates &&
          deliveryAddress.coordinates?.coordinates
        ) {
          const [vlng, vlat] = assignedVendor.address.coordinates.coordinates;
          const [clng, clat] = deliveryAddress.coordinates.coordinates;
          const distMeters = getDistanceFromLatLonInM(vlat, vlng, clat, clng);
          deliveryFee = Math.max(40, Math.round((distMeters / 1000) * 10));
        }

        const assignment = new DeliveryAssignment({
          order: savedOrder._id,
          vendor: assignedVendor._id,
          customer: req.user.id,
          status: "assigned", // Open pool — waiting for delivery partner
          vendorPickupPin,
          pickupLocation: {
            address: assignedVendor.address,
            coordinates: assignedVendor.address?.coordinates,
            contactPerson: assignedVendor.vendorProfile?.businessName || assignedVendor.name,
            contactPhone: assignedVendor.phone,
          },
          deliveryLocation: {
            address: deliveryAddress,
            coordinates: deliveryAddress.coordinates,
            contactPerson: "Customer",
            contactPhone: "N/A",
          },
          deliveryFee,
          priority: "high",
          tracking: {
            currentLocation: {
              type: "Point",
              coordinates: assignedVendor.address?.coordinates?.coordinates || [0, 0],
            },
            lastUpdated: new Date(),
          },
        });

        await assignment.save();
        console.log(`🚴 DeliveryAssignment ${assignment._id} created (open pool). Vendor pickup PIN: ${vendorPickupPin}`);

        // ── Step 4: Broadcast to ALL delivery partners ───────────────────
        const deliveryNotification = {
          orderId: savedOrder._id,
          _id: assignment._id,
          pickupLocation: assignedVendor.address,
          dropLocation: deliveryAddress,
          vendorShopName: assignedVendor.vendorProfile?.businessName || "Agro Shop",
          vendorContact: assignedVendor.phone,
          earnings: deliveryFee,
          trackingNumber,
          actionUrl: "/delivery/dashboard",
          message: `New Delivery: Pickup from ${assignedVendor.vendorProfile?.businessName || "Agro Shop"}`,
        };

        // Emit to the all_delivery_partners broadcast room
        io.to("all_delivery_partners").emit("new_assignment", deliveryNotification);
        io.to("all_delivery_partners").emit("delivery_request", deliveryNotification);
        console.log("📡 Broadcasted delivery_request to all_delivery_partners room");

        // Also notify Customer via socket that order is confirmed
        io.to(`order_${savedOrder._id}`).emit("order_status_updated", {
          status: "confirmed",
          orderId: savedOrder._id,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: autoAssigned
        ? "Order placed and auto-assigned to nearest vendor!"
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
