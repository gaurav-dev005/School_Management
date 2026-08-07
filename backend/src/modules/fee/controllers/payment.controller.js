import Student from "../../student/student.model.js"
import Payment from "../models/payment.model.js";
import { generateReceiptPdf } from "../services/receiptPdf.service.js";
import crypto from "crypto" ; 
import {
  createPaymentOrder,
  verifyPaymentOrder
} from "../services/paymentOrder.service.js";
import { payStudentFees } from "../services/payment.service.js";

export const createStudentPaymentOrder = async (req, res) => {
  try {
    let student;

    if (req.user.role === "admin" || req.user.role === "superadmin") {
      // Admin/superadmin are paying on behalf of a student, so the
      // student must be identified explicitly from the request body.
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: "studentId is required"
        });
      }

      student = await Student.findById(studentId);
    } else {
      student = await Student.findOne({
        userId: req.user.id
      });
    }

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
    const isAdminRole = req.user.role === "admin" || req.user.role === "superadmin";

    let receiptQuery;

    if (isAdminRole) {
      // Admin/superadmin can pull up any student's receipt by paymentId —
      // they already have the paymentId from create-order/verify/cash-payment.
      receiptQuery = {
        _id: req.params.paymentId,
        status: "Success"
      };
    } else {
      const student = await Student.findOne({
        userId: req.user.id
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found"
        });
      }

      receiptQuery = {
        _id: req.params.paymentId,
        student: student._id,
        status: "Success"
      };
    }

const receipt = await Payment.findOne(receiptQuery).populate({
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

// Student's own full payment history (all statuses — Success/Failed/Refunded),
// NOT limited to successful payments like getMyReceipts. No receipt download
// option here on purpose — just list + detail view.

export const getMyPaymentHistory = async (req, res) => {
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

    const { month, year, status, gateway, mode } = req.query;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { student: student._id };

    if (status) filter.status = status;
    if (gateway) filter.paymentGateway = gateway;
    if (mode) filter.paymentMode = mode;

    if (month || year) {
      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: "Both month and year are required together"
        });
      }

      const monthNum = Number(month);
      const yearNum = Number(year);

      if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid month"
        });
      }

      if (!Number.isInteger(yearNum) || yearNum < 2000) {
        return res.status(400).json({
          success: false,
          message: "Invalid year"
        });
      }

      filter.createdAt = {
        $gte: new Date(yearNum, monthNum - 1, 1),
        $lt: new Date(yearNum, monthNum, 1)
      };
    }

    const [payments, total, totalAmountAgg] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "receiptNumber amount paymentGateway paymentMode transactionId status monthlyPayment additionalFees remarks createdAt"
        )
        .lean(),

      Payment.countDocuments(filter),

      Payment.aggregate([
        { $match: filter },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      },
      totalAmount: totalAmountAgg[0]?.totalAmount || 0
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Single payment detail (any status) — for the "see payment details" view.
// Deliberately does NOT expose a PDF/download link.

export const getMyPaymentHistoryById = async (req, res) => {
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
      student: student._id
    }).select(
      "receiptNumber amount paymentGateway paymentMode transactionId status monthlyPayment additionalFees remarks createdAt"
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      success: true,
      payment
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// Admin/superadmin record a cash payment for a student. No gateway or
// order/attempt flow involved — the payment is applied directly and saved
// to payment history the same way, with paymentGateway "offline" and
// paymentMode "Cash".
export const createCashPayment = async (req, res) => {
  try {
    const {
      studentId,
      toMonth,
      toYear,
      additionalFeeIds,
      transactionId,
      remarks
    } = req.body;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    const payment = await payStudentFees(
      student._id,
      {
        toMonth,
        toYear,
        additionalFeeIds,
        paymentGateway: "offline",
        paymentMode: "Cash",
        // Fixed placeholder if the frontend doesn't send one (e.g. the
        // admin's own id).
        transactionId: transactionId || "11111",
        remarks
      },
      req.user.id
    );

    return res.status(201).json({
      success: true,
      message: "Cash payment recorded successfully",
      payment
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const downloadMyReceiptPdf = async (req, res) => {
  try {
    const isAdminRole = req.user.role === "admin" || req.user.role === "superadmin";

    let paymentQuery;

    if (isAdminRole) {
      // Admin/superadmin can download any student's receipt PDF by
      // paymentId — they already have the paymentId from
      // create-order/verify/cash-payment.
      paymentQuery = {
        _id: req.params.paymentId,
        status: "Success"
      };
    } else {
      const student = await Student.findOne({
        userId: req.user.id
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found"
        });
      }

      paymentQuery = {
        _id: req.params.paymentId,
        student: student._id,
        status: "Success"
      };
    }

    const payment = await Payment.findOne(paymentQuery).populate({
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