const router = require('express').Router();
const user = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const {ensureVerifiedEmail} = require('../middleware/auth')




// /dashboard/:userId
router.get('/', ensureVerifiedEmail, user.getDashboard);
router.get('/course/:id', ensureVerifiedEmail, user.getCourseSchedule);
router.get('/class-history/:id', ensureVerifiedEmail, user.studentClassRecord);



// router.post('/payment', authMiddleware, user.completePayment);

module.exports = router;
