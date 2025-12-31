const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

const pool = require('../config/db');
const Course = require('../models/Course');
const Admin = require('../models/Admin');
const Category = require('../models/Category');
const ClassSession = require('../models/ClassSession');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');

class adminServices {
  // Helper method for database queries
  static async _query(sql, params = []) {
    const { rows } = await pool.query(sql, params);
    return rows;
  }

  static async _querySingle(sql, params = []) {
    const rows = await this._query(sql, params);
    return rows[0] || null;
  }

  static async _execute(sql, params = []) {
    const result = await pool.query(sql, params);
    return result;
  }


  static async getDashboard(req) {
    const userId = req.user.id
    try {

      let course = await Course.listAll();
      let myCourse = await Course.listAllByCreator(userId)
      let currentUser = await User.lisAll();

      const classStatus = await Admin.getClassStatus();
      const stats = await Admin.stats();
      const teachers = await User.findTeacher();
      const categories = await Category.all()



      return {
        success: true,
        data: {
          course,
          myCourse,
          currentUser,
          classStatus,
          teachers,
          categories,
          stats,
        }
      };
    } catch (error) {
      console.error("Error getting dashboard:", error.message);
      return {
        success: false,
        error: `Error loading dashboard: ${error.message}`,
      };
    }
  }

  static async getAllUsersPage() {
    try {

      const users = await Admin.allUsers();

      return {
        success: true,
        data: {
          users: users || []
        }
      };

    } catch (error) {
      console.error("Error getting dashboard:", error.message);
      return {
        success: false,
        error: `Error loading dashboard: ${error.message}`,
      };
    }
  }


  static async getAllCategoriesPage() {
    try {

      const categories = await Category.allWithCourses();
      return {
        success: true,
        data: {
          categories
        }
      };

    } catch (error) {
      console.error("Error creating categories:", error.message);
      return {
        success: false,
        message: `Error creating categories: ${error.message}`,
      };
    }
  }


  static async createCategories(body) {
    const { name, details, icon } = body
    try {

      await Category.create(name, uuidv4(), details, icon);

      return {
        success: true,
        message: `Category added`,
      };

    } catch (error) {
      console.error("Error creating categories:", error.message);
      return {
        success: false,
        message: `Error creating categories: ${error.message}`,
      };
    }
  }


  static async editCategories(body, id) {
    const { name, details, icon } = body
    try {

      await Category.update(id, name, details, icon);


      return {
        success: true,
        message: `Category updated`,
      };

    } catch (error) {
      console.error("Error updating categories:", error.message);
      return {
        success: false,
        message: `Error updating categories: ${error.message}`,
      };
    }
  }


  static async deleteCategories(id) {
    try {

      await Category.delete(id);


      return {
        success: true,
        message: `Category deleted`,
      };

    } catch (error) {
      console.error("Error deleting from categories:", error.message);
      return {
        success: false,
        message: `Error deleting from categories: ${error.message}`,
      };
    }
  }



  static async getUser(id) {
    try {

      const user = await Admin.getById(id);

      return {
        success: true,
        data: {
          user: user || []
        }
      };

    } catch (error) {
      console.error("Error getting dashboard:", error.message);
      return {
        success: false,
        error: `Error loading dashboard: ${error.message}`,
      };
    }
  }

  static async deleteUser(id) {
    try {

      await User.deleteUser(id);


      return {
        success: true,
        message: `user deleted`,
      };

    } catch (error) {
      console.error("Error deleting user:", error.message);
      return {
        success: false,
        message: `Error deleting user: ${error.message}`,
      };
    }
  }


  static async createClass(body, createdBy) {
    const { title, description, scheduled_at, meet_link, courseId } = body

    try {

      await ClassSession.create({ title, description, scheduledAt: scheduled_at, meetLink: meet_link, id: uuidv4(), courseId, createdBy });

      return {
        success: true,
        message: `class sesstion added`,
      };

    } catch (error) {
      console.error("Error creating class:", error.message);
      return {
        success: false,
        message: `Error creating class: ${error.message}`,
      };
    }
  }


  static async getAllCourse() {
    try {

      const allCourses = await Course.listAll();
      const categories = await Category.all()

      return {
        success: true,
        data: {
          categories,
          allCourses
        }
      };

    } catch (error) {
      console.error("Error getting courses: ", error.message);
      return {
        success: false,
        message: `Error getting courses:  ${error.message}`,
      };
    }
  }



  static async getOneCourse(req) {
    try {

      const course = await Course.findById(req.params.id);

      const allTeachers = await Teacher.findAll()

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



      return {
        success: true,
        data: {
          categories,
          allTeachers,
          course
        }
      };

    } catch (error) {
      console.error("Error getting courses: ", error.message);
      return {
        success: false,
        message: `Error getting courses:  ${error.message}`,
      };
    }
  }

  static async createProgram(body, teacherId) {
    const { title, description, category_id, takeaways, price, level } = body
    const takeawaysJson = JSON.stringify(takeaways);


    try {

      await Course.create({ id: uuidv4(), title, description, teacherId, category_id, price, level, takeawaysJson });

      return {
        success: true,
        message: `Program added`,
      };

    } catch (error) {
      console.error("Error creating program:", error.message);
      return {
        success: false,
        message: `Error creating program: ${error.message}`,
      };
    }
  }


