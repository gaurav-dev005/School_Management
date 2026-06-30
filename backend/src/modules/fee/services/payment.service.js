import mongoose from "mongoose";

import StudentFee from "../models/fee.model.monthlyFee.js";
import AdditionalFee from "../models/fee.model.additionalFee.js";
import Payment from "../models/payment.model.js";
import Counter from "../../../models/counter.model.js"

const getNextMonth = (month, year) => {
  if (month === 0) {
    return { month: 1, year };
  }

  if (month === 12) {
    return { month: 1, year: year + 1 };
  }

  return { month: month + 1, year };
};

const getMonthCount = (fromMonth, fromYear, toMonth, toYear) => {
  return (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
};

const generateReceiptNumber = async (session) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "receipt" },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      session
    }
  );

  return counter.seq;
};

export const calculatePayableFees = async (
  studentId,
  paymentData,
  session = null
) => {
  const {
    toMonth,
    toYear,
    additionalFeeIds = []
  } = paymentData;

  const uniqueAdditionalFeeIds = [
    ...new Set(additionalFeeIds.map(String))
  ];

  if (uniqueAdditionalFeeIds.length !== additionalFeeIds.length) {
    throw new Error("Duplicate additional fee selected");
  }

  const feeRecordQuery = StudentFee.findOne({ student: studentId });

  if (session) {
    feeRecordQuery.session(session);
  }

  const feeRecord = await feeRecordQuery;

  if (!feeRecord) {
    throw new Error("Student fee record not found");
  }

  let additionalFeesQuery = AdditionalFee.find({
    _id: { $in: uniqueAdditionalFeeIds },
    student: studentId,
    status: "Pending"
  });

  if (session) {
    additionalFeesQuery.session(session);
  }

  const additionalFees = await additionalFeesQuery;

  if (additionalFees.length !== uniqueAdditionalFeeIds.length) {
    throw new Error("Invalid additional fee selection");
  }

  const totalAdditionalAmount = additionalFees.reduce(
    (sum, fee) => sum + fee.amount,
    0
  );

  let monthlyPayment = null;
  let totalMonthlyAmount = 0;

  if (toMonth && toYear) {
    if (toMonth < 1 || toMonth > 12) {
      throw new Error("Invalid month");
    }

    const nextDue = getNextMonth(
      feeRecord.lastPaidMonth,
      feeRecord.lastPaidYear
    );

    const monthsCount = getMonthCount(
      nextDue.month,
      nextDue.year,
      toMonth,
      toYear
    );

    if (monthsCount <= 0) {
      if (totalAdditionalAmount <= 0) {
        throw new Error("Invalid monthly fee range");
      }

      monthlyPayment = null;
      totalMonthlyAmount = 0;
    } else {
      const tuitionFee = feeRecord.monthlyFee || 0;
      const transportFee = feeRecord.transportFee || 0;

      const perMonthTotal = tuitionFee + transportFee;
      totalMonthlyAmount = perMonthTotal * monthsCount;

      monthlyPayment = {
        fromMonth: nextDue.month,
        fromYear: nextDue.year,
        toMonth,
        toYear,
        monthsCount,

        perMonthBreakup: {
          tuitionFee,
          transportFee,
          hostelFee: 0,
          otherMonthlyFee: 0
        },

        perMonthTotal,
        totalMonthlyAmount
      };
    }
  }

  const totalAmount = totalMonthlyAmount + totalAdditionalAmount;

  if (totalAmount <= 0) {
    throw new Error("No payable fee selected");
  }

  return {
    feeRecord,
    monthlyPayment,
    additionalFees,
    additionalFeeIds: uniqueAdditionalFeeIds,
    totalMonthlyAmount,
    totalAdditionalAmount,
    totalAmount
  };
};

export const payStudentFees = async (
  studentId,
  paymentData,
  receivedByUserId
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

  const {
  paymentGateway,
  paymentMode = "Unknown",
  transactionId,
  remarks
} = paymentData;

    const {
      feeRecord,
      monthlyPayment,
      additionalFees,
      additionalFeeIds,
      totalAmount
    } = await calculatePayableFees(
      studentId,
      paymentData,
      session
    );

    const receiptNumber = await generateReceiptNumber(session);

    const [payment] = await Payment.create(
      [
        {
          student: studentId,
          receivedBy: receivedByUserId,

          amount: totalAmount,
          paymentGateway,
           paymentMode,
          status: "Success",
          transactionId,
          receiptNumber,

          monthlyPayment,

          additionalFees: additionalFees.map((fee) => ({
            feeId: fee._id,
            feeType: fee.feeType,
            amount: fee.amount
          })),

          remarks
        }
      ],
      { session }
    );

    if (monthlyPayment) {
      feeRecord.lastPaidMonth = monthlyPayment.toMonth;
      feeRecord.lastPaidYear = monthlyPayment.toYear;

      await feeRecord.save({ session });
    }

    if (additionalFees.length > 0) {
      const result = await AdditionalFee.updateMany(
        {
          _id: { $in: additionalFeeIds },
          student: studentId,
          status: "Pending"
        },
        {
          status: "Paid"
        },
        { session }
      );

      if (result.modifiedCount !== additionalFeeIds.length) {
        throw new Error("Failed to update all additional fees");
      }
    }

    await session.commitTransaction();

    return payment;

  } catch (err) {
    await session.abortTransaction();
    throw new Error(err.message);

  } finally {
    await session.endSession();
  }
};