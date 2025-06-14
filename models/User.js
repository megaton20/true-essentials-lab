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

    token_expires TIMESTAMP,
    token VARCHAR,

    bank_name VARCHAR,
    account_number VARCHAR,
    account_name VARCHAR,

    role TEXT DEFAULT 'student',
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_affiliate BOOLEAN DEFAULT FALSE,

    referral_code TEXT UNIQUE,
    balance NUMERIC(12, 2) DEFAULT 0.00,

    has_paid BOOLEAN DEFAULT FALSE,
    discount_applied NUMERIC(5, 2) DEFAULT 0.00,
    payment_reference TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await createTableIfNotExists('users', createQuery);
    
  }

  static async create({ fullName, email, passwordHash, id }) {
    const phone = 1234
    try {
          const result = await pool.query(`
      INSERT INTO users (full_name, email, password_hash, id, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [fullName, email, passwordHash, id, phone]);

    return result.rows[0];
    } catch (error) {
      console.log(`error creating user: ${error.message}`);
      return null
      
    }
  }

static async findByEmail(email) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error in findByEmail:', error);
    return null;
  }
}


  static async markAsPaid(userId, discount, reference) {
    await pool.query(`
      UPDATE users
      SET has_paid = true, discount_applied = $2, payment_reference = $3
      WHERE id = $1;
    `, [userId, discount, reference]);
  }

  static async getById(userId) {
    try {
        const res = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    return res.rows[0];
    } catch (error) {
      console.log(`error getting user: ${error.message}`);
      
    }
  }
}

module.exports = User;
