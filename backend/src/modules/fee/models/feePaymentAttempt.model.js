import mongoose from "mongoose";

const feePaymentAttemptSchema = new mongoose.Schema(
  {
    paymentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeePaymentOrder",
      required: true,
      index: true
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    gateway: {
      type: String,
      enum: ["paytm", "phonepe"],
      required: true
    },

    gatewayOrderId: {
      type: String
    },

    gatewayPaymentId: {
      type: String
    },

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    status: {
      type: String,
      enum: ["Created", "Pending", "Processing", "Success", "Failed", "Expired", "Cancelled"],
      default: "Created",
      index: true
    },

    checkoutData: {
      type: mongoose.Schema.Types.Mixed
    },

    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed
    },

    failureReason: {
      type: String
    },

    paidAt: {
      type: Date
    },

    expiredAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const FeePaymentAttempt = mongoose.model(
  "FeePaymentAttempt",
  feePaymentAttemptSchema
);

export default FeePaymentAttempt;