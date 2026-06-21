import { createUserService } from "./user.service";

export const createUser = async (req , res )=>{
             try{
                   const user = await createUserService(req.body) ;

                   res.status(201).json({
                         message : "use created succesfully " ,
                         user

                   }) ;
             }
             catch(err){
                        res.status(400).json({
                               message : err.message
                        }) ;
             }
} ;