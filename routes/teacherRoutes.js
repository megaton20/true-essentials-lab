const router = require('express').Router();
const teachController = require('../controllers/teachController');
const {ensureTeacher} = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
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


// Route to save video info after Cloudinary upload
router.post('/class/video-part-save', ensureTeacher, async (req, res) => {
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
module.exports = router;
