import { createStudent } from "../student/student.service.js"
// import { createTeacher } from "../teacher/teacher.service.js"

export const roleFactory = async (role, data, user, session) => {
  if (role === "student") {
    return await createStudent(data, user, session);
  }

  throw new Error("Invalid role");
};
