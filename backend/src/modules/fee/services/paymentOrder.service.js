import crypto from "crypto";

import FeePaymentOrder from "../models/feePaymentOrder.model.js";
import FeePaymentAttempt from "../models/feePaymentAttempt.model.js";

import { calculatePayableFees, payStudentFees } from "./payment.service.js";
import { getPaymentGateway } from "./paymentGateway.service.js";

const generateParentOrderId = () => {
  return `FPO${Date.now()}${crypto.randomBytes(4).toString("hex")}`;
};

const generateAttemptOrderId = () => {
  return `FEE${Date.now()}${crypto.randomBytes(4).toString("hex")}`;
};

const generateIdempotencyKey = (userId, paymentData) => {
  const raw = JSON.stringify({
    userId,
    toMonth: paymentData.toMonth,
    toYear: paymentData.toYear,
    additionalFeeIds: paymentData.additionalFeeIds || [],
    gateway: paymentData.gateway || "paytm"
  });

  return crypto.createHash("sha256").update(raw).digest("hex");
};

const buildCreateOrderResponse = (paymentOrder, attempt) => {
  return {
    paymentOrderId: paymentOrder.orderId,
    orderId: attempt.orderId,
    amount: attempt.amount,
    currency: attempt.currency,
    gateway: attempt.gateway,
    checkoutData: attempt.checkoutData
  };
};

export const createPaymentOrder = async (
  studentId,
  userId,
  paymentData
) => {
  const gateway = paymentData.gateway || "paytm";

  const idempotencyKey = generateIdempotencyKey(userId, {
    ...paymentData,
    gateway
  });

  let paymentOrder = await FeePaymentOrder.findOne({ idempotencyKey });

  if (paymentOrder?.status === "Success") {
    throw new Error("Payment already completed for this selection");
  }

  if (paymentOrder) {
    const activeAttempt = await FeePaymentAttempt.findOne({
      paymentOrder: paymentOrder._id,
      status: { $in: ["Created", "Pending", "Processing"] }
    }).sort({ createdAt: -1 });

    if (activeAttempt?.checkoutData) {
      return buildCreateOrderResponse(paymentOrder, activeAttempt);
    }
  }

  const payable = await calculatePayableFees(studentId, paymentData);

  if (!paymentOrder) {
    try {
      paymentOrder = await FeePaymentOrder.create({
        student: studentId,
        user: userId,

        orderId: generateParentOrderId(),
        amount: payable.totalAmount,
        currency: "INR",

        paymentData: {
          toMonth: paymentData.toMonth,
          toYear: paymentData.toYear,
          additionalFeeIds: paymentData.additionalFeeIds || []
        },

        gateway,
        status: "Created",
        idempotencyKey
      });

    } catch (err) {
      if (err.code !== 11000) {
        throw err;
      }

      paymentOrder = await FeePaymentOrder.findOne({ idempotencyKey });

      if (!paymentOrder) {
        throw err;
      }

      if (paymentOrder.status === "Success") {
        throw new Error("Payment already completed for this selection");
      }

      const activeAttempt = await FeePaymentAttempt.findOne({
        paymentOrder: paymentOrder._id,
        status: { $in: ["Created", "Pending", "Processing"] }
      }).sort({ createdAt: -1 });

      if (activeAttempt?.checkoutData) {
        return buildCreateOrderResponse(paymentOrder, activeAttempt);
      }
    }
  }

  const attempt = await FeePaymentAttempt.create({
    paymentOrder: paymentOrder._id,
    student: studentId,
    user: userId,

    orderId: generateAttemptOrderId(),

    gateway,
    amount: payable.totalAmount,
    currency: "INR",

    status: "Created"
  });

  const selectedGateway = getPaymentGateway(gateway);

  try {
    const gatewayResult = await selectedGateway.createOrder(attempt);

    attempt.status = "Pending";
    attempt.gatewayOrderId = gatewayResult.gatewayOrderId || attempt.orderId;
    attempt.checkoutData = gatewayResult.checkoutData;
    attempt.gatewayResponse = gatewayResult.rawResponse;

    await attempt.save();

    paymentOrder.status = "Pending";
    paymentOrder.amount = payable.totalAmount;
    paymentOrder.currency = "INR";
    paymentOrder.gateway = gateway;
    paymentOrder.paymentData = {
      toMonth: paymentData.toMonth,
      toYear: paymentData.toYear,
      additionalFeeIds: paymentData.additionalFeeIds || []
    };

    await paymentOrder.save();

    return buildCreateOrderResponse(paymentOrder, attempt);

  } catch (err) {
    console.log("PAYMENT ORDER ERROR:", err);

    attempt.status = "Failed";
    attempt.failureReason = err.message;
    attempt.gatewayResponse = {
      error: err.message
    };

    await attempt.save();

    throw new Error("Unable to create payment order");
  }
};

