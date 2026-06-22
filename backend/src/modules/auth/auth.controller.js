import User from "../../models/user.model.js"
import bcrypt from 'bcryptjs'
import { generateToken } from "./auth.utils.js"
import { loginUser } from "./auth.service.js";


export const login = async (req , res)=>{
          try{
                    const { loginId , password } = req.body ;

                    const result = await loginUser( loginId , password ) ;
                  

                        res.status(200).json({
                                 success : true ,
                                 message : "Login Succesful " ,
                                ...result 
                                
                        }) ;
          }
          catch(err){
                     console.log("LOGIN ERROR:", err);

  return res.status(500).json({
    success: false,
    message: err.message
  });

          }
}