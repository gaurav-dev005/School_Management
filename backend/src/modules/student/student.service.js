import Student from "./student.model.js";
import User from "../../models/user.model.js";

import StudentFee from "../fee/models/fee.model.monthlyFee.js";
import AdditionalFee from "../fee/models/fee.model.additionalFee.js";

import { resolveClassAndSection } from "../academic/academic.service.js";

const getId = (value) => {
  if (!value) return value;

  if (typeof value === "object" && value._id) {
    return value._id;
  }

  return value;
};

const buildStudentPayload = (data, userId = null) => {
  const admissionDate = data.academic?.admissionDate
    ? new Date(data.academic.admissionDate)
    : new Date();

  const payload = {
    registrationNumber: data.registrationNumber,

    personal: {
      firstName: data.personal?.firstName,
      lastName: data.personal?.lastName,
      gender: data.personal?.gender,
      dob: data.personal?.dob,
      bloodGroup: data.personal?.bloodGroup,
      photo: data.personal?.photo
    },

    identification: {
      aadhaarNumber: data.identification?.aadhaarNumber,
      apaarId: data.identification?.apaarId
    },

    contact: {
      email: data.contact?.email,
      phone: data.contact?.phone,
      address: {
        house: data.contact?.address?.house,
        city: data.contact?.address?.city,
        state: data.contact?.address?.state,
        pincode: data.contact?.address?.pincode
      }
    },

    academic: {
      class: getId(data.academic?.class),
      section: getId(data.academic?.section),
      rollNumber: data.academic?.rollNumber,
      admissionDate
    },

    guardian: {
      fatherName: data.guardian?.fatherName,
      motherName: data.guardian?.motherName,
      guardianName: data.guardian?.guardianName,
      relation: data.guardian?.relation,
      phone: data.guardian?.phone,
      email: data.guardian?.email
    },

    status: data.status || "Active"
  };

  if (userId) {
    payload.userId = userId;
  }

  return payload;
};

export const createStudent = async (data, user, session = null) => {
  try {
    if (data.fee?.monthlyFee === undefined) {
      throw new Error("Monthly fee is required");
    }

    const admissionDate = data.academic?.admissionDate
      ? new Date(data.academic.admissionDate)
      : new Date();

    const admissionMonth = admissionDate.getMonth() + 1;
    const admissionYear = admissionDate.getFullYear();

    const lastPaidMonth = admissionMonth - 1;
    const lastPaidYear = admissionYear;

    const academicRefs = await resolveClassAndSection(
      data.academic?.class,
      data.academic?.section,
      session
    );

    const studentPayload = buildStudentPayload(
      {
        ...data,
        academic: {
          ...data.academic,
          class: academicRefs.classId,
          section: academicRefs.sectionId,
          admissionDate
        }
      },
      user._id
    );

    const [student] = await Student.create(
      [studentPayload],
      { session }
    );

    await StudentFee.create(
      [
        {
          student: student._id,
          monthlyFee: data.fee.monthlyFee,
          transportFee: data.fee?.transportFee || 0,
          lastPaidMonth,
          lastPaidYear
        }
      ],
      { session }
    );

    if (data.fee?.additionalFees?.length > 0) {
      await AdditionalFee.insertMany(
        data.fee.additionalFees.map((fee) => ({
          student: student._id,
          feeType: fee.feeType,
          amount: fee.amount,
          dueDate: fee.dueDate,
          remarks: fee.remarks,
          status: "Pending"
        })),
        { session }
      );
    }

    return student;

  } catch (err) {
    throw new Error(err.message);
  }
};

export const getMyProfile = async (userId) => {
  const student = await Student.findOne({ userId })
    .populate("academic.class")
    .populate("academic.section");

  if (!student) {
    throw new Error("Student not found");
  }

  return student;
};

export const updateMyProfile = async (userId, updateData) => {
  const updatePayload = {};

  if (updateData.contact?.email !== undefined) {
    updatePayload["contact.email"] = updateData.contact.email;
  }

  if (updateData.contact?.phone !== undefined) {
    updatePayload["contact.phone"] = updateData.contact.phone;
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new Error("No valid fields provided for update");
  }

  const student = await Student.findOneAndUpdate(
    { userId },
    { $set: updatePayload },
    {
      new: true,
      runValidators: true
    }
  )
    .populate("academic.class")
    .populate("academic.section");

  if (!student) {
    throw new Error("Student not found");
  }

  return student;
};

export const getAllStudents = async (filters = {}) => {
  const { search, grade, status, section } = filters;

  const query = {};

  if (search?.trim()) {
    query.$or = [
      { registrationNumber: { $regex: search, $options: "i" } },
      { "personal.firstName": { $regex: search, $options: "i" } },
      { "personal.lastName": { $regex: search, $options: "i" } }
    ];
  }

  if (grade) {
    query["academic.class"] = grade;
  }

  if (section) {
    query["academic.section"] = section;
  }

  if (status) {
    query.status = status;
  }

  const students = await Student.find(query)
    .sort({ createdAt: -1 })
    .populate("userId", "loginId role")
    .populate("academic.class")
    .populate("academic.section");

  const [total, active, inactive, passed] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: "Active" }),
    Student.countDocuments({ status: "Inactive" }),
    Student.countDocuments({ status: "Passed" })
  ]);

  return {
    count: students.length,
    summary: {
      total,
      active,
      inactive,
      passed
    },
    students
  };
};

export const getStudentById = async (studentId) => {
  const student = await Student.findById(studentId)
    .populate("userId", "loginId role")
    .populate("academic.class")
    .populate("academic.section");

  if (!student) {
    throw new Error("Student not found");
  }

  return student;
};

export const updateStudent = async (studentId, data) => {
  const academicRefs = await resolveClassAndSection(
    data.academic?.class,
    data.academic?.section
  );

  const updatePayload = buildStudentPayload({
    ...data,
    academic: {
      ...data.academic,
      class: academicRefs.classId,
      section: academicRefs.sectionId
    }
  });

  const student = await Student.findByIdAndUpdate(
    studentId,
    updatePayload,
    {
      new: true,
      runValidators: true
    }
  )
    .populate("userId", "loginId role")
    .populate("academic.class")
    .populate("academic.section");

  if (!student) {
    throw new Error("Student not found");
  }

  return student;
};

export const deleteStudent = async (studentId) => {
  const student = await Student.findById(studentId);

  if (!student) {
    throw new Error("Student not found");
  }

  await StudentFee.deleteOne({ student: student._id });
  await AdditionalFee.deleteMany({ student: student._id });

  await User.findByIdAndDelete(student.userId);
  await Student.findByIdAndDelete(student._id);

  return {
    message: "Student and linked user deleted successfully"
  };
};