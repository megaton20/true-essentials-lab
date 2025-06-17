const pool = require('../config/db');

const createTableIfNotExists = require('../utils/createTableIfNotExists');

class Attendance {

  // Auto-create table on class load
  static async init() {
    const createTableQuery = `
      CREATE TABLE class_attendance (
        id VARCHAR PRIMARY KEY,
        session_id VARCHAR REFERENCES class_sessions(id) ON DELETE CASCADE,
        user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_joined BOOLEAN DEFAULT FALSE,
        welcome_sent BOOLEAN DEFAULT FALSE,
        status BOOLEAN DEFAULT FALSE,
        UNIQUE(session_id, user_id)
      );
    `;

    await createTableIfNotExists('class_attendance', createTableQuery);
  }


  static async approveAttendance(classId, userId, grant) {


    try {
      const result = await pool.query(`
        UPDATE class_attendance
        SET status = $1
        WHERE session_id = $2 AND user_id = $3
      `, [grant, classId, userId]);

      return result.rowCount;

    } catch (err) {
      console.error('Marking attendance error:', err);
      return null;
    }

  }

  static async markAttendance(sessionId, userId, id) {

    try {
      const insertResult = await pool.query(`
      INSERT INTO class_attendance (session_id, user_id, id,is_joined )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [sessionId, userId, id, true]);

      if (insertResult.rows.length > 0) {
        return insertResult.rows[0]; // new attendance marked
      } else {
        // attendance already exists, fetch existing
        const existing = await pool.query(`
        SELECT * FROM class_attendance WHERE session_id = $1 AND user_id = $2
      `, [sessionId, userId]);

        return existing.rows[0] || null;
      }
    } catch (err) {
      console.error('Attendance error:', err);
      throw err;  // maybe throw or handle error appropriately
    }
  }

  
static async getBySessionIds(studentId, sessionIds = []) {
  if (!sessionIds.length) return {};

  try {
    const result = await pool.query(
      `SELECT session_id, is_joined FROM class_attendance 
       WHERE user_id = $1 AND session_id = ANY($2)`,
      [studentId, sessionIds]
    );

    const attendanceMap = {};
    result.rows.forEach(row => {
      attendanceMap[row.session_id] = row.is_joined;
    });

    return attendanceMap;
  } catch (err) {
    console.error('Error fetching attendance by session IDs:', err);
    return {};
  }
}


  // admin
  static async getAttendanceForSession(sessionId) {
    const res = await pool.query(`
      SELECT u.id, u.full_name,u.email, a.joined_at
      FROM class_attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.session_id = $1
    `, [sessionId]);

    return res.rows;
  }

 
  static async studentClassHistory(studentId, sessionId) {
  const res = await pool.query(`
    SELECT 
      cs.id AS session_id,
      cs.title,
      cs.scheduled_at,
      cs.status,
      cs.join_code,
      c.title AS course_title,
      CASE WHEN ca.id IS NULL THEN false ELSE true END AS is_joined
    FROM class_sessions cs
    INNER JOIN courses c ON cs.session_id = c.id
    LEFT JOIN class_attendance ca 
      ON ca.session_id = cs.id AND ca.user_id = $1
    WHERE c.session_id = $2
    ORDER BY cs.scheduled_at DESC
    LIMIT 6;
  `, [studentId, sessionId]);

  return res.rows;
}

static async studentClassIds(studentId, seasonId) {
  try {
    const res = await pool.query(`
      SELECT cs.id
      FROM class_sessions cs
      INNER JOIN courses c ON cs.session_id = c.id
      INNER JOIN class_attendance ca ON ca.session_id = cs.id
      WHERE ca.user_id = $1 AND c.season_id = $2
    `, [studentId, seasonId]);

    return res.rows.map(row => row.id);
  } catch (err) {
    console.error('Error fetching attended class session IDs:', err);
    return [];
  }
}


}

module.exports = Attendance;
