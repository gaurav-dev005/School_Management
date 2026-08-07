import express from "express";

import { protect } from "../../middlewares/auth.middlware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validator.js";

import {
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice
} from "./notice.controller.js";

import {
  createNoticeSchema,
  updateNoticeSchema
} from "./notice.validator.js";

const router = express.Router();

// Admin/Superadmin — create a new notice.
router.post(
  "/",
  protect,
  authorizeRoles("superadmin", "admin"),
  validate(createNoticeSchema),
  createNotice
);

// Any authenticated user — list notices (filters: targetAudience, isActive, search, page, limit).
router.get(
  "/",
  protect,
  getAllNotices
);

// Any authenticated user — single notice by ID.
router.get(
  "/:id",
  protect,
  getNoticeById
);

// Admin/Superadmin — edit a notice.
router.put(
  "/:id",
  protect,
  authorizeRoles("superadmin", "admin"),
  validate(updateNoticeSchema),
  updateNotice
);

// Admin/Superadmin — delete a notice.
router.delete(
  "/:id",
  protect,
  authorizeRoles("superadmin", "admin"),
  deleteNotice
);

export default router;
