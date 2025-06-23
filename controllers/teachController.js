const ClassSession = require('../models/ClassSession');
const { v4: uuidv4 } = require('uuid');
const Attendance = require('../models/Attendance');
const pool = require('../config/db');
const Season = require('../models/Season');
const SeasonUser = require('../models/SeasonUsers');




exports.getDash = async (req, res) => {
  try {
    const userId = req.user.id;

    // Step 1: Check current season
    const currentSeason = await Season.getCurrent();
    let userSeason = null;

    if (currentSeason) {
      userSeason = await SeasonUser.get(userId, currentSeason.id);
      req.user = {
        ...req.user,
        seasonInfo: userSeason
      };
    }

    // Step 2: Check if user is a teacher
    const teacherQuery = `SELECT id FROM teachers WHERE user_id = $1`;
    const { rows: teacherRows } = await pool.query(teacherQuery, [userId]);

    if (teacherRows.length === 0) {
      req.flash('error', 'You are not registered as a teacher.');
      return res.redirect('/handler');
    }

    const teacherId = teacherRows[0].id;

    // Step 3: Get all assigned courses
    const courseIdsQuery = `
      SELECT c.*
      FROM teacher_courses tc
      JOIN courses c ON c.id = tc.course_id
      WHERE tc.teacher_id = $1
    `;
    const { rows: myAssignedCourses } = await pool.query(courseIdsQuery, [teacherId]);

    // Step 4: Render dashboard
    res.render('./teacher/dashboard', {
      courses: myAssignedCourses,
      user: req.user
    });

  } catch (error) {
    console.error("Error fetching teacher dashboard:", error);
    res.redirect('/teacher/error');
  }
};

exports.getCourseSchedule = async (req, res) => {
  const id = req.params.id
  const userId = req.user.id
  const sessions = await ClassSession.listByCourse(id)
      const currentSeason = await Season.getCurrent();
  const userSeason = await SeasonUser.get(userId, currentSeason.id);

  // check if user don pay
  req.user = {
    ...req.user,
    seasonInfo: userSeason
  };
  res.render('./teacher/classes', {
    sessions,
    user: req.user,
    courseId:req.params.id
  });
};

exports.getClassSession = async (req, res) => {
  const id = req.params.id
    const userId = req.user.id
  const sessions = await ClassSession.listByCourse(id)
      const currentSeason = await Season.getCurrent();
  const userSeason = await SeasonUser.get(userId, currentSeason.id);

  // check if user don pay
  req.user = {
    ...req.user,
    seasonInfo: userSeason
  };

    const attendance = await Attendance.getAttendanceForSession(id)

    const singleClass = await ClassSession.findById(id); 
        res.render('./teacher/class', {
      singleClass,
      attendance,
      user: req.user
    })
};


exports.createClass = async (req, res) => {
  const {title, description, scheduled_at, meet_link, courseId} = req.body
  const createdBy = req.user.id
  try {
    const stats = await ClassSession.create({title, description, scheduledAt: scheduled_at,meetLink: meet_link,id:uuidv4(), courseId, createdBy});
    res.redirect('/teacher') 
  } catch (error) {
    res.redirect('/teacher/error') 
    console.log("error on create class: "+ error);
  }
};

exports.updateById = async (req, res) => {
  const {title, description, scheduled_at, meet_link }= req.body
  const id = req.params.id

  try {
 
    const singleClass = await ClassSession.update(title, description, scheduled_at, meet_link, id); 
    res.redirect(`/teacher/class/${id}`) 
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
try {
  const stats = await ClassSession.toggleLinkVisibility(id, visible); 

  if (stats === 1 || stats === true) {
    req.flash("success_msg", "Class status was updated successfully");
  } else {
    req.flash("error_msg", "Class status update failed");
  }

  return res.redirect(`/teacher/class/${id}`);

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


