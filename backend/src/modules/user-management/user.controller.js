import { createUserService } from "./user.service.js";
import * as studentService from "../student/student.service.js";
// import * as teacherService from "../teacher/teacher.service.js";
import {
  getPaymentHistoryByMonth as getPaymentHistoryByMonthService,
  getPaymentHistoryByStudent as getPaymentHistoryByStudentService,
  getPaymentHistoryByGrade as getPaymentHistoryByGradeService,
  getPaymentById as getPaymentByIdService
} from "./paymentHistory.service.js";
import { generateReceiptPdf } from "../fee/services/receiptPdf.service.js";

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



export const getPaymentHistoryByMonth = async (req, res) => {
  try {
    const result = await getPaymentHistoryByMonthService(req.query);

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const getPaymentHistoryByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await getPaymentHistoryByStudentService(
      studentId,
      req.query
    );

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (err) {
    if (err.message === "Student not found") {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const getPaymentHistoryByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;

    const result = await getPaymentHistoryByGradeService(
      gradeId,
      req.query
    );

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const downloadReceiptPdf = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await getPaymentByIdService(paymentId);

    const pdfBuffer = await generateReceiptPdf({ payment });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${payment.receiptNumber}.pdf`
    );

    return res.send(pdfBuffer);

  } catch (err) {
    if (err.message === "Payment not found") {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};