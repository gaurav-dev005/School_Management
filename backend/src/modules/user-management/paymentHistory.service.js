import mongoose from "mongoose";

import Payment from "../fee/models/payment.model.js";
import Student from "../student/student.model.js";

const populateOptions = [
  {
    path: "student",
    select: "registrationNumber personal academic",
    populate: [
      { path: "academic.class", select: "name" },
      { path: "academic.section", select: "name" }
    ]
  },
  {
    path: "receivedBy",
    select: "loginId role"
  }
];

const buildPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildDateRange = (month, year) => {
  if (!month && !year) return null;

  if (!month || !year) {
    throw new Error("Both month and year are required together");
  }

  const monthNum = Number(month);
  const yearNum = Number(year);

  if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
    throw new Error("Invalid month");
  }

  if (!Number.isInteger(yearNum) || yearNum < 2000) {
    throw new Error("Invalid year");
  }

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 1);

  return { $gte: startDate, $lt: endDate };
};

const buildCommonFilters = ({ status, gateway, mode }) => {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (gateway) {
    filter.paymentGateway = gateway;
  }

  if (mode) {
    filter.paymentMode = mode;
  }

  return filter;
};

// Admin/superadmin download route (added in user.routes.js) — kept here so
// each history row can carry a ready-to-use link for the frontend.
const RECEIPT_PDF_BASE_PATH = "/api/user-management/payments";

const attachReceiptUrl = (payment) => ({
  ...payment,
  receiptPdfUrl: `${RECEIPT_PDF_BASE_PATH}/${payment._id}/receipt/pdf`
});

const runPaymentQuery = async (filter, { page, limit, skip }) => {
  const [payments, total, totalAmountAgg] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(populateOptions)
      .lean(),

    Payment.countDocuments(filter),

    Payment.aggregate([
      { $match: filter },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ])
  ]);

  return {
    payments: payments.map(attachReceiptUrl),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1)
    },
    totalAmount: totalAmountAgg[0]?.totalAmount || 0
  };
};

/**
 * Payment history filtered by month/year, with optional grade/section/status/gateway filters.
 */
export const getPaymentHistoryByMonth = async (query = {}) => {
  const { month, year, gradeId, sectionId } = query;

  const pagination = buildPagination(query);
  const filter = buildCommonFilters(query);

  const dateRange = buildDateRange(month, year);

  if (!dateRange) {
    throw new Error("month and year are required");
  }

  filter.createdAt = dateRange;

  if (gradeId || sectionId) {
    if (gradeId && !mongoose.Types.ObjectId.isValid(gradeId)) {
      throw new Error("Invalid grade ID");
    }

    if (sectionId && !mongoose.Types.ObjectId.isValid(sectionId)) {
      throw new Error("Invalid section ID");
    }

    const studentFilter = {};

    if (gradeId) {
      studentFilter["academic.class"] = gradeId;
    }

    if (sectionId) {
      studentFilter["academic.section"] = sectionId;
    }

    const studentIds = await Student.find(studentFilter).distinct("_id");
    filter.student = { $in: studentIds };
  }

  return runPaymentQuery(filter, pagination);
};

/**
 * Payment history for a single student, with optional month/year/status/gateway filters.
 */
export const getPaymentHistoryByStudent = async (studentId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error("Invalid student ID");
  }

  const student = await Student.findById(studentId).select(
    "registrationNumber personal academic"
  );

  if (!student) {
    throw new Error("Student not found");
  }

  const { month, year } = query;

  const pagination = buildPagination(query);
  const filter = buildCommonFilters(query);
  filter.student = studentId;

  const dateRange = buildDateRange(month, year);

  if (dateRange) {
    filter.createdAt = dateRange;
  }

  const result = await runPaymentQuery(filter, pagination);

  return {
    student,
    ...result
  };
};

/**
 * Single payment by ID, fully populated for receipt generation.
 * Used by admins/superadmins to fetch any student's payment (unlike
 * the student-facing "my receipts" routes, this is not scoped to req.user).
 */
export const getPaymentById = async (paymentId) => {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error("Invalid payment ID");
  }

  const payment = await Payment.findById(paymentId).populate({
    path: "student",
    select: "registrationNumber personal academic guardian",
    populate: [
      { path: "academic.class", select: "name" },
      { path: "academic.section", select: "name" }
    ]
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
};

/**
 * Payment history for every student in a grade (class), with optional
 * section/month/year/status/gateway filters.
 */
export const getPaymentHistoryByGrade = async (gradeId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(gradeId)) {
    throw new Error("Invalid grade ID");
  }

  const { month, year, sectionId } = query;

  if (sectionId && !mongoose.Types.ObjectId.isValid(sectionId)) {
    throw new Error("Invalid section ID");
  }

  const pagination = buildPagination(query);

  const studentFilter = { "academic.class": gradeId };

  if (sectionId) {
    studentFilter["academic.section"] = sectionId;
  }

  const studentIds = await Student.find(studentFilter).distinct("_id");

  if (studentIds.length === 0) {
    return {
      payments: [],
      pagination: {
        total: 0,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: 1
      },
      totalAmount: 0
    };
  }

  const filter = buildCommonFilters(query);
  filter.student = { $in: studentIds };

  const dateRange = buildDateRange(month, year);

  if (dateRange) {
    filter.createdAt = dateRange;
  }

  return runPaymentQuery(filter, pagination);
};
