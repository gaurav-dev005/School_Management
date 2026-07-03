import Joi from "joi";

export const createEnquirySchema = Joi.object({
  studentName: Joi.string().trim().min(2).max(100).required(),

  parentName: Joi.string().trim().min(2).max(100).required(),

  phone: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": "Enter a valid 10-digit phone number"
    }),

  email: Joi.string().trim().lowercase().email().optional().allow(""),

  classApplied: Joi.string().trim().max(50).optional().allow(""),

  message: Joi.string().trim().max(1000).optional().allow(""),

  source: Joi.string()
    .valid("Website", "Walk-in", "Phone", "Referral", "Other")
    .optional()
});

export const updateEnquiryStatusSchema = Joi.object({
  status: Joi.string()
    .valid("Pending", "Contacted", "Admitted", "Not Interested", "Closed")
    .required(),

  remarks: Joi.string().trim().max(1000).optional().allow(""),

  followUpDate: Joi.date().optional(),

  handledBy: Joi.string().optional()
});
