import mongoose from "mongoose";

const additionalFeeSchema = new mongoose.Schema(
{
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },

    feeType: {
        type: String,
        required: true,
        enum: [
            "Library Fine",
            "Sports Fee",
            "fine" ,
            "Exam Fee",
            "Miscellaneous"
              ]
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ["Pending", "Paid", "Cancelled"],
        default: "Pending"
    },

    dueDate: Date,
    remarks: String
},
{
    timestamps: true
});

export default mongoose.model("AdditionalFee", additionalFeeSchema);