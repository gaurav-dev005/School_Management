import express from "express" ;
import { login } from "./auth.controller.js"
import { protect } from "../../middlewares/auth.middlware.js";

const router = express.Router() ;


router.post("/login" , login) ;

// on refresh , validation etc

router.get("/me" , protect , ( req , res )=>{
                     res.json({
                              message: "User is  authenticated " ,
                              user : req.user
                     }) ;
}) ;

export default router ;