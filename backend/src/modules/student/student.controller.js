
import Student from "./student.model.js"
import User from "../../models/user.model.js"

const createStudent = async (data, user) => {
  try {
    const student = new Student({
      userId: user._id, //link to User

      registrationNumber: data.registrationNumber,

      personal: {
        firstName: data.personal?.firstName,
        lastName: data.personal?.lastName,
        gender: data.personal?.gender,
        dob: data.personal?.dob,
        bloodGroup: data.personal?.bloodGroup,
        photo: data.personal?.photo,
        APAARid: data.personal?.APAARid
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
        class: data.academic?.class,
        section: data.academic?.section,
        rollNumber: data.academic?.rollNumber,
        admissionDate: data.academic?.admissionDate || new Date()
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
    });

    await student.save();

    return student;

  } catch (err) {
    throw new Error(err.message);
  }
};










// GET /api/students — fetch all with optional search, class, status filters
const getAllStudents = async (req, res) => {
  try {
    const { search, grade, status, section } = req.query;

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
      .populate("userId", "loginId role");

    const [total, active, pending] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: "Active" }),
      Student.countDocuments({ status: "Pending" })
    ]);

    res.json({
      success: true,
      count: students.length,
      summary: { total, active, pending },
      data: students
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// GET /api/students/:id
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("userId", "loginId role");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // optional: clean response shape (recommended)
    const response = {
      id: student._id,
      registrationNumber: student.registrationNumber,

      personal: student.personal,
      identification: student.identification,
      contact: student.contact,
      academic: student.academic,
      guardian: student.guardian,
      status: student.status,

      user: student.userId // populated user
    };

    res.json({
      success: true,
      data: response
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};





// PUT /api/students/:id
const updateStudent = async (req, res) => {
  try {
    const data = req.body;

    const updatePayload = {
      registrationNumber: data.registrationNumber,

      personal: {
        firstName: data.personal?.firstName,
        lastName: data.personal?.lastName,
        gender: data.personal?.gender,
        dob: data.personal?.dob,
        bloodGroup: data.personal?.bloodGroup,
        photo: data.personal?.photo,
        APAARid: data.personal?.APAARid
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
        class: data.academic?.class,
        section: data.academic?.section,
        rollNumber: data.academic?.rollNumber,
        admissionDate: data.academic?.admissionDate
      },

      guardian: {
        fatherName: data.guardian?.fatherName,
        motherName: data.guardian?.motherName,
        guardianName: data.guardian?.guardianName,
        relation: data.guardian?.relation,
        phone: data.guardian?.phone,
        email: data.guardian?.email
      },

      status: data.status
    };

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.json({
      success: true,
      message: "Student updated successfully",
      data: student
    });

  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
     await User.findByIdAndDelete(student.userId);
     await Student.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Student and linked user deleted successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
