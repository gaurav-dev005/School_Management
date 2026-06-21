import User from "../../models/user.model";
import bcrypt from "bcryptjs";
import { roleFactory } from "./user.factory";

export const createUserService = async (data)=>{
                const loginId = data.loginId ;
                const isExisting = await User.findOne({loginId}) ;
                
                if( isExisting )throw new Error("User already exists ") ;

                const hashedPassword = await bcrypt.hash( data.password , 10 ) ;

                const user = await User.create({
                                    loginId , 
                                    password : hashedPassword ,
                                    role:data.role ,
                                    isActive : true
                }) ;

                await roleFactory( data.role , data , user ) ;

              return {
                       id : user._id ,
                       loginId : user.loginId ,
                       role : user.role
              } ;
} ;

