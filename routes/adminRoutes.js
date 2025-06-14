const router = require('express').Router();
const adminController = require('../controllers/adminController');
const affiliateController = require('../controllers/affiliateController');
const {ensureAdmin} = require('../middleware/auth');

router.get('/success',ensureAdmin, (req,res)=>{
    return res.render('./admin/success') 
})
router.get('/error',ensureAdmin, (req,res)=>{
    return res.render('./admin/error') 
})

router.get('/', ensureAdmin, adminController.adminDashboard);
router.get('/users', ensureAdmin, adminController.getAllUsers);
router.get('/users/:id', ensureAdmin, adminController.findOneUsers);

router.get('/classes', ensureAdmin, adminController.getAllClass);
router.post('/class/', ensureAdmin, adminController.createClass);
router.get('/class/:id', ensureAdmin, adminController.getClassSession);
router.put('/class/:id/edit', ensureAdmin, adminController.updateById);
router.put('/class/:id/:status', ensureAdmin, adminController.toggleClasssVisibility);

router.put('/class/:classId/grant-access/:userId', ensureAdmin, adminController.grantAccess);

router.post('/referral', ensureAdmin, adminController.createReferral);
router.get('/referral', ensureAdmin, adminController.getReferrals);
router.put('/referral/:id', ensureAdmin, adminController.findReferralCode);




router.get('/affiliate/applications',  affiliateController.affiliateApplications); 
router.get('/affiliate/applications/:id',  affiliateController.viewAnApplication); 
router.put('/affiliate/applications/:id/:status',  affiliateController.approveAffiliate); 
router.post('/affiliate/mark-paid/:userId',  affiliateController.markReferredUserAsPaid); 
router.post('/affiliate/mark-paid/:userId',  affiliateController.markReferredUserAsPaid); 


// View settings page
router.get('/setting', ensureAdmin, adminController.Setting);
// Toggle setting
router.put('/setting/toggle/:column',ensureAdmin, adminController.toggleSetting);


// router.get('/attendance', ensureAdmin, adminController.);
router.get('/session/:id/attendance',ensureAdmin, adminController.getAttendanceForSession);


module.exports = router;
