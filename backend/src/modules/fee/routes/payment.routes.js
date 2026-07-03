import express from "express";

import { protect } from "../../../middlewares/auth.middlware.js";
import { validate } from "../../../middlewares/validator.js";
import { authorizeRoles } from "../../../middlewares/role.middleware.js";

import {
  createStudentPaymentOrder,
  verifyStudentPaymentOrder,
  paytmPaymentCallback ,
  phonepeCallback , 
  getMyReceipts,
  getMyReceiptById ,
  downloadMyReceiptPdf ,
   getMyPaymentHistory,
  getMyPaymentHistoryById
} from "../controllers/payment.controller.js";

import {
  createPaymentOrderSchema,
  verifyPaymentOrderSchema
} from "../validators/payment.validator.js";

const router = express.Router();


router.post(
  "/me/create-order",
  protect,
  authorizeRoles("student"),
  validate(createPaymentOrderSchema),
  createStudentPaymentOrder
);

router.post(
  "/verify",
  protect,
  authorizeRoles("student"),
  validate(verifyPaymentOrderSchema),
  verifyStudentPaymentOrder
);

// Public route because Paytm calls this.
// Do not use protect here.
// Do not use strict validate here.
router.post(
  "/callback/paytm",
  paytmPaymentCallback
);

router.post("/callback/phonepe", phonepeCallback);


// payment history routes (no PDF/download here — see /me/receipts for that)

router.get(
  "/me/history",
  protect,
  authorizeRoles("student"),
  getMyPaymentHistory
);

router.get(
  "/me/history/:paymentId",
  protect,
  authorizeRoles("student"),
  getMyPaymentHistoryById
);





// receipts routes

router.get(
  "/me/receipts",
  protect,
  getMyReceipts
);

router.get(
  "/me/receipts/:paymentId/pdf",
  protect,
  downloadMyReceiptPdf
);

router.get(
  "/me/receipts/:paymentId",
  protect,
  getMyReceiptById
);

export default router;



