const ReferralCode = require('../models/ReferralCode');
const Setting = require('../models/Settings');
const Admin = require('../models/Admin');
const ClassSession = require('../models/ClassSession');
const { v4: uuidv4 } = require('uuid');
const Attendance = require('../models/Attendance');
const pool = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');
const Category = require('../models/Category');
const Teacher = require('../models/Teacher');


exports.adminDashboard = async (req, res) => {
  const userId = req.user.id
  try {
    const stats = await Admin.getDashboardStats(); 

    let course = await Course.listAll();
    let myCourse = await Course.listAllByCreator(userId)
    let currentUser = await User.lisAll();

    const classStatus = await Admin.getClassStatus();
    const teachers = await User.findTeacher();
    const categories = await Category.all()


    res.render('./admin/dashboard', {
      stats,
      course,
      myCourse,
      classStatus: classStatus || [],
      teachers: teachers || [],
      currentUser: currentUser || [],
      categories: categories || [] 
    });
  } catch (err) {
    console.error("Error loading admin dashboard:", err);
    res.status(500).send("Error loading admin dashboard.");
  }
};


exports.getAllUsers = async (req, res) => {

    try {
    const users = await Admin.allUsers(); 

    res.render('./admin/users',
       { 
        users
       });
  } catch (err) {
    res.status(500).send("Error loading admin dashboard.");
  }
    //  res.render('./admin/dashboard')
};

exports.createCategories = async (req, res) => {
  const {name,details, icon} = req.body

    try {
    
     const isCreated =  await Category.create(name, uuidv4(), details,icon);

     if (isCreated) {
       req.flash('success_msg', 'categories added')
      }else{
       req.flash('error_msg', 'categories not added')

     }

    res.redirect('/admin/categories')
  } catch (err) {
    req.flash('error_msg', 'error loading categories')
    console.log(err);
    
    return res.redirect('/admin')
  }
};


exports.editCategories = async (req, res) => {

    const {name, icon, details} = req.body

  
    try {
    
     const isCreated =  await Category.update(req.params.id,name,details,icon  );

     if (isCreated) {
       req.flash('success_msg', 'categories updated')
      }else{
       req.flash('error_msg', 'categories not updated')

     }

    res.redirect('/admin/categories')
  } catch (err) {
    req.flash('error_msg', 'error loading categories')
    console.log(err);
    
    return res.redirect('/admin')
  }
};

exports.deleteCategories = async (req, res) => {

    try {
    
     const isDeleted =  await Category.delete(req.params.id);

     if (isDeleted) {
       req.flash('success_msg', 'categories deleted')
      }else{
       req.flash('error_msg', 'categories not deleted')

     }

    res.redirect('/admin/categories')
  } catch (err) {
    req.flash('error_msg', 'error loading categories')
    console.log(err);
    
    return res.redirect('/admin')
  }
};


exports.getAllCategories = async (req, res) => {

    try {
    const categories = await Category.allWithCourses(); 

    res.render('./admin/categories',
       { 
        categories:categories|| []
       });
  } catch (err) {
    req.flash('error_msg', 'error loading categories')
    return res.redirect('/admin')
  }
};


exports.findOneUsers = async (req, res) => {

 const userId =  req.params.id
    try {
    const user = await Admin.getById(userId);
    res.render('./admin/user',
       { 
        user
       });
  } catch (err) {
    res.status(500).send("Error loading user info.");
  }
    //  res.render('./admin/dashboard')
};
exports.deleteUser = async (req, res) => {
  const userID = req.params.id

  
  try {
    const user = await User.getById(userID)
    if (!user) {
       req.flash("error_msg", "user not found... delete failed!")  
      return res.redirect(`/admin/users`)
    }

       if (user.role == "admin") {
       req.flash("error_msg", "user cannot be deleted!")  
      return res.redirect(`/admin/users`)
    }


    const isDelete = await User.deleteUser(userID);    
    if (isDelete) {
     req.flash("success_msg", "user deleted!")  
    }else{
      req.flash("error_msg", "user delete failed!")  

    }
    return res.redirect(`/admin/users`)
  } catch (error) {
    console.log(`error deleting user: ${error}`);
    res.redirect('/')
  }
};

