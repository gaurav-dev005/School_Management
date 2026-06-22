import Student from "../../student/student.model.js"

import {
  createPaymentOrder,
  verifyPaymentOrder
} from "../services/paymentOrder.service.js";

export const createStudentPaymentOrder = async (req, res) => {
  try {
    const student = await Student.findOne({
      userId: req.user.id
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    const checkoutData = await createPaymentOrder(
      student._id,
      req.user.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: checkoutData
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const verifyStudentPaymentOrder = async (req, res) => {
  try {
    const payment = await verifyPaymentOrder(req.body);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const paytmPaymentCallback = async (req, res) => {
  try {
    const gatewayPayload = req.body;

    const orderId =
      gatewayPayload.ORDERID ||
      gatewayPayload.orderId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID missing in Paytm callback"
      });
    }

    const payment = await verifyPaymentOrder({
      orderId,
      gatewayPayload
    });

    return res.status(200).json({
      success: true,
      message: "Paytm payment verified successfully",
      payment
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};