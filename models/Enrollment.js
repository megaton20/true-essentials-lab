const pool = require('../config/db');
const createTableIfNotExists = require('../utils/createTableIfNotExists');

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
}

module.exports = Enrollment;
