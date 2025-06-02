const router = require('express').Router();
const admin = require('../controllers/adminController');
const adminMiddleware = require('../middleware/admin');
const Attendance = require('../models/Attendance');

router.get('/', adminMiddleware, admin.adminDashboard);
router.get('/users', adminMiddleware, admin.getAllUsers);
router.get('/users/:id', adminMiddleware, admin.getAllUsers);
router.get('/attendance', adminMiddleware, admin.getAttendanceForSession);

router.get('/class', adminMiddleware, admin.getAllClass);
// router.get('/class/:id', adminMiddleware, admin.createReferral);
// router.put('/class/:id', adminMiddleware, admin.createReferral);


router.get('/referral', adminMiddleware, admin.getReferrals);
router.post('/referral', adminMiddleware, admin.createReferral);
router.put('/referral/:id', adminMiddleware, admin.findReferralCode);



router.post('/setting', adminMiddleware, admin.toggleSetting);

router.get('/session/:id/attendance',adminMiddleware, admin.getAttendanceForSession);


module.exports = router;
