import Joi from "joi";

export const createAdminSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),

  phone: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": "Enter a valid 10-digit phone number"
    }),

  email: Joi.string().trim().lowercase().email().optional().allow(""),

  username: Joi.string().trim().min(3).max(50).required(),

  password: Joi.string().min(6).max(100).required()
});
