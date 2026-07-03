import mongoose from "mongoose";

import Enquiry from "../../models/enquiry.model.js";

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

const runEnquiryQuery = async (filter, { page, limit, skip }) => {
  const [enquiries, total] = await Promise.all([
    Enquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("handledBy", "loginId role"),

    Enquiry.countDocuments(filter)
  ]);

  return {
    enquiries,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1)
    }
  };
};

/**
 * Public: anyone can submit an enquiry, no auth required.
 */
export const createEnquiry = async (data) => {
  const enquiry = await Enquiry.create({
    studentName: data.studentName,
    parentName: data.parentName,
    phone: data.phone,
    email: data.email,
    classApplied: data.classApplied,
    message: data.message,
    source: data.source || "Website"
  });

  return enquiry;
};

/**
 * Admin: general listing with optional status/search/pagination filters.
 */
export const getAllEnquiries = async (query = {}) => {
  const { status, search } = query;

  const pagination = buildPagination(query);
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (search?.trim()) {
    filter.$or = [
      { studentName: { $regex: search, $options: "i" } },
      { parentName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  return runEnquiryQuery(filter, pagination);
};

/**
 * Admin: enquiries received in a given month/year, optionally narrowed
 * further by status. This is the "latest enquiries by month" view.
 */
export const getEnquiriesByMonth = async (query = {}) => {
  const { month, year, status } = query;

  const pagination = buildPagination(query);
  const filter = {};

  const dateRange = buildDateRange(month, year);

  if (!dateRange) {
    throw new Error("month and year are required");
  }

  filter.createdAt = dateRange;

  if (status) {
    filter.status = status;
  }

  return runEnquiryQuery(filter, pagination);
};

/**
 * Admin: single enquiry by ID.
 */
export const getEnquiryById = async (enquiryId) => {
  if (!mongoose.Types.ObjectId.isValid(enquiryId)) {
    throw new Error("Invalid enquiry ID");
  }

  const enquiry = await Enquiry.findById(enquiryId).populate(
    "handledBy",
    "loginId role"
  );

  if (!enquiry) {
    throw new Error("Enquiry not found");
  }

  return enquiry;
};

/**
 * Admin: update status/remarks/follow-up while working an enquiry.
 */
export const updateEnquiryStatus = async (enquiryId, data, adminUserId) => {
  if (!mongoose.Types.ObjectId.isValid(enquiryId)) {
    throw new Error("Invalid enquiry ID");
  }

  const updatePayload = {};

  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.remarks !== undefined) updatePayload.remarks = data.remarks;
  if (data.followUpDate !== undefined) updatePayload.followUpDate = data.followUpDate;

  // Default to whoever made the request unless a different handler is specified.
  updatePayload.handledBy = data.handledBy || adminUserId;

  const enquiry = await Enquiry.findByIdAndUpdate(enquiryId, updatePayload, {
    new: true,
    runValidators: true
  }).populate("handledBy", "loginId role");

  if (!enquiry) {
    throw new Error("Enquiry not found");
  }

  return enquiry;
};
