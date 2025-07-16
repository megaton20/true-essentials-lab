const router = require('express').Router();
const user = require('../controllers/userController');
const {ensureVerifiedEmail, ensureEnrolled} = require('../middleware/auth')
const axios = require('axios');
const Enrollment = require('../models/Enrollment');
const { v4: uuidv4 } = require('uuid');





// /dashboard/:userId
router.get('/', ensureVerifiedEmail, user.getDashboard);
router.get('/category/:id', ensureVerifiedEmail, user.getCategoryCourses);
router.get('/profile', ensureVerifiedEmail, user.getProfile);
router.get('/my-courses', ensureVerifiedEmail, user.getCourses);
router.post('/profile/update', ensureVerifiedEmail, user.editProfile);
router.get('/course/:id/details', ensureVerifiedEmail, user.getCourseDetails); // see class schedules
router.get('/course/:id/:categoryId', ensureVerifiedEmail,ensureEnrolled, user.getCourseSchedule); // see class schedules
router.get('/class/:id/course/:courseId/category/:categoryId', ensureVerifiedEmail,ensureEnrolled, user.getClassDetails); // see class details
router.get('/class-history/:id', ensureVerifiedEmail,ensureEnrolled, user.studentClassRecord);
router.get('/course/free', ensureVerifiedEmail, user.getFreeCourses);


// Enroll in course (handles both free and paid)
router.post('/course/:id/enroll', ensureVerifiedEmail, user.enrollInCourse);

router.get('/course/verify', ensureVerifiedEmail, async (req, res) => {
  const reference = req.query.reference;

  
  if (!reference) {
    req.flash('error_msg', 'No reference provided');
    return res.redirect('/user');
  }

  try {
    // Verify transaction with Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    if (response.data.status && response.data.data.status === 'success') {

        const metadata = response.data.data.metadata;
        
        
        await Enrollment.enroll({ id: uuidv4(), user_id:metadata.userId, course_id: metadata.courseId, paid: true, payment_id: null});

      req.flash('success', 'Enrolled successfully in the course!');
      return res.redirect('/user/my-courses');


      return res.redirect('/user');


    } else {
      // Handle failed verification
      console.log('Payment verification failed:', response.data.data);
      req.flash('error_msg', 'Payment unsuccessful');
      return res.redirect('/user');
    }
  } catch (error) {

    console.log(`error on payment verification: ${error}`);

  }
});

// router.post('/payment', authMiddleware, user.completePayment);

module.exports = router;
