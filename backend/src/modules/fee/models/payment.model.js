import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 1
    },

paymentGateway: {
  type: String,
  enum: ["paytm", "razorpay", "cashfree", "offline"],
  required: true
},

paymentMode: {
  type: String,
  enum: [
    "UPI",
    "Card",
    "Net Banking",
    "Wallet",
    "Cash",
    "Cheque",
    "Bank Transfer",
    "Unknown"
  ],
  default: "Unknown"
}
    ,

    status: {
      type: String,
      enum: ["Success", "Failed", "Refunded"],
      default: "Success"
    },

    transactionId: String,

    receiptNumber: {
      type: Number,
      unique: true,
      required: true
    },

    monthlyPayment: {
      fromMonth: Number,
      fromYear: Number,
      toMonth: Number,
      toYear: Number,
      monthsCount: Number,

      perMonthBreakup: {
        tuitionFee: {
          type: Number,
          default: 0
        },
        transportFee: {
          type: Number,
          default: 0
        },
        hostelFee: {
          type: Number,
          default: 0
        },
        otherMonthlyFee: {
          type: Number,
          default: 0
        }
      },

      perMonthTotal: {
        type: Number,
        default: 0
      },

      totalMonthlyAmount: {
        type: Number,
        default: 0
      }
    },

    additionalFees: [
      {
        feeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AdditionalFee"
        },
        feeType: String,
        amount: Number
      }
    ],

    remarks: String
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Payment", paymentSchema);