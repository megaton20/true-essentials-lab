const pool = require('../config/db');

class Attendance {
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
