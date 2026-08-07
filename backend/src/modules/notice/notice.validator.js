import Joi from "joi";

export const createNoticeSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required(),

  description: Joi.string().trim().min(2).max(3000).required(),

  targetAudience: Joi.string()
    .valid("All", "Students", "Teachers", "Admins")
    .optional(),

  attachments: Joi.array().items(Joi.string().trim()).optional(),

  isActive: Joi.boolean().optional(),

  publishDate: Joi.date().optional(),

  expiryDate: Joi.date().optional()
});

export const updateNoticeSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).optional(),

  description: Joi.string().trim().min(2).max(3000).optional(),

  targetAudience: Joi.string()
    .valid("All", "Students", "Teachers", "Admins")
    .optional(),

  attachments: Joi.array().items(Joi.string().trim()).optional(),

  isActive: Joi.boolean().optional(),

  publishDate: Joi.date().optional(),

  expiryDate: Joi.date().optional()
}).min(1);
