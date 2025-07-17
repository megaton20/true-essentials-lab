const { uploadImage, uploadVideo } = require('./uploadWithCloudinary');
const pool = require('../config/db'); // PostgreSQL connection
const path = require('path');
const { v4: uuidv4 } = require('uuid');



const updateCourseWithVideoPart = async (req, res) => {
  try {
    const videoFile = req.files['video']?.[0];
    const thumbnailFile = req.files['thumbnail']?.[0];
    const { title, part_number, classeId } = req.body;

    if (!videoFile || !thumbnailFile) {
      req.flash('error_msg', 'Select both a video and thumbnail');
      return res.redirect(`/teacher/class/${classeId}`);
    }

    const videoPath = path.resolve(videoFile.path);
    const thumbPath = path.resolve(thumbnailFile.path);

    const videoResult = await uploadVideo(videoPath);
    const thumbResult = await uploadImage(thumbPath);

    // console.log(videoResult);
    

    await pool.query(
      `INSERT INTO class_videos (
        class_id, title, video_url, video_public_id,
        thumbnail_url, thumbnail_public_id, part_number, id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7,$8)`,
      [
        classeId,
        title || `Part ${part_number || 1}`,
        videoResult.secure_url,
        videoResult.public_id,
        thumbResult.secure_url,
        thumbResult.public_id,
        part_number || 1,
        uuidv4()
      ]
    );
    


    req.flash('success_msg', 'Course video uploaded successfully');
      return res.redirect(`/teacher/class/${classeId}`);

    // res.status(201).json({ message: 'Course video uploaded successfully' });

  } catch (err) {
    console.error('Upload failed:', err);
     req.flash('error_msg', 'major error!');
      return res.redirect(`/`);
    // res.status(500).json({ error: 'Upload failed' });
  }
};

module.exports = { updateCourseWithVideoPart };