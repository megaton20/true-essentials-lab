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



  static async markAttendance(sessionId, userId) {
    try {
      await pool.query(`
        INSERT INTO class_attendance (session_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [sessionId, userId]);
    } catch (err) {
      console.error('Attendance error:', err);
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
}

module.exports = Attendance;
