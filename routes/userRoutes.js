const router = require('express').Router();
const user = require('../controllers/userController');
const {ensureVerifiedEmail} = require('../middleware/auth')




// /dashboard/:userId
router.get('/', ensureVerifiedEmail, user.getDashboard);
router.get('/category/:id', ensureVerifiedEmail, user.getCatDetails);
router.get('/profile', ensureVerifiedEmail, user.getProfile);
router.post('/profile/update', ensureVerifiedEmail, user.editProfile);
router.get('/course/:id/:categoryId', ensureVerifiedEmail, user.getCourseSchedule); // see class schedules
router.get('/class/:id', ensureVerifiedEmail, user.getClassDetails); // see class details
router.get('/class-history/:id', ensureVerifiedEmail, user.studentClassRecord);



// router.post('/payment', authMiddleware, user.completePayment);

module.exports = router;
