
import  StudentFee  from "../models/fee.model.monthlyFee.js"
import  AdditionalFee  from "../models/fee.model.additionalFee.js"

export const getStudentFees = async (studentId) => {

   const monthlyFee = await StudentFee.findOne({ student: studentId });

    if (!monthlyFee) {
        throw new Error("Student fee record not found");
    }

    const additionalFees = await AdditionalFee.find({
        student: studentId,
        status: "Pending"
    }).select("_id feeType amount status dueDate remarks");

    return {
        monthlyFee: {
            tuitionFee: monthlyFee.monthlyFee,
            transportFee: monthlyFee.transportFee,
            lastPaidMonth: monthlyFee.lastPaidMonth,
            lastPaidYear: monthlyFee.lastPaidYear
        },
        additionalFees
    };
};

