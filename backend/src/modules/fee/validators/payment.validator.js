import Joi from "joi";

export const createPaymentOrderSchema = Joi.object({
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
    .valid("paytm", "razorpay", "cashfree")
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

export const verifyPaymentOrderSchema = Joi.object({
  orderId: Joi.string()
    .required(),

  gatewayPayload: Joi.object()
    .unknown(true)
    .required()
});