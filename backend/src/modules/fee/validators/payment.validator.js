import Joi from "joi";
export const createPaymentOrderSchema = Joi.object({
  // Only used when an admin/superadmin creates the order on behalf of a
  // student. Students create orders for themselves so this is not required
  // for them — see payment.controller.js.
  studentId: Joi.string()
    .optional(),

  toMonth: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional(),

  toYear: Joi.number()
    .integer()
    .min(2000)
    .optional(),

  additionalFeeIds: Joi.array()
    .items(Joi.string())
    .optional()
    .default([]),

  gateway: Joi.string()
    .valid("paytm", "razorpay", "cashfree","phonepe")
    .required()
})
  .custom((value, helpers) => {
    const hasMonthly = value.toMonth && value.toYear;
    const hasAdditional =
      value.additionalFeeIds && value.additionalFeeIds.length > 0;

    if (!hasMonthly && !hasAdditional) {
      return helpers.error("any.custom", {
        message: "Select monthly fee or additional fee"
      });
    }

    if ((value.toMonth && !value.toYear) || (!value.toMonth && value.toYear)) {
      return helpers.error("any.custom", {
        message: "Both toMonth and toYear are required for monthly payment"
      });
    }

    return value;
  });

// Used by admin/superadmin to record a cash payment for a student.
// No payment gateway is involved — the payment is applied directly.
export const createCashPaymentSchema = Joi.object({
  studentId: Joi.string()
    .required(),

  toMonth: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional(),

  toYear: Joi.number()
    .integer()
    .min(2000)
    .optional(),

  additionalFeeIds: Joi.array()
    .items(Joi.string())
    .optional()
    .default([]),

  // Sent from the admin frontend (e.g. the admin's own id). Falls back to
  // a fixed placeholder transaction id when not provided.
  transactionId: Joi.string()
    .optional(),

  remarks: Joi.string()
    .optional()
})
  .custom((value, helpers) => {
    const hasMonthly = value.toMonth && value.toYear;
    const hasAdditional =
      value.additionalFeeIds && value.additionalFeeIds.length > 0;

    if (!hasMonthly && !hasAdditional) {
      return helpers.error("any.custom", {
        message: "Select monthly fee or additional fee"
      });
    }

    if ((value.toMonth && !value.toYear) || (!value.toMonth && value.toYear)) {
      return helpers.error("any.custom", {
        message: "Both toMonth and toYear are required for monthly payment"
      });
    }

    return value;
  });

export const verifyPaymentOrderSchema = Joi.object({
  orderId: Joi.string()
    .required(),

  gatewayPayload: Joi.object()
    .unknown(true)
    .required()
});