export const verifyPaymentOrder = async (verificationData) => {
  const { orderId, gatewayPayload } = verificationData;

  const attempt = await FeePaymentAttempt.findOne({ orderId });

  if (!attempt) {
    throw new Error("Payment attempt not found");
  }

  const paymentOrder = await FeePaymentOrder.findById(attempt.paymentOrder);

  if (!paymentOrder) {
    throw new Error("Payment order not found");
  }

if (attempt.status === "Success") {
  throw new Error("Payment already processed");
}

if (attempt.status === "Failed") {
  throw new Error("This payment attempt already failed");
}

if (attempt.status === "Expired") {
  throw new Error("This payment attempt has expired");
}

if (attempt.status === "Cancelled") {
  throw new Error("This payment attempt was cancelled");
}

if (attempt.status === "Processing") {
  throw new Error("Payment is already being processed");
}

if (paymentOrder.status === "Success") {
  throw new Error("Payment already completed using another attempt");
}

if (!["Created", "Pending"].includes(attempt.status)) {
  throw new Error("Invalid payment attempt status");
}

  const selectedGateway = getPaymentGateway(attempt.gateway);

  const verificationResult = await selectedGateway.verifyPayment({
    attempt,
    gatewayPayload
  });

  if (!verificationResult.success) {
    attempt.status = "Failed";
    attempt.failureReason = "Payment verification failed";
    attempt.gatewayResponse = verificationResult.rawResponse;

    await attempt.save();

    throw new Error("Payment verification failed");
  }

  if (String(verificationResult.orderId) !== String(attempt.orderId)) {
    throw new Error("Payment order mismatch");
  }

  if (Number(verificationResult.amount) !== Number(attempt.amount)) {
    throw new Error("Payment amount mismatch");
  }

  const lockedAttempt = await FeePaymentAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      status: { $in: ["Created", "Pending"] }
    },
    {
      status: "Processing"
    },
    {
      new: true
    }
  );

  if (!lockedAttempt) {
    const latestAttempt = await FeePaymentAttempt.findById(attempt._id);

    if (latestAttempt?.status === "Success") {
      throw new Error("Payment already processed");
    }

    throw new Error("Payment is already being processed");
  }

  try {
    const payment = await payStudentFees(
      paymentOrder.student,
      {
        ...paymentOrder.paymentData,
        paymentGateway: attempt.gateway,
        paymentMode: verificationResult.paymentMode || "Unknown",
        transactionId: verificationResult.gatewayPaymentId
      },
      paymentOrder.user
    );

    lockedAttempt.status = "Success";
    lockedAttempt.gatewayPaymentId = verificationResult.gatewayPaymentId;
    lockedAttempt.gatewayResponse = verificationResult.rawResponse;
    lockedAttempt.paidAt = new Date();

    await lockedAttempt.save();

    paymentOrder.status = "Success";
    paymentOrder.successfulAttempt = lockedAttempt._id;
    paymentOrder.paidAt = new Date();

    await paymentOrder.save();

    return payment;

  } catch (err) {
    lockedAttempt.status = "Pending";
    lockedAttempt.failureReason = err.message;

    await lockedAttempt.save();

    throw err;
  }
};