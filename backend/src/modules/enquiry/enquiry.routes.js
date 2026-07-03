import express from "express";

import { protect } from "../../middlewares/auth.middlware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validator.js";

import {
  createEnquiry,
  getAllEnquiries,
  getEnquiriesByMonth,
  getEnquiryById,
  updateEnquiryStatus
} from "./enquiry.controller.js";

import {
  createEnquirySchema,
  updateEnquiryStatusSchema
} from "./enquiry.validator.js";

const router = express.Router();

// Public — anyone (prospective parent/student) can submit an enquiry.
// Do not add `protect` here.
router.post(
  "/",
  validate(createEnquirySchema),
  createEnquiry
);

// Admin — latest enquiries filtered by month/year (and optionally status).
router.get(
  "/monthly",
  protect,
  authorizeRoles("superadmin", "admin"),
  getEnquiriesByMonth
);

// Admin — general listing with status/search/pagination filters.
router.get(
  "/",
  protect,
  authorizeRoles("superadmin", "admin"),
  getAllEnquiries
);

router.get(
  "/:id",
  protect,
  authorizeRoles("superadmin", "admin"),
  getEnquiryById
);

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("superadmin", "admin"),
  validate(updateEnquiryStatusSchema),
  updateEnquiryStatus
);

export default router;
