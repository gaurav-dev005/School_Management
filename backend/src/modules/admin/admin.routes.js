import express from "express";

import { protect } from "../../middlewares/auth.middlware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validator.js";

import { createAdmin } from "./admin.controller.js";
import { createAdminSchema } from "./admin.validator.js";

const router = express.Router();

// Superadmin only — create a new admin account.
router.post(
  "/",
  protect,
  authorizeRoles("superadmin"),
  validate(createAdminSchema),
  createAdmin
);

export default router;