// courses

exports.createClass = async (req, res) => {
  const {title, description, scheduled_at, meet_link, courseId} = req.body
  const createdBy = req.user.id
  try {
    const stats = await ClassSession.create({title, description, scheduledAt: scheduled_at,meetLink: meet_link,id:uuidv4(), courseId, createdBy});
    
      req.flash(stats ? 'success_msg': "error_msg", stats?  "class added!" : "class not added" )
    
    res.redirect(`/admin/course/class/${courseId}`) 
  } catch (error) {
    res.redirect('/admin/error') 
    console.log("error on create class: "+ error);
    
    
  }
};


exports.getAllCourse = async (req, res) => {
  try {

 

    // All courses (for both current and past)
    const allCourses = await Course.listAll();
    const categories = await Category.all()
    
    res.render('./admin/courses', {
      allCourses,
      categories: categories || []
    });

  } catch (error) {
    console.error("Error in loading courses:", error);
    res.redirect('/admin/error');
  }
};

exports.getOneCourse = async (req, res) => {

  try {
      const course = await Course.findById(req.params.id);
      
      const allTeachers  = await Teacher.findAll()
      

      // 1. Attach related teachers directly to `course`
      const teachersQuery = `
        SELECT t.*, u.full_name, u.email
        FROM teacher_courses tc
        JOIN teachers t ON t.id = tc.teacher_id
        JOIN users u ON u.id = t.user_id
        WHERE tc.course_id = $1
      `;
      const { rows: teachers } = await pool.query(teachersQuery, [course.id]);
      course.teachers = teachers; // attach to course object

      // 2. Attach total class session count
      const classCountQuery = `SELECT COUNT(*) FROM class_sessions WHERE course_id = $1`;
      const { rows: classResult } = await pool.query(classCountQuery, [course.id]);
      course.totalClasses = parseInt(classResult[0].count); // attach as well
    const categories = await Category.all()

      
      res.render('./admin/course', {user:req.user, course, allTeachers, categories: categories || [] });

  } catch (error) {
    res.redirect('/admin/error') 
    console.log("error on create class: "+ error);
    
    
  }
};


exports.createCourse = async (req, res) => {
  const {title, description, category_id, takeaways, price, level} = req.body
  const teacherId = req.user.id
const takeawaysJson = JSON.stringify(takeaways);
  
 
  
  try {
    const result = await Course.create({id:uuidv4(), title,description, teacherId, category_id,price,level, takeawaysJson });

    if (result.success) {
      req.flash('success', result.message);
    } else {
      req.flash('error', result.message);
    }
    res.redirect('/admin/courses');

  } catch (error) {
    res.redirect('/admin/error') 
    console.log("error on create course: "+ error);
    
    
  }
};

