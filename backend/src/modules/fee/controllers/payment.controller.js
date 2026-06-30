import Student from "../../student/student.model.js"
import Payment from "../models/payment.model.js";
import { generateReceiptPdf } from "../services/receiptPdf.service.js";
import crypto from "crypto" ; 
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
    if (err.message === "Payment already processed") {
      return res.status(200).json({
        success: true,
        message: "Payment already processed"
      });
    }

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

export const phonepeCallback = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    const username = process.env.PHONEPE_WEBHOOK_USERNAME?.trim();
    const password = process.env.PHONEPE_WEBHOOK_PASSWORD?.trim();

    if (!username || !password) {
      console.log("PHONEPE WEBHOOK ERROR: username/password missing");

      return res.status(500).json({
        success: false,
        message: "Webhook configuration missing"
      });
    }

    const expectedAuth = crypto
      .createHash("sha256")
      .update(`${username}:${password}`)
      .digest("hex");

    if (!authHeader || authHeader.toLowerCase() !== expectedAuth.toLowerCase()) {
      console.log("PHONEPE WEBHOOK ERROR: invalid authorization header");

      return res.status(401).json({
        success: false,
        message: "Invalid webhook authorization"
      });
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    console.log("PHONEPE WEBHOOK RECEIVED:", {
      event,
      state: payload?.state,
      merchantOrderId: payload?.merchantOrderId,
      phonepeOrderId: payload?.orderId
    });

    if (!payload?.merchantOrderId) {
      return res.status(400).json({
        success: false,
        message: "merchantOrderId missing in webhook payload"
      });
    }

    if (
      event !== "checkout.order.completed" &&
      event !== "checkout.order.failed"
    ) {
      return res.status(200).json({
        success: true,
        message: "Webhook event ignored"
      });
    }

    try {
      const payment = await verifyPaymentOrder({
        orderId: payload.merchantOrderId,
        gatewayPayload: req.body
      });

      return res.status(200).json({
        success: true,
        message: "PhonePe webhook processed successfully",
        payment
      });

    } catch (err) {
      if (err.message === "Payment already processed") {
        return res.status(200).json({
          success: true,
          message: "Payment already processed"
        });
      }

      if (err.message === "Payment verification failed") {
        return res.status(200).json({
          success: true,
          message: "Webhook received, payment not successful"
        });
      }

      console.log("PHONEPE WEBHOOK PROCESSING ERROR:", err);

      return res.status(200).json({
        success: false,
        message: err.message
      });
    }

  } catch (err) {
    console.log("PHONEPE WEBHOOK ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "PhonePe webhook failed"
    });
  }
};



export const getMyReceipts = async (req, res) => {
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

    const receipts = await Payment.find({
      student: student._id,
      status: "Success"
    })
      .sort({ createdAt: -1 })
      .select(
        "receiptNumber amount paymentGateway paymentMode transactionId status monthlyPayment additionalFees createdAt"
      );

    return res.status(200).json({
      success: true,
      receipts
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getMyReceiptById = async (req, res) => {
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

const receipt = await Payment.findOne({
  _id: req.params.paymentId,
  student: student._id,
  status: "Success"
}).populate({
  path: "student",
  select: "registrationNumber personal academic guardian",
  populate: [
    {
      path: "academic.class",
      select: "name className"
    },
    {
      path: "academic.section",
      select: "name sectionName"
    }
  ]
});

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found"
      });
    }

    return res.status(200).json({
      success: true,
      receipt
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};





export const downloadMyReceiptPdf = async (req, res) => {
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

    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      student: student._id,
      status: "Success"
    }).populate({
      path: "student",
      select: "registrationNumber personal academic guardian",
      populate: [
        {
          path: "academic.class",
          select: "name"
        },
        {
          path: "academic.section",
          select: "name"
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found"
      });
    }

    const pdfBuffer = await generateReceiptPdf({
      payment
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${payment.receiptNumber}.pdf`
    );

    return res.send(pdfBuffer);

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};