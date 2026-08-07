import mongoose from "mongoose";

import Notice from "../../models/notice.model.js";

const buildPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Admin/Superadmin: create a new notice.
 */
export const createNotice = async (data, postedByUserId) => {
  const notice = await Notice.create({
    title: data.title,
    description: data.description,
    targetAudience: data.targetAudience || "All",
    attachments: data.attachments || [],
    isActive: data.isActive !== undefined ? data.isActive : true,
    publishDate: data.publishDate || Date.now(),
    expiryDate: data.expiryDate,
    postedBy: postedByUserId
  });

  return notice;
};

/**
 * Any authenticated user: list notices with optional filters/pagination.
 */
export const getAllNotices = async (query = {}) => {
  const { targetAudience, isActive, search } = query;

  const pagination = buildPagination(query);
  const filter = {};

  if (targetAudience) {
    filter.targetAudience = { $in: [targetAudience, "All"] };
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  if (search?.trim()) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  const [notices, total] = await Promise.all([
    Notice.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate("postedBy", "loginId role")
      .populate("updatedBy", "loginId role"),

    Notice.countDocuments(filter)
  ]);

  return {
    notices,
    pagination: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.max(Math.ceil(total / pagination.limit), 1)
    }
  };
};

/**
 * Any authenticated user: single notice by ID.
 */
export const getNoticeById = async (noticeId) => {
  if (!mongoose.Types.ObjectId.isValid(noticeId)) {
    throw new Error("Invalid notice ID");
  }

  const notice = await Notice.findById(noticeId)
    .populate("postedBy", "loginId role")
    .populate("updatedBy", "loginId role");

  if (!notice) {
    throw new Error("Notice not found");
  }

  return notice;
};

/**
 * Admin/Superadmin: edit an existing notice.
 */
export const updateNotice = async (noticeId, data, updatedByUserId) => {
  if (!mongoose.Types.ObjectId.isValid(noticeId)) {
    throw new Error("Invalid notice ID");
  }

  const updatePayload = { ...data, updatedBy: updatedByUserId };

  const notice = await Notice.findByIdAndUpdate(noticeId, updatePayload, {
    new: true,
    runValidators: true
  })
    .populate("postedBy", "loginId role")
    .populate("updatedBy", "loginId role");

  if (!notice) {
    throw new Error("Notice not found");
  }

  return notice;
};

/**
 * Admin/Superadmin: delete a notice.
 */
export const deleteNotice = async (noticeId) => {
  if (!mongoose.Types.ObjectId.isValid(noticeId)) {
    throw new Error("Invalid notice ID");
  }

  const notice = await Notice.findByIdAndDelete(noticeId);

  if (!notice) {
    throw new Error("Notice not found");
  }

  return notice;
};