exports.createCourseVideo = async (req, res) => {

  const teacherId = req.user.id
  const courseId = req.params.id
  const thumbnailPath = req.files['thumbnail'][0].path;  
  const videoFiles = req.files['videos'];
  
  try {

        // Upload thumbnail to Cloudinary
        const thumbResult = await uploadImage(thumbnailPath);
                // Insert course into DB
        const courseResult = await pool.query(
            `UPDATE SET ? courses (image_url) WHERE id = $2
             VALUES ($1) RETURNING id`,
            [title, description, thumbResult.secure_url]
        );

                // Upload each video
        for (let i = 0; i < videoFiles.length; i++) {
            const file = videoFiles[i];
            const videoResult = await uploadVideo(file.path);
            await pool.query(
                `INSERT INTO course_videos (course_id, title, video_url, video_public_id, part_number)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    courseId,
                    `Part ${i + 1}`,
                    videoResult.secure_url,
                    videoResult.public_id,
                    i + 1
                ]
            );
        }
        
        return  console.log("i got here");
        
    const result = await Course.create({id:uuidv4(), title,description, teacherId, category_id,price,level, takeawaysJson });

    if (result.success) {
      req.flash('success', result.message);
    } else {
      req.flash('error', result.message);
    }
    res.redirect('/admin/courses');

  } catch (error) {
    res.redirect('/admin/error') 
    console.log("error on create course: "+ error);
    
    
  }
};


exports.editCourse = async (req, res) => {
  const {title, description, category_id, takeaways, price, level} = req.body
  const teacherId = req.user.id
  const takeawaysJson = JSON.stringify(takeaways);
  
  
  try {
    const stats = await Course.update(req.params.id, {title,description, teacherId, category_id,price,level, takeawaysJson});
    res.redirect(`/admin/courses/details/${req.params.id}`) 
  } catch (error) {
    res.redirect('/admin/error') 
    console.log("error on update course: "+ error);
    
    
  }
};

exports.getCourseSchedule = async (req, res) => {

  const sessions = await ClassSession.listByCourse(req.params.id)
  res.render('./admin/classes', {
    sessions,
    user: req.user,
    courseId:req.params.id
  });
};

exports.deleteCourse = async (req, res) => {
  const courseID = req.params.id

  
  try {
    const isDelete = await Course.deleteCourse(courseID);    
    if (isDelete) {
     req.flash("success_msg", "course deleted!")  
    }else{
      req.flash("error_msg", "course delete failed!")  

    }
    return res.redirect(`/admin/courses`)
  } catch (error) {
    console.log(`error deleting class: ${error}`);
    res.redirect('/')
  }
};

exports.getClassSession = async (req, res) => {
  const id = req.params.id
  const backUrl = `admin/course/class/${req.params.course}`
  
    // Fetch videos for this course
    const { rows: courseVideos } = await pool.query(
      `SELECT *
      FROM class_videos
      WHERE class_id = $1
      ORDER BY part_number ASC`,
      [id]
    );

    const attendance = await Attendance.getAttendanceForSession(id)

    const singleClass = await ClassSession.findById(id); 
        res.render('./admin/class', {
      singleClass,
      attendance,
      backUrl,
      courseId: req.params.course,
      courseVideos: courseVideos || [],
    cloudinaryConfig: {
      cloudName: process.env.CLOUD_NAME,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'teacher-videos' // Fallback
    }
    })
};

exports.grantAccess = async (req, res) => {
  
  try {
    const { classId, userId } = req.params;
    const granted = req.body.granted 
    let grant 
    if (granted == "on") {
      grant = true
    }else{
      grant = false
    }
    
   const stats =  await Attendance.approveAttendance(classId, userId, grant);

   
    if (stats === 1 || stats === true) {
      req.flash("success_msg", "Access status updated.");
    } else {
      req.flash("error_msg", "Check failed");
    }
    
   return res.redirect(`/admin/class/${classId}`);


  } catch (err) {
    console.error(`error in grant access controller: ${err}`);
  }
}

exports.updateClassSessionById = async (req, res) => {
  const {title, description, scheduled_at, meet_link, courseId}= req.body
  const id = req.params.id

  
  try {
 
    const singleClass = await ClassSession.update(title, description, scheduled_at, meet_link, id); 
    req.flash(`${singleClass ? "error_msg" : "success_msg"}`, singleClass ? 'was not updated' : 'updated completed')
    res.redirect(`/admin/class/${id}/${courseId}`) 
  } catch (error) {
    console.log(`error updating class: ${error}`);
    
  }
};

exports.findByJoinCode = async (req, res) => {
  const code = req.params.code
    const getClass = await ClassSession.findByJoinCode(code); 
        res.render('./admin/classes', {
      getClass
    })
};

exports.toggleClasssVisibility = async (req, res) => {  
  const classId = req.params.classId
  const visible = req.params.status
  const {courseId} = req.body
try {
  const stats = await ClassSession.toggleLinkVisibility(classId, visible); 

  if (stats === 1 || stats === true) {
    req.flash("success_msg", "Class status was updated successfully");
  } else {
    req.flash("error_msg", "Class status update failed");
  }

  return res.redirect(`/admin/class/${classId}/${courseId}`);

} catch (error) {
  console.error(`Error updating class status: ${error}`);
  req.flash("error_msg", "Something went wrong while updating status.");
  return res.redirect(`/admin/class/${classId}`);
}

};

exports.getVisibleLink = async (req, res) => {
  try {
    const stats = await ClassSession.getVisibleLink(joinCode); 
  } catch (error) {
    
  }
};





exports.completeClass = async (req, res) => {
  const classID = req.params.classId
  const {courseId} = req.body
  const status = true
  
  
  try {
    const isDelete = await ClassSession.completeClass(classID, status);
    
    if (isDelete) {
     req.flash("success_msg", "class marked as completed")  
    }else{
      req.flash("error_msg", "class completion failed")  

    }
      
    return res.redirect(`/admin/class/${classID}/${courseId}`);
  } catch (error) {
    console.log(`error updating class: ${error}`);
    res.redirect('/')
  }
};

exports.openCourseAction = async (req, res) => {
  const courseId = req.params.courseId
  const {currentStatus} = req.body
  
  let newState = false
  if (currentStatus == "on") {
    newState = true
  }
  
  
  try {
    const isToggle = await Course.toggleCourseOpen(courseId, newState);
    
    if (isToggle) {
     req.flash("success_msg", "Course is open")  
    }else{
      req.flash("error_msg", "toggle failed")  

    }
      
    return res.redirect(`/admin/courses`);
  } catch (error) {
    console.log(`error toggle course: ${error}`);
    res.redirect('/')
  }
};



exports.deleteClass = async (req, res) => {
  const classID = req.params.id
  const courseId = req.body.courseId
  
  try {
    const isDelete = await ClassSession.deleteClass(classID);
    
    if (isDelete) {
     req.flash("success_msg", "class schedule deleted!")  
    }else{
      req.flash("error_msg", "class schedule delete failed!")  

    }
    return res.redirect(`/admin/course/class/${courseId}`)
  } catch (error) {
    console.log(`error deleting class: ${error}`);
    res.redirect('/')
  }
};

// referral codes section
exports.getReferrals = async (req, res) => {
  const referralCodes = await ReferralCode.lisAll();
  
  return res.render('./admin/codes', {
    referralCodes
  })
};
exports.findReferralCode = async (req, res) => {
  const  code = req.params.code
  const newCode = await ReferralCode.findByCode( code);
  res.json(newCode);
};
exports.createReferral = async (req, res) => {

  const { code, location, discount, maxUses, expires } = req.body;

  // chcek if code alrady exist
  // check if location is already set

  const newCode = await ReferralCode.create({ code, location, discount, maxUses, expires, id: uuidv4() });
  res.json(newCode);
};

exports.updateReferral = async (req, res) => {
  const { code, locationName, discountPercentage, maxUses, expiresAt } = req.body;
  const newCode = await ReferralCode.update({ code, locationName, discountPercentage, maxUses, expiresAt });
  res.json(newCode);
};


// settings section
exports.Setting = async (req, res) => {
  
  const settings = await Setting.getAll()
  // const {rows:settings} = await pool.query('SELECT * FROM settings');
  res.render('./admin/settings', { settings:settings[0] });

};

exports.toggleSetting = async (req, res) => {
  const { column } = req.params;

  try {
    const message = await Setting.toggleColumn(column);
    req.flash('success_msg', message);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', err.message || 'Failed to update setting.');
  }

  res.redirect('/admin/setting');
};

// attendance section
exports.getAttendanceForSession =  async (req, res) => {
    const attendance = await Attendance.getAttendanceForSession(req.params.id); 
  console.log(attendance);
  
}







