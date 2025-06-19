const router = require('express').Router();
const teachController = require('../controllers/teachController');
const {ensureTeacher} = require('../middleware/auth');





router.get('/success',ensureTeacher, (req,res)=>{
    return res.render('./admin/success') 
})
router.get('/error',ensureTeacher, (req,res)=>{
    return res.render('./admin/error') 
})



router.get('/', ensureTeacher, teachController.getDash);
router.get('/course/class/:id', ensureTeacher, teachController.getCourseSchedule);


router.get('/class/:id', ensureTeacher, teachController.getClassSession);
router.post('/class', ensureTeacher, teachController.createClass);
router.put('/class/:id/edit', ensureTeacher, teachController.updateById);
router.put('/class/:id/:status', ensureTeacher, teachController.toggleClasssVisibility);

router.put('/class/:classId/grant-access/:userId', ensureTeacher, teachController.grantAccess);
router.get('/session/:id/attendance',ensureTeacher, teachController.getAttendanceForSession);


module.exports = router;
