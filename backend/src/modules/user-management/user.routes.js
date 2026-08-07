import express from "express";
import { protect } from "../../middlewares/auth.middlware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";

import {
  createEntity,
  getAllEntities,
  getEntityById,
  updateEntity,
  deleteEntity,
  getPaymentHistoryByMonth,
  getPaymentHistoryByStudent,
  getPaymentHistoryByGrade,
  downloadReceiptPdf
} from "./user.controller.js";

const router = express.Router();

router.post(
  "/users",
  protect,
  authorizeRoles("superadmin", "admin"),
  createEntity
);

router.get(
  "/users",
  protect,
  authorizeRoles("superadmin", "admin"),
  getAllEntities
);

router.get(
  "/users/:id",
  protect,
  authorizeRoles("superadmin", "admin"),
  getEntityById
);

router.put(
  "/users/:id",
  protect,
  authorizeRoles("superadmin", "admin"),
  updateEntity
);

router.delete(
  "/users/:id",
  protect,
  authorizeRoles("superadmin"),
  deleteEntity
);

router.get(
  "/payments/history/monthly",
  protect,
  authorizeRoles("superadmin", "admin"),
  getPaymentHistoryByMonth
);

router.get(
  "/payments/history/student/:studentId",
  protect,
  authorizeRoles("superadmin", "admin"),
  getPaymentHistoryByStudent
);

router.get(
  "/payments/history/grade/:gradeId",
  protect,
  authorizeRoles("superadmin", "admin"),
  getPaymentHistoryByGrade
);

router.get(
  "/payments/:paymentId/receipt/pdf",
  protect,
  authorizeRoles("superadmin", "admin"),
  downloadReceiptPdf
);

export default router;