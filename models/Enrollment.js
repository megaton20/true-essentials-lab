const pool = require('../config/db');
const createTableIfNotExists = require('../utils/createTableIfNotExists');
const Badge = require('./Badge');
const ClassSession = require('./ClassSession');

class Enrollment {
  static async init() {
    const createEnrollment = `
      CREATE TABLE enrollment (
        id VARCHAR PRIMARY KEY,
        course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        payment_id VARCHAR REFERENCES payments(id) ON DELETE SET NULL,
        paid BOOLEAN DEFAULT TRUE,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createPayments = `
      CREATE TABLE payments (
        id VARCHAR PRIMARY KEY,
        course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        reference VARCHAR UNIQUE NOT NULL,
        paid_at TIMESTAMP
      );
    `;

    await createTableIfNotExists('enrollment', createEnrollment);
    await createTableIfNotExists('payments', createPayments);
  }

  static async enroll({ id, user_id, course_id, paid = true, payment_id = null }) {
    
    try {
      const query = `
        INSERT INTO enrollment (id, user_id, course_id, paid, payment_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const { rows } = await pool.query(query, [id, user_id, course_id, paid, payment_id]);
       setTimeout(async () => {
        await Badge.checkAndAwardBadges(user_id);
      }, 1000);

      return rows[0];
    } catch (error) {
      console.error('Error enrolling user:', error);
      return null;
    }
  }

  static async isEnrolled(user_id, course_id) {
    
    
    const query = `SELECT * FROM enrollment WHERE user_id = $1 AND course_id = $2 AND paid = true`;
    const { rows:result } = await pool.query(query, [user_id, course_id]);
    
    return result.length > 0;
  }

  static async listEnrolledCourses(user_id) {
    const query = `
      SELECT c.*
      FROM enrollment e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = $1 AND e.paid = true
      ORDER BY e.enrolled_at DESC;
    `;
    const { rows:result } = await pool.query(query, [user_id]);
    return result || [];
  }

static async listEnrolledCoursesWithProgress(user_id) {
  try {
    // First, get all enrolled courses
    const enrolledQuery = `
      SELECT 
        c.*,
        u.full_name as teacher_name,
        e.enrolled_at
      FROM enrollment e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE e.user_id = $1 AND e.paid = true
      ORDER BY e.enrolled_at DESC;
    `;
    
    const { rows: courses } = await pool.query(enrolledQuery, [user_id]);
    
    // Then, for each course, calculate progress and get sessions
    for (let course of courses) {
      // Get course statistics
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT cs.id) as total_sessions,
          COUNT(DISTINCT ca.session_id) as attended_sessions,
          COUNT(DISTINCT cv.id) as total_videos,
          (
            SELECT COUNT(*) 
            FROM class_attendance ca2 
            JOIN class_sessions cs2 ON ca2.session_id = cs2.id 
            WHERE cs2.course_id = $1 AND ca2.user_id = $2 AND ca2.status = true
          ) as approved_attendance
        FROM courses c
        LEFT JOIN class_sessions cs ON cs.course_id = c.id
        LEFT JOIN class_attendance ca ON ca.session_id = cs.id AND ca.user_id = $2 AND ca.is_joined = true
        LEFT JOIN class_videos cv ON cv.class_id = cs.id
        WHERE c.id = $1
        GROUP BY c.id;
      `;
      
      const { rows: [stats] } = await pool.query(statsQuery, [course.id, user_id]);
      
      // Calculate progress percentage
      course.total_sessions = parseInt(stats?.total_sessions) || 0;
      course.attended_sessions = parseInt(stats?.attended_sessions) || 0;
      course.total_videos = parseInt(stats?.total_videos) || 0;
      course.approved_attendance = parseInt(stats?.approved_attendance) || 0;
      course.progress_percentage = course.total_sessions > 0 
        ? Math.round((course.attended_sessions / course.total_sessions) * 100) 
        : 0;
      
      // Get sessions for this course
      course.sessions = await ClassSession.listByCourseWithAttendance(course.id, user_id);
    }
    
    return courses;
  } catch (error) {
    console.error('Error fetching enrolled courses with progress:', error);
    return [];
  }
}
}

module.exports = Enrollment;
