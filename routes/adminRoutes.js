const router = require('express').Router();
const adminController = require('../controllers/adminController');
const affiliateController = require('../controllers/affiliateController');
const {ensureAdmin} = require('../middleware/auth');
const TeacherController = require('../controllers/TeacherController');

router.get('/success',ensureAdmin, (req,res)=>{
    return res.render('./admin/success') 
})
router.get('/error',ensureAdmin, (req,res)=>{
    return res.render('./admin/error') 
})

router.get('/', ensureAdmin, adminController.adminDashboard);
router.get('/users', ensureAdmin, adminController.getAllUsers);
router.get('/users/:id', ensureAdmin, adminController.findOneUsers);
router.delete('/users/delete/:id', ensureAdmin, adminController.deleteUser);

router.post('/class', ensureAdmin, adminController.createClass);
router.get('/class/:id/:course', ensureAdmin, adminController.getClassSession);
router.put('/class/:id/edit', ensureAdmin, adminController.updateById);
router.put('/class/:id/:status', ensureAdmin, adminController.toggleClasssVisibility);
router.delete('/class/:id', ensureAdmin, adminController.deleteClass);

router.put('/class/:classId/grant-access/:userId', ensureAdmin, adminController.grantAccess);

router.post('/referral', ensureAdmin, adminController.createReferral);
router.get('/referral', ensureAdmin, adminController.getReferrals);
router.put('/referral/:id', ensureAdmin, adminController.findReferralCode);


router.get('/courses', ensureAdmin, adminController.getAllCourse);
router.get('/courses/details/:id', ensureAdmin, adminController.getOneCourse); // to get the course deatials
router.post('/courses/create', ensureAdmin, adminController.createCourse);
router.put('/courses/:id', ensureAdmin, adminController.editCourse);
router.get('/course/class/:id', ensureAdmin, adminController.getCourseSchedule);  // to get the class schedule
router.delete('/course/:id', ensureAdmin, adminController.deleteCourse);



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



router.get('/seasons', ensureAdmin, adminController.seasonsManager);
router.get('/seasons/:id', ensureAdmin, adminController.getOneSeason);
router.post('/seasons/edit', ensureAdmin, adminController.editSeason);
router.post('/seasons', ensureAdmin, adminController.createSeason);
router.get('/seasons/:season_id/users', ensureAdmin, adminController.getUsersBySeason);
router.delete('/seasons/:id', ensureAdmin, adminController.deleteSeason);



router.post('/teacher/assign', ensureAdmin, TeacherController.assign);
router.get('/teacher', TeacherController.index);
router.post('/teacher', TeacherController.store);
router.put('/teacher/:id', TeacherController.update);
router.delete('/teacher/:id/delete', TeacherController.destroy);


module.exports = router;
