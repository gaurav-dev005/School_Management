import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
           loginId : {
                       type : String ,
                       required : true , 
                       unique : true
           } ,
           password: {
                      type: String,
                      required: true
           },

           role : {
                    type : String , 
                    enum : ["student" , "superadmin" , "admin" , "teacher" ] ,
                 } ,
            isActive : {
                     type : Boolean ,
                     default : true
            } ,
            tokenVersion: {
                       type: Number,
                        default: 0
            } 
        } ,   
            {
               timestamps: true
            }
) ;

export default mongoose.model("User" , userSchema ) ;