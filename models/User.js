const pool = require('../config/db');

class User {
  static async create({ fullName, email, passwordHash, referralCode }) {
    const result = await pool.query(`
      INSERT INTO users (full_name, email, password_hash, referral_code)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [fullName, email, passwordHash, referralCode]);

    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1;`, [email]);
    return result.rows[0];
  }

  static async verifyEmail(userId) {
    await pool.query(`UPDATE users SET is_email_verified = true WHERE id = $1;`, [userId]);
  }

  static async markAsPaid(userId, discount, reference) {
    await pool.query(`
      UPDATE users
      SET has_paid = true, discount_applied = $2, payment_reference = $3
      WHERE id = $1;
    `, [userId, discount, reference]);
  }

  static async getById(userId) {
    const res = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    return res.rows[0];
  }
}

module.exports = User;
