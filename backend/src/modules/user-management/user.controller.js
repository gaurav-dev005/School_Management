import { createUserService } from "./user.service.js";
import * as studentService from "../student/student.service.js";
// import * as teacherService from "../teacher/teacher.service.js";

export const createEntity = async (req, res) => {
  try {
    const result = await createUserService(req.body);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: result
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const getAllEntities = async (req, res) => {
  try {
    const { role } = req.query;

    let result;

    if (role === "student") {
      result = await studentService.getAllStudents(req.query);
    }
    // else if (role === "teacher") {
    //   result = await teacherService.getAllTeachers(req.query);
    // }
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing role"
      });
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getEntityById = async (req, res) => {
  try {
    const { role } = req.query;
    const { id } = req.params;

    let result;

    if (role === "student") {
      result = await studentService.getStudentById(id);
    }
    // else if (role === "teacher") {
    //   result = await teacherService.getTeacherById(id);
    // }
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing role"
      });
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const updateEntity = async (req, res) => {
  try {
    const { role } = req.query;
    const { id } = req.params;

    let result;

    if (role === "student") {
      result = await studentService.updateStudent(id, req.body);
    }
    // else if (role === "teacher") {
    //   result = await teacherService.updateTeacher(id, req.body);
    // }
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing role"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: result
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const deleteEntity = async (req, res) => {
  try {
    const { role } = req.query;
    const { id } = req.params;

    if (role === "student") {
      await studentService.deleteStudent(id);
    }
    // else if (role === "teacher") {
    //   await teacherService.deleteTeacher(id);
    // }
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing role"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Deleted successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};