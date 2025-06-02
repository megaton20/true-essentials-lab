const pool = require('../config/db');
const createTableIfNotExists = require('../utils/createTableIfNotExists');

class User {

  static async init() {
    const createQuery = `
      CREATE TABLE users (
        id VARCHAR PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        is_email_verified BOOLEAN DEFAULT false,
        referral_code TEXT,
        has_paid BOOLEAN DEFAULT false,
        discount_applied FLOAT DEFAULT 0,
        payment_reference TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await createTableIfNotExists('users', createQuery);
    
  }

  static async create({ fullName, email, passwordHash, referralCode, id }) {
    const phone = 1234
    try {
          const result = await pool.query(`
      INSERT INTO users (full_name, email, password_hash, referral_code, id, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `, [fullName, email, passwordHash, referralCode, id, phone]);

    return result.rows[0];
    } catch (error) {
      console.log(`error creating user: ${error.message}`);
      return null
      
    }
  }

  static async findByEmail(email) {
    try {
       const result = await pool.query(`SELECT * FROM users WHERE email = $1;`, [email]);
    return result.rows[0];
    } catch (error) {
      
      console.log(error);
      return null
    }
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
