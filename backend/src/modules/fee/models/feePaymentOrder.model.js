import mongoose from "mongoose";

const feePaymentOrderSchema = new mongoose.Schema(
  {
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

    /**
     * Parent order id / payment intent id.
     * This is not sent to PhonePe directly anymore.
     * PhonePe will use FeePaymentAttempt.orderId.
     */
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
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
      enum: ["paytm", "razorpay", "cashfree", "phonepe"],
      required: true
    },

    /**
     * Parent order status.
     * Failed attempt should NOT make parent Failed permanently.
     * Parent becomes Success only after a successful attempt.
     */
    status: {
      type: String,
      enum: ["Created", "Pending", "Success", "Expired", "Cancelled"],
      default: "Created",
      index: true
    },

    /**
     * Same payment selection gets same idempotencyKey.
     * This prevents duplicate successful payment intent.
     */
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    /**
     * Final successful attempt reference.
     */
    successfulAttempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeePaymentAttempt"
    },

    paidAt: {
      type: Date
    },

    cancelledAt: {
      type: Date
    },

    expiredAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model("FeePaymentOrder", feePaymentOrderSchema);