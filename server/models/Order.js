const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "confirmed", "rejected", "preparing", "ready"],
          default: "pending",
        },
      },
    ],
    subtotalAmount: {
      type: Number,
      default: 0,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        type: { type: String, default: "Point" },
        coordinates: [Number], // [longitude, latitude]
      },
    },
    deliverySlot: {
      date: {
        type: Date,
        required: true,
      },
      timeSlot: {
        type: String,
        required: true,
        enum: ["morning", "afternoon", "evening"],
      },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cod", "upi", "card", "online"],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      required: true,
      enum: [
        "pending",
        "finding_vendor",
        "pending_vendor_approval",
        "confirmed",
        "processing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    trackingNumber: {
      type: String,
      unique: true,
    },
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    notes: String,
    pickupPin: {
      type: String,
      match: /^\d{4}$/,
    },
    deliveryPin: {
      type: String,
      match: /^\d{4}$/,
    },
    vendorPayout: {
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ["pending", "processing", "completed"],
        default: "pending",
      },
      processedAt: Date,
      method: {
        type: String,
        enum: ["instant", "cash_deposit"],
      },
    },
    rejectionReason: String,
  },
  {
    timestamps: true,
  },
);

// Index for geospatial queries
orderSchema.index({ "deliveryAddress.coordinates": "2dsphere" });

// Method to calculate total amount
orderSchema.methods.calculateTotal = function () {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
  return this.save();
};

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function () {
  return ["pending", "finding_vendor", "pending_vendor_approval", "confirmed", "processing"].includes(this.orderStatus);
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
