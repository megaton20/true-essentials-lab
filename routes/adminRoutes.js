const router = require('express').Router();
const adminController = require('../controllers/adminController');
const affiliateController = require('../controllers/affiliateController');
const {ensureAdmin} = require('../middleware/auth');
const TeacherController = require('../controllers/TeacherController');
const pool = require('../config/db');



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
router.put('/class/:classId/:status', ensureAdmin, adminController.toggleClasssVisibility);
router.delete('/class/:id', ensureAdmin, adminController.deleteClass);
router.post('/class/complete/:classId', ensureAdmin, adminController.completeClass);

router.put('/class/:classId/grant-access/:userId', ensureAdmin, adminController.grantAccess);

router.post('/referral', ensureAdmin, adminController.createReferral);
router.get('/referral', ensureAdmin, adminController.getReferrals);
router.put('/referral/:id', ensureAdmin, adminController.findReferralCode);


router.get('/courses', ensureAdmin, adminController.getAllCourse);
router.get('/courses/details/:id', ensureAdmin, adminController.getOneCourse); // to get the course deatials
router.post('/courses/create', ensureAdmin, adminController.createCourse);
// router.post('/courses/video', ensureAdmin, adminController.createCourseVideo);

// router.post('/courses/video', ensureAdmin, adminController.createCourseVideo);

router.post('/class/video-part-save', ensureAdmin, async (req, res) => {
  try {
    const { title, part_number, classeId, videoUrl, thumbnailUrl, videoPublicId, thumbnailPublicId } = req.body;
    
    // Validate required fields
    if (!classeId || !part_number || !videoUrl || !thumbnailUrl) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Verify class exists
    const classCheck = await pool.query(
      'SELECT id, title FROM class_sessions WHERE id = $1',
      [classeId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check for duplicate part number
    const existingPart = await pool.query(
      'SELECT id FROM class_videos WHERE class_id = $1 AND part_number = $2',
      [classeId, part_number]
    );

    if (existingPart.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Part ${part_number} already exists for this class`
      });
    }

    // Insert into database
    const videoId = uuidv4();
    const videoTitle = title || `Part ${part_number}`;

    await pool.query(
      `INSERT INTO class_videos (
        id, class_id, title, video_url, video_public_id,
        thumbnail_url, thumbnail_public_id, part_number, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        videoId,
        classeId,
        videoTitle,
        videoUrl,
        videoPublicId,
        thumbnailUrl,
        thumbnailPublicId,
        part_number
      ]
    );

    return res.json({
      success: true,
      message: 'Video uploaded successfully',
      videoId: videoId
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save video information'
    });
  }
});

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



router.post('/teacher/assign', ensureAdmin, TeacherController.assign);
router.get('/teacher', TeacherController.index);
router.post('/teacher', TeacherController.store);
router.put('/teacher/:id', TeacherController.update);
router.delete('/teacher/:id/delete', TeacherController.destroy);



router.get('/categories', ensureAdmin, adminController.getAllCategories);
router.post('/categories', ensureAdmin, adminController.createCategories);
router.put('/categories/:id', ensureAdmin, adminController.editCategories);
router.delete('/categories/:id', ensureAdmin, adminController.deleteCategories);


module.exports = router;
