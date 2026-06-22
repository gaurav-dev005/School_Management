import crypto from "crypto";

import FeePaymentOrder from "../models/feePaymentOrder.model.js";
import { calculatePayableFees, payStudentFees } from "./payment.service.js";
import { getPaymentGateway } from "./paymentGateway.service.js";


const generateOrderId = () => {
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

export const createPaymentOrder = async (
  studentId,
  userId,
  paymentData
) => {
  const gateway = paymentData.gateway || "paytm";

  const payable = await calculatePayableFees(studentId, paymentData);

  const idempotencyKey = generateIdempotencyKey(userId, paymentData);

  const existingOrder = await FeePaymentOrder.findOne({
    idempotencyKey,
    status: { $in: ["Created", "Pending"] }
  });

  if (existingOrder) {
    return {
      orderId: existingOrder.orderId,
      amount: existingOrder.amount,
      currency: existingOrder.currency,
      gateway: existingOrder.gateway,
      checkoutData: existingOrder.gatewayResponse?.checkoutData
    };
  }

  const order = await FeePaymentOrder.create({
    student: studentId,
    user: userId,

    orderId: generateOrderId(),
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

  const selectedGateway = getPaymentGateway(gateway);

  try {
    const gatewayResult = await selectedGateway.createOrder(order);

    order.status = "Pending";
    order.gatewayOrderId = gatewayResult.gatewayOrderId || order.orderId;
    order.gatewayResponse = gatewayResult;

    await order.save();

    return {
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      gateway: order.gateway,
      checkoutData: gatewayResult.checkoutData
    };

  } catch (err) {
    console.log("PAYMENT ORDER ERROR:", err);
    order.status = "Failed";
    order.gatewayResponse = {
      error: err.message
    };

    await order.save();

    throw new Error("Unable to create payment order");
  }
};

export const verifyPaymentOrder = async (verificationData) => {
  const { orderId, gatewayPayload } = verificationData;

  const order = await FeePaymentOrder.findOne({ orderId });

  if (!order) {
    throw new Error("Payment order not found");
  }

  if (order.status === "Success") {
    throw new Error("Payment already processed");
  }

  if (order.status !== "Pending") {
    throw new Error("Invalid payment order status");
  }

  const selectedGateway = getPaymentGateway(order.gateway);

  const verificationResult = await selectedGateway.verifyPayment({
    order,
    gatewayPayload
  });

  if (!verificationResult.success) {
    order.status = "Failed";
    order.gatewayResponse = verificationResult.rawResponse;
    await order.save();

    throw new Error("Payment verification failed");
  }

  if (String(verificationResult.orderId) !== String(order.orderId)) {
    throw new Error("Payment order mismatch");
  }

  if (Number(verificationResult.amount) !== Number(order.amount)) {
    throw new Error("Payment amount mismatch");
  }

const payment = await payStudentFees(
  order.student,
  {
    ...order.paymentData,
    paymentGateway: order.gateway,
    paymentMode: verificationResult.paymentMode || "Unknown",
    transactionId: verificationResult.gatewayPaymentId
  },
  order.user
);

  order.status = "Success";
  order.gatewayPaymentId = verificationResult.gatewayPaymentId;
  order.gatewayResponse = verificationResult.rawResponse;
  order.paidAt = new Date();

  await order.save();

  return payment;
};