import mongoose from "mongoose";
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const studentSchema = new Schema({
        userId: {
               type: ObjectId,
               ref: "User"
               } ,
               
        registrationNumber : {
                 type : String ,
                 unique : true ,
                 required : true 
        } ,
       
        
        personal : {
                     firstName : String ,
                     lastName  : String ,
                     gender : {
                              type : String ,
                              enum : ["Male" , "Female" , "Other" ] 
                     } ,
                     dob : Date ,
                     bloodGroup : String ,
                     photo : String 
                    
                     

                   } ,
         identification: {
                          aadhaarNumber : { type: String , 
                                            unique : true , 
                                            sparse : true 
                                         } ,
                          apaarId :     {   type: String , 
                                            unique : true , 
                                            sparse : true }               

                      } ,         
         contact: {

                     email: String,
                     phone: String,
                    
                     address: {

                         house: String,
                         city: String,
                         state: String,
                         pincode: String
                   }
                },  
      academic: {   class: {
                              type: ObjectId,
                              ref: "Class"
                           },

                  section: {
                             type: ObjectId ,
                             ref: "Section"
                           },

                  rollNumber: Number,
                  admissionDate: Date
              }, 
              
       guardian: {
                                fatherName: String,
                                motherName: String,
                                guardianName: String,
                                relation : String ,
                                phone: String,
                                email : String
                },

     status: {
                    type: String,
                    enum: ["Active","Inactive","Passed"]
              }
             
}) ;
export default mongoose.model("Student" , studentSchema ) ;