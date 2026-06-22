import mongoose from "mongoose";

const studentFeeSchema = new mongoose.Schema(
{
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
        unique: true
    },

    monthlyFee: {
         type: Number,
         required: true,
         min: 0
        }
    ,
    transportFee : {
                     type : Number ,
                     min : 0
    } ,
    hostelFee:{
             type : Number ,
             min : 0
    } ,

    lastPaidMonth: {
        type: Number,
        min: 0,
        max: 12,
        default: 0
    },

    lastPaidYear: {
        type: Number,
        default: null
    }
},
{
    timestamps: true
});

export default mongoose.model("StudentFee", studentFeeSchema);