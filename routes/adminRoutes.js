const router = require('express').Router();
const adminController = require('../controllers/adminController');
const affiliateController = require('../controllers/affiliateController');
const {ensureAdmin} = require('../middleware/auth');
// const teacherController = require('../controllers/teacherController');
const pool = require('../config/db');
const cloudinary = require('cloudinary').v2;

router.use(ensureAdmin)


router.get('/',  adminController.adminDashboard);
router.get('/users',  adminController.getAllUsers);
router.get('/users/:id',  adminController.findOneUsers);
router.delete('/users/delete/:id',  adminController.deleteUser);


router.get('/categories',  adminController.getAllCategories);
router.post('/categories',  adminController.createCategories);
router.put('/categories/:id',  adminController.editCategories);
router.delete('/categories/:id',  adminController.deleteCategories);


router.post('/class',  adminController.createClass);
router.get('/class/:id/:course',  adminController.getClassSession);
router.put('/class/:id/edit',  adminController.updateClassSessionById);
router.put('/class/:classId/:status',  adminController.toggleClasssVisibility);
router.delete('/class/:id',  adminController.deleteClass);
router.post('/class/complete/:classId',  adminController.completeClass);
router.put('/class/:classId/grant-access/:userId',  adminController.grantAccess);


// router.post('/courses/video',  adminController.createCourseVideo);

router.post('/class/video-part-save',  async (req, res) => {
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

  const {classVideoId, video_public_id, thumbnail_public_id, class_id, backUrl } = req.body
    
    
  try {

        const { rows } = await pool.query(
      'SELECT video_public_id, thumbnail_public_id FROM class_videos WHERE id = $1',
      [classVideoId]
    );
    
    if (rows.length === 0) {
      req.flash('error_msg', 'Video not found');
      return res.redirect(`/${backUrl}`);
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
    res.redirect(`/${backUrl}`);
  } catch (err) {
    console.error('Error deleting video:', err);
    req.flash('error_msg', 'Failed to delete video');
    return res.redirect(`/${backUrl}`);
  }

  
})


router.get('/courses',  adminController.getAllProgram);
router.get('/courses/details/:id',  adminController.getOneProgram); // to get the course deatials
router.post('/courses/create',  adminController.createProgram);
router.put('/courses/:id',  adminController.editProgram);
router.get('/course/class/:id',  adminController.getProgramSchedule);  // to get the class schedule
router.delete('/course/:id',  adminController.deleteProgram);
router.put('/course/:courseId',  adminController.openProgramAction); // todo




router.get('/affiliate/applications',  affiliateController.affiliateApplications); 
router.get('/affiliate/applications/:id',  affiliateController.viewAnApplication); 
router.put('/affiliate/applications/:id/:status',  affiliateController.approveAffiliate); 
router.post('/affiliate/mark-paid/:userId',  affiliateController.markReferredUserAsPaid); 
router.post('/affiliate/mark-paid/:userId',  affiliateController.markReferredUserAsPaid); 


// router.get('/attendance',  adminController.);
router.get('/session/:id/attendance', adminController.getAttendanceForSession);



// router.post('/teacher/assign',  teacherController.assign);
// router.delete('/teacher/:id/delete', teacherController.destroy);




module.exports = router;
