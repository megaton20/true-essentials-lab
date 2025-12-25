const router = require('express').Router();
const userController = require('../controllers/userController');
const  {ensureEnrolled} = require('../middleware/auth')
const axios = require('axios');
const Enrollment = require('../models/Enrollment');
const { v4: uuidv4 } = require('uuid');



// /dashboard/:userId
router.get('/', userController.getDashboard);
router.get('/category/:id', userController.getCategoryCourses);
router.get('/profile', userController.getProfile);
router.get('/my-courses', userController.getCourses);
router.post('/profile/update', userController.editProfile);
router.get('/course/:id/details', userController.getCourseDetails);
router.get('/course/:id/:categoryId',ensureEnrolled, userController.getCourseSchedule); // see class schedules
router.get('/class/:id/course/:courseId/category/:categoryId', userController.getClassDetails); // see class details
router.get('/class-history/:id',ensureEnrolled, userController.studentClassRecord);
router.get('/course/free', userController.getFreeCourses);


// Enroll in course (handles both free and paid)
router.post('/course/:id/enroll', userController.enrollInCourse);
router.get('/course/verify',  userController.courseVerify);

// router.post('/payment', authMiddleware, userController.completePayment);

module.exports = router;
