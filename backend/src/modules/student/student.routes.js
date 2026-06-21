const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');

// GET    /api/students          — list all (supports ?search=&grade=&status=)
// POST   /api/students          — create new student
// GET    /api/students/:id      — get one student
// PUT    /api/students/:id      — update student
// DELETE /api/students/:id      — delete student

router.route('/').get(getAllStudents).post(createStudent);
router.route('/:id').get(getStudentById).put(updateStudent).delete(deleteStudent);

module.exports = router;
