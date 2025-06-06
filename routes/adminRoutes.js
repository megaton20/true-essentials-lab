const router = require('express').Router();
const admin = require('../controllers/adminController');
const {ensureAdmin} = require('../middleware/auth');

router.get('/success',ensureAdmin, (req,res)=>{
    return res.render('./admin/success') 
})
router.get('/error',ensureAdmin, (req,res)=>{
    return res.render('./admin/error') 
})

router.get('/', ensureAdmin, admin.adminDashboard);
router.get('/users', ensureAdmin, admin.getAllUsers);
router.get('/users/:id', ensureAdmin, admin.findOneUsers);

router.get('/classes', ensureAdmin, admin.getAllClass);
router.post('/class/', ensureAdmin, admin.createClass);
router.get('/class/:id', ensureAdmin, admin.findById);
// router.put('/class/:id', ensureAdmin, admin.createReferral);


router.post('/referral', ensureAdmin, admin.createReferral);
router.get('/referral', ensureAdmin, admin.getReferrals);
router.put('/referral/:id', ensureAdmin, admin.findReferralCode);



router.post('/setting', ensureAdmin, admin.toggleSetting);

// router.get('/attendance', ensureAdmin, admin.);
router.get('/session/:id/attendance',ensureAdmin, admin.getAttendanceForSession);


module.exports = router;
