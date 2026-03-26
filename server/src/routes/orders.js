const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const admin = require("firebase-admin");

// Haversine formula for naive distance in meters
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

const formatDoc = (doc) => ({ _id: doc.id, id: doc.id, ...doc.data() });

router.post("/", auth, async (req, res) => {
  try {
    const { items, deliveryAddress, deliverySlot, paymentMethod } = req.body;
    if (!items || !items.length)
      return res.status(400).json({ message: "Items are required" });
    if (!deliveryAddress)
      return res.status(400).json({ message: "Delivery address is required" });

    let totalAmount = 0;
    const refinedItems = [];

    // Fetch product prices
    for (const item of items) {
      let finalPrice = Number(item.price) || 100;
      if (item.product) {
        try {
          const pDoc = await db.collection("products").doc(item.product).get();
          if (pDoc.exists) finalPrice = Number(pDoc.data().price);
        } catch (e) {}
      }
      totalAmount += finalPrice * Number(item.quantity);
      refinedItems.push({
        product: item.product,
        quantity: Number(item.quantity),
        price: finalPrice,
        status: "confirmed",
      });
    }

    // Logic to assign vendor simplified: Find the first vendor.
    let assignedVendor = null;
    let vendorsSnap = await db
      .collection("users")
      .where("role", "==", "vendor")
      .get();
    let vendors = vendorsSnap.docs.map(formatDoc);

    // Pick nearest if coords available
    if (
      deliveryAddress.coordinates &&
      deliveryAddress.coordinates.coordinates &&
      vendors.length > 0
    ) {
      const [lng, lat] = deliveryAddress.coordinates.coordinates;

      let nearestDist = Infinity;
      for (let v of vendors) {
        if (
          v.address &&
          v.address.coordinates &&
          v.address.coordinates.coordinates
        ) {
          const [vlng, vlat] = v.address.coordinates.coordinates;
          const ds = getDistanceFromLatLonInM(lat, lng, vlat, vlng);
          if (ds < nearestDist) {
            nearestDist = ds;
            assignedVendor = v;
          }
        }
      }
    }
    if (!assignedVendor && vendors.length > 0) assignedVendor = vendors[0];

    if (assignedVendor) {
      refinedItems.forEach((i) => (i.vendor = assignedVendor.id));
    }

    const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));

    const orderData = {
      user: req.user.id,
      items: refinedItems,
      totalAmount,
      deliveryAddress,
      deliverySlot,
      paymentMethod: paymentMethod || "cod",
      orderStatus: "confirmed",
      deliveryPin,
      trackingNumber: `ORD${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("orders").add(orderData);
    orderData._id = docRef.id;

    // If you were using SocketIO, you'd emit events here
    // ... omitted for brevity / Firestore trigger equivalent

    res.status(201).json({
      message: "Order placed and accepted successfully.",
      order: orderData,
    });
  } catch (error) {
    console.error("Create order err:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Get user orders (with manual product population)
router.get("/my-orders", auth, async (req, res) => {
  try {
    const snap = await db
      .collection("orders")
      .where("user", "==", req.user.id)
      .get();
    let orders = [];
    for (let d of snap.docs) {
      let order = formatDoc(d);
      // Populate products
      for (let i = 0; i < order.items.length; i++) {
        if (order.items[i].product) {
          const pDoc = await db
            .collection("products")
            .doc(order.items[i].product)
            .get();
          if (pDoc.exists) order.items[i].product = formatDoc(pDoc);
        }
      }
      orders.push(order);
    }
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

// Get by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const doc = await db.collection("orders").doc(req.params.id).get();
    if (!doc.exists)
      return res.status(404).json({ message: "Order not found" });
    let order = formatDoc(doc);
    for (let i = 0; i < order.items.length; i++) {
      if (order.items[i].product) {
        const pDoc = await db
          .collection("products")
          .doc(order.items[i].product)
          .get();
        if (pDoc.exists) order.items[i].product = formatDoc(pDoc);
      }
    }
    // Authorization check skipped for brevity
    res.json(order);
  } catch (e) {
    res.status(500).send("Server Error");
  }
});

// Update Status
router.patch("/:id/status", auth, async (req, res) => {
  try {
    await db
      .collection("orders")
      .doc(req.params.id)
      .update({ orderStatus: req.body.status });
    res.json({ message: "Status updated" });
  } catch (e) {
    res.status(500).send("Server error");
  }
});

// Cancel Order
router.post("/:id/cancel", auth, async (req, res) => {
  try {
    await db
      .collection("orders")
      .doc(req.params.id)
      .update({ orderStatus: "cancelled" });
    res.json({ message: "Order cancelled" });
  } catch (e) {
    res.status(500).send("Server error");
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await db.collection("orders").doc(req.params.id).delete();
    res.json({ message: "Order deleted successfully" });
  } catch (e) {
    res.status(500).send("Server error");
  }
});

module.exports = router;
