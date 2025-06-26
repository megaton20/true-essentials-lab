const router = require('express').Router();
const user = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const {ensureVerifiedEmail} = require('../middleware/auth')




// /dashboard/:userId
router.get('/', ensureVerifiedEmail, user.getDashboard);
router.get('/profile', ensureVerifiedEmail, user.getProfile);
router.post('/profile/update', ensureVerifiedEmail, user.editProfile);
router.get('/course/:id', ensureVerifiedEmail, user.getCourseSchedule); // see class schedules
router.get('/class-history/:id', ensureVerifiedEmail, user.studentClassRecord);



// router.post('/payment', authMiddleware, user.completePayment);

module.exports = router;
