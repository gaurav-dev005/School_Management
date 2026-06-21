import express from "express";
import { protect } from "../../middleware/auth.middlware";
import { authorizeRoles } from "../../middleware/role.middleware";
import { createEntity , getAllEntities , deleteEntity } from "./user.controller";
import { protect } from "../../middleware/auth.middlware";
import { authorizeRoles } from "../../middleware/role.middleware";

const router = express.Router() ;

router.post("/createUser" , protect , authorizeRoles("superadmin" , "admin") , createEntity ) ; 
router.get("/user" , protect , authorizeRoles("superadmin" , "admin") , getAllEntities ) ; 
router.delete("user/:id" , protect , authorizeRoles("admin" , "superadmin") , deleteEntity ) ;