  static async editProgram(id, body, teacherId) {
    const { title, description, category_id, takeaways, price, level } = body

    const takeawaysJson = JSON.stringify(takeaways);

    try {

      await Course.update(id, { title, description, teacherId, category_id, price, level, takeawaysJson });


      return {
        success: true,
        message: `program updated`,
      };

    } catch (error) {
      console.error("Error updating program:", error.message);
      return {
        success: false,
        message: `Error updating program: ${error.message}`,
      };
    }
  }


  static async createProgramVideo(body, courseId, thumbnailPath, videoFiles) {
    const { title, description } = body


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

      return {
        success: true,
        message: `Program video added`,
      };

    } catch (error) {
      console.error("Error creating program video:", error.message);
      return {
        success: false,
        message: `Error creating program video : ${error.message}`,
      };
    }
  }



  static async getCourseSchedule(id) {
    try {

      const sessions = await ClassSession.listByCourse(id)


      return {
        success: true,
        data: {
          sessions,
        }
      };
    } catch (error) {
      console.error("Error getting dashboard:", error.message);
      return {
        success: false,
        error: `Error loading dashboard: ${error.message}`,
      };
    }
  }


  static async getCourseClassSessions(id) {
    try {

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

      return {
        success: true,
        data: {
          singleClass,
          attendance,
          courseVideos: courseVideos || [],
          cloudinaryConfig: {
            cloudName: process.env.CLOUD_NAME,
            uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'teacher-videos' // Fallback
          }
        }
      };
    } catch (error) {
      console.error("Error getting session details:", error.message);
      return {
        success: false,
        error: `Error loading session details: ${error.message}`,
      };
    }
  }

  static async deleteCourse(id) {
    try {

      await Course.deleteCourse(id);;


      return {
        success: true,
        message: `program deleted`,
      };

    } catch (error) {
      console.error("Error deleting program: ", error.message);
      return {
        success: false,
        message: `Error deleting program:  ${error.message}`,
      };
    }
  }

  static async grantAccess(classId, userId, grant) {
    try {

      await Attendance.approveAttendance(classId, userId, grant);



      return {
        success: true,
        message: `Access granted`,
      };

    } catch (error) {
      console.error("Error grantingn access to program: ", error.message);
      return {
        success: false,
        message: `Error grantingn access to program:  ${error.message}`,
      };
    }
  }

  static async updateClassSessionById(body, id) {

    const { title, description, scheduled_at, meet_link } = body

    try {

      await ClassSession.update(title, description, scheduled_at, meet_link, id);

      return {
        success: true,
        message: `class session updated`,
      };

    } catch (error) {
      console.error("Error on session update: ", error.message);
      return {
        success: false,
        message: `Error on session update:  ${error.message}`,
      };
    }
  }


  static async findByJoinCode(body, id) {

    try {

      const getClass = await ClassSession.findByJoinCode(code);
      return {
        success: true,
        getClass
      };

    } catch (error) {
      console.error("Error on getting by join code:  ", error.message);
      return {
        success: false,
        message: `Error on getting by join code:   ${error.message}`,
      };
    }
  }

  static async toggleClasssVisibility(classId, visible) {

    try {

      await ClassSession.toggleLinkVisibility(classId, visible);

      return {
        success: true,
        message: `Session toggle completed`,
      };

    } catch (error) {
      console.error("Error on Session toggle:  ", error.message);
      return {
        success: false,
        message: `Error on Session toggle:   ${error.message}`,
      };
    }
  }

  static async getVisibleLink(classId, visible) {

    try {

      const stats = await ClassSession.getVisibleLink(joinCode);

      return {
        success: true,
        stats,
        message: `Session toggle completed`,
      };

    } catch (error) {
      console.error("Error on Session toggle:  ", error.message);
      return {
        success: false,
        message: `Error on Session toggle:   ${error.message}`,
      };
    }
  }

  static async deleteClass(classId) {

    try {

      await ClassSession.deleteClass(classId);

      return {
        success: true,
        message: `class schedule deleted`,
      };

    } catch (error) {
      console.error("Error on class schedule delete:  ", error.message);
      return {
        success: false,
        message: `Error on class schedule delete:   ${error.message}`,
      };
    }
  }

  static async completeClass(classID, status) {

    try {

      await ClassSession.completeClass(classID, status);

      return {
        success: true,
        message: `class schedule completed`,
      };

    } catch (error) {
      console.error("Error on class schedule complete:  ", error.message);
      return {
        success: false,
        message: `Error on class schedule complete:   ${error.message}`,
      };
    }
  }


  static async toggleProgramOpen(courseId, newState) {
    
    try {

      await Course.toggleCourseOpen(courseId, newState);
      return {
        success: true,
        message: `toggle program completed`,
      };

    } catch (error) {
      console.error("Error on program toggle complete:  ", error.message);
      return {
        success: false,
        message: `Error on program toggle complete:   ${error.message}`,
      };
    }
  }

}

module.exports = adminServices;