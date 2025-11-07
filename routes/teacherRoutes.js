const router = require('express').Router();
const teachController = require('../controllers/teachController');
const {ensureTeacher} = require('../middleware/auth');
const { updateCourseWithVideoPart } = require('../utils/uploads');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const pool = require('../config/db');
const cloudinary = require('cloudinary').v2;






router.get('/success',ensureTeacher, (req,res)=>{
    return res.render('./admin/success') 
})
router.get('/error',ensureTeacher, (req,res)=>{
    return res.render('./admin/error') 
})



router.get('/', ensureTeacher, teachController.getDash);
router.post('/courses/create', ensureTeacher, teachController.createCourse);
router.get('/course/details/:id', ensureTeacher, teachController.getOneCourse); // to get the course deatials
router.put('/courses/:id', ensureTeacher, teachController.editCourse);
router.get('/courses', ensureTeacher, teachController.getAllCourse);
router.get('/course/class/:id', ensureTeacher, teachController.getCourseSchedule);  // to get the class schedule

router.post('/class', ensureTeacher, teachController.createClass);
router.delete('/class/:id', ensureTeacher, teachController.deleteClass);
router.delete('/course/:id', ensureTeacher, teachController.deleteCourse);

router.get('/class/:id/:course', ensureTeacher, teachController.getClassSession);
router.put('/class/:id/edit', ensureTeacher, teachController.updateById);
router.put('/class/:id/:status', ensureTeacher, teachController.toggleClasssVisibility);

router.put('/class/:classId/grant-access/:userId', ensureTeacher, teachController.grantAccess);
router.get('/session/:id/attendance',ensureTeacher, teachController.getAttendanceForSession);


router.post('/class/video-part',
    upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]),
    updateCourseWithVideoPart
);

router.delete('/class/video/delete',async (req, res)=>{

    const {classVideoId, video_public_id, thumbnail_public_id, class_id } = req.body
    
    
  try {

        const { rows } = await pool.query(
      'SELECT video_public_id, thumbnail_public_id FROM class_videos WHERE id = $1',
      [classVideoId]
    );

    if (rows.length === 0) {
      req.flash('error_msg', 'Video not found');
      return res.redirect(`/teacher/class/${class_id}`);
    }

        // Delete both from Cloudinary
    if (video_public_id) {
      await cloudinary.uploader.destroy(video_public_id, { resource_type: 'video' });
    }

    if (thumbnail_public_id) {
      await cloudinary.uploader.destroy(thumbnail_public_id, { resource_type: 'image' });
    }

    await pool.query('DELETE FROM class_videos WHERE id = $1', [classVideoId]);

    req.flash('success_msg', 'Video deleted');
    res.redirect(`/teacher/class/${class_id}`);
  } catch (err) {
    console.error('Error deleting video:', err);
    req.flash('error_msg', 'Failed to delete video');
      return res.redirect(`/teacher/class/${class_id}`);
  }


})
module.exports = router;
