import mongoose from "mongoose";

const feePaymentOrderSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    orderId: {
      type: String,
      required: true,
      unique: true
    },

    amount: {
      type: Number,
      required: true,
      min: 1
    },

    currency: {
      type: String,
      default: "INR"
    },

    paymentData: {
      toMonth: Number,
      toYear: Number,

      additionalFeeIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AdditionalFee"
        }
      ]
    },

    gateway: {
      type: String,
      enum: ["paytm", "razorpay", "cashfree" , "phonepe"],
      required: true
    },

    gatewayOrderId: {
      type: String
    },

    gatewayPaymentId: {
      type: String
    },

    status: {
      type: String,
      enum: ["Created", "Pending", "Success", "Failed", "Expired"],
      default: "Created"
    },

    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true
    },

    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed
    },

    paidAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model("FeePaymentOrder", feePaymentOrderSchema);