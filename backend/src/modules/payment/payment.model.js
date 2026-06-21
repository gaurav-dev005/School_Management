import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
{
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },

    feeCategory: {
        type: String,
        enum: ["Monthly", "Additional"],
        required: true
    },

    amount: {
        type: Number,
        required: true,
        min: 1
    },

    paymentMethod: {
        type: String,
        enum: ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"],
        required: true
    },

    status: {
        type: String,
        enum: ["Success", "Failed", "Refunded"],
        default: "Success"
    },
    month: {
        type: Number,
        min: 1,
        max: 12
    },

    year: Number,
    additionalFeeId: {
        type: mongoose.Schema.Types.ObjectId
    },

    transactionId: String,

    receiptNumber: {
        type: String,
        unique: true
    },

    remarks: String

},
{
    timestamps: true
});

export default mongoose.model("Payment", paymentSchema);