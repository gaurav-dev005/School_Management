import User from "../../models/user.model.js"
import bcrypt from 'bcryptjs'
import { generateToken } from "./auth.utils.js"
import { loginUser } from "./auth.service.js";


export const login = async (req , res)=>{
          try{
                    const { loginId , password } = req.body ;

                    const result = await loginUser({ loginId , password }) ;
                  

                        res.status(200).json({
                                 message : "Login Succesful " ,
                                ...result
                        }) ;
          }
          catch(error){
                    res.status(500).json({
                           message :" in autokay lets do nextServer Error"
                    }) ;

          }
}