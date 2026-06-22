

import express from "express"
import { getMyProfileController ,  updateMyProfileController } from "./student.controller.js" ;
import { updateMyProfileValidator } from "./student.validator.js";
import { getMyFees } from "./student.controller.js "
import { protect } from "../../middlewares/auth.middlware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validator.js";


const router = express.Router();

router.get('/me' , protect , authorizeRoles("student") , getMyProfileController ) ;
router.patch('/me' , 
              protect ,
              authorizeRoles("student") ,
              validate(updateMyProfileValidator) ,
              updateMyProfileController ) ;

router.get('/me/fees' , 
             protect ,
             authorizeRoles("student") ,
             getMyFees
)              

export default router ;




