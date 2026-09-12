const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config();

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    return null;
  }
  return new Razorpay({ key_id, key_secret });
};

// Create an order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      console.error("Razorpay Error: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured");
      return res.status(503).json({
        success: false,
        message: "Payment service is currently unavailable. Razorpay configuration missing.",
      });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // Razorpay strictly requires an integer in paise (e.g. ₹550 -> 55000 paise)
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Something went wrong creating payment order", error: error.message });
  }
});

// Verify payment signature
router.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: "failure", message: "Missing required payment verification parameters" });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      console.error("Razorpay Error: RAZORPAY_KEY_SECRET is not configured");
      return res.status(503).json({ status: "failure", message: "Razorpay secret key not configured" });
    }

    const hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      res.json({ status: "success", message: "Payment verified successfully" });
    } else {
      res.status(400).json({ status: "failure", message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res
      .status(500)
      .json({ status: "failure", message: "Internal Server Error during verification", error: error.message });
  }
});

module.exports = router;
