const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');





// Load Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
});

// Upload an image
const uploadImage = async (filePath, publicId = null) => {
  const options = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    resource_type: 'image',
  };
  if (publicId) options.public_id = publicId;

  try {
    const result = await cloudinary.uploader.upload(filePath, options);
        
    fs.unlink(filePath, (err) => {
      if (err) console.error('Could not delete temp thumbnail file:', err);
    });
    return result;
  } catch (err) {
    console.error('Image upload failed:', err);
    throw err;
  }
};

// Upload a video
const uploadVideo = async (filePath, publicId = null) => {
  const options = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    resource_type: 'video',
  };
  if (publicId) options.public_id = publicId;

  try {
    const result = await cloudinary.uploader.upload(filePath, options);

    // After successful upload to Cloudinary:
    fs.unlink(filePath, (err) => {
      if (err) console.error('Could not delete temp video file:', err);
    });

    return result;
  } catch (err) {
    console.error('Video upload failed:', err);
    throw err;
  }
};

module.exports = {
  uploadImage,
  uploadVideo,
};
