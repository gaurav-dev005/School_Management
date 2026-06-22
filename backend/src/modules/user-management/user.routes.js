import express from "express";
import { protect } from "../../middlewares/auth.middlware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";

import {
  createEntity,
  getAllEntities,
  getEntityById,
  updateEntity,
  deleteEntity
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
  authorizeRoles("superadmin", "admin"),
  deleteEntity
);

export default router;