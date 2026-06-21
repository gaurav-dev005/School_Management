import { createStudent } from "../student/student.service.js"
// import { createTeacher } from "../teacher/teacher.service.js"

export const roleFactory = async ( role , data , user )=>{
                            
                            if( role == "student" ){
                                    return createStudent( data , user ) ;
                            }

                            if( role == "teacher "){}
               throw new Error("Invalid role ") ;             

}
