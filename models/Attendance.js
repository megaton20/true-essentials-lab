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
        UNIQUE(session_id, user_id)
      );
    `;

   await createTableIfNotExists('class_attendance', createTableQuery);
  }



static async markAttendance(sessionId, userId, id) {
  
  try {
    const insertResult = await pool.query(`
      INSERT INTO class_attendance (session_id, user_id, id)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [sessionId, userId, id]);

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


  static async getAttendanceForSession(sessionId) {
    const res = await pool.query(`
      SELECT u.id, u.full_name, a.joined_at
      FROM class_attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.session_id = $1
    `, [sessionId]);

    return res.rows;
  }

  static async studentClassHistory(studentId) {

    const res = await pool.query(`
          SELECT 
        cs.id AS session_id,
        cs.title,
        cs.scheduled_at,
        cs.status,
        cs.join_code,
        CASE WHEN ca.id IS NULL THEN false ELSE true END AS is_joined
      FROM class_sessions cs
      LEFT JOIN class_attendance ca 
        ON ca.session_id = cs.id AND ca.user_id = $1
      
      ORDER BY cs.scheduled_at DESC
      LIMIT 6;
    `, [studentId]);

    return res.rows;
  }
}

module.exports = Attendance;
