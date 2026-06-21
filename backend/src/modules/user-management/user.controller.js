import { createUserService } from "./user.service";
import * as studentService from "../student/student.service.js";
// import * as teacherService from "../teacher/teacher.service.js";

export const createEntity = async (req , res )=>{
             try{
                   const result = await createUserService(req.body) ;

                   res.status(201).json({
                         message : "user created succesfully " ,
                         data : result

                   }) ;
             }
             catch(err){
                        res.status(400).json({
                               message : err.message
                        }) ;
             }
} ;



export const getAllEntities = async (req, res) => {
  try {
    const { role } = req.query;

    let result;

    if (role === "student") {
      result = await studentService.getAllStudents(req.query);
    }

    if (role === "teacher") {
    //   result = await teacherService.getAllTeachers(req.query);
    }

    res.json({
      success: true,
      data: result
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


export const deleteEntity = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (role === "student") {
      await studentService.deleteStudent(id);
    }

    if (role === "teacher") {
    //   await teacherService.deleteTeacher(id);
    }

    res.json({
      success: true,
      message: "Deleted successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};




