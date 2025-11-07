const ClassSession = require('../models/ClassSession');
const { v4: uuidv4 } = require('uuid');
const Attendance = require('../models/Attendance');
const pool = require('../config/db');
const Course = require('../models/Course');
const Category = require('../models/Category');
const Teacher = require('../models/Teacher');




exports.getDash = async (req, res) => {
  try {
    const userId = req.user.id;

            const categories = await Category.all()

    const teacherQuery = `SELECT id FROM teachers WHERE user_id = $1`;
    const { rows: teacherRowsId } = await pool.query(teacherQuery, [userId]);

    if (teacherRowsId.length === 0) {
      req.flash('error', 'You are not registered as a teacher.');
      return res.redirect('/handler');
    }

    
    const course = await Course.listAllByCreator(userId)

    const assignedCourse = await Teacher.getAssignedCourses(teacherRowsId[0].id)

    res.render('./teacher/dashboard', {
      courses: course || [],
      assignedCourse: assignedCourse || [],
      user: req.user,
      categories:categories || []
    });

  } catch (error) {
    console.error("Error fetching teacher dashboard:", error);
    res.redirect('/teacher/error');
  }
};

exports.getAllCourse = async (req, res) => {
  const userId = req.user.id
  try {

    // All courses (for both current and past)
    const allCourses = await Course.listAllByCreator(userId);
        const categories = await Category.all()
    
    res.render('./teacher/courses', {
      courses: allCourses,
      user:req.user,
      categories: categories || []
    });

  } catch (error) {
    console.error("Error in loading courses:", error);
    res.redirect('/admin/error');
  }
};

exports.createCourse = async (req, res) => {
  const {title, description, category_id,price,level, takeaways} = req.body
  const teacherId = req.user.id
const takeawaysJson = JSON.stringify(takeaways);
  
 
  try {
    const result = await Course.create({id:uuidv4(), title,description, teacherId, category_id,price,level, takeawaysJson });

    if (result.success) {
      req.flash('success', result.message);
    } else {
      req.flash('error', result.message);
    }
    res.redirect('/teacher/courses');

  } catch (error) {
    res.redirect('/admin/error') 
    console.log("error on create course: "+ error);
    
    
  }
};

exports.getOneCourse = async (req, res) => {

  const courseId = req.params.id
  try {
      const course = await Course.findById(courseId);

      // 2. Attach total class session count
      const classCountQuery = `SELECT COUNT(*) FROM class_sessions WHERE course_id = $1`;
      const { rows: classResult } = await pool.query(classCountQuery, [course.id]);
      course.totalClasses = parseInt(classResult[0].count); // attach as well
    const categories = await Category.all()
    
      res.render('./teacher/course', {
         course, 
         categories: categories || [], 
         user:req.user,
        });

  } catch (error) {
    res.redirect('/admin/error') 
    console.log("error on create class: "+ error);
    
    
  }
};

exports.editCourse = async (req, res) => {
  const {title, description, category_id, takeaways,level, price} = req.body
  const teacherId = req.user.id
  const takeawaysJson = JSON.stringify(takeaways);
  
  
  try {
    const stats = await Course.update(req.params.id, {title,description, teacherId, category_id,price,level, takeawaysJson});
    res.redirect(`/teacher/course/details/${req.params.id}`) 
  } catch (error) {
    res.redirect('/teacher/error') 
    console.log("error on update course: "+ error);
    
    
  }
};


exports.getCourseSchedule = async (req, res) => {
  const id = req.params.id

  const sessions = await ClassSession.listByCourse(id)

  res.render('./teacher/classes', {
    sessions,
    user: req.user,
    courseId:req.params.id
  });
};





exports.createClass = async (req, res) => {
  const {title, description, scheduled_at, meet_link, courseId} = req.body
  const createdBy = req.user.id
  try {
    const stats = await ClassSession.create({title, description, scheduledAt: scheduled_at,meetLink: meet_link,id:uuidv4(), courseId, createdBy});
    res.redirect('/teacher/courses') 
  } catch (error) {
    res.redirect('/teacher/error') 
    console.log("error on create class: "+ error);
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
    return res.redirect(`/teacher/course/class/${courseId}`)
  } catch (error) {
    console.log(`error deleting class: ${error}`);
    res.redirect('/')
  }
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
    return res.redirect(`/teacher/courses`)
  } catch (error) {
    console.log(`error deleting class: ${error}`);
    res.redirect('/')
  }
};


exports.getClassSession = async (req, res) => {
  const id = req.params.id

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
        res.render('./teacher/class', {
      singleClass,
      attendance,
      user: req.user,
      courseId: req.params.course,
      courseVideos: courseVideos || []

    })
};

exports.updateById = async (req, res) => {
  const {title, description, scheduled_at, meet_link, courseId }= req.body
  const id = req.params.id

  try {
 
    const singleClass = await ClassSession.update(title, description, scheduled_at, meet_link, id); 
    req.flash(`${singleClass ? "error_msg" : "success_msg"}`, singleClass ? 'was not updated' : 'updated completed')
    res.redirect(`/teacher/class/${id}/${courseId}`) 
  } catch (error) {
    console.log(`error updating class: ${error}`);
    
  }
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
    
   return res.redirect(`/teacher/class/${classId}`);


  } catch (err) {
    console.error(`error in grant access controller: ${err}`);
  }
}

exports.toggleClasssVisibility = async (req, res) => {  
  const id = req.params.id
  const visible = req.params.status
   const {courseId} = req.body
try {
  const stats = await ClassSession.toggleLinkVisibility(id, visible); 

  if (stats === 1 || stats === true) {
    req.flash("success_msg", "Class status was updated successfully");
  } else {
    req.flash("error_msg", "Class status update failed");
  }

  return res.redirect(`/teacher/class/${id}/${courseId}`);

} catch (error) {
  console.error(`Error updating class status: ${error}`);
  req.flash("error_msg", "Something went wrong while updating status.");
  return res.redirect(`/admin/class/${id}`);
}

};


// attendance section
exports.getAttendanceForSession =  async (req, res) => {
    const attendance = await Attendance.getAttendanceForSession(req.params.id); 
  console.log(attendance);
  
}


