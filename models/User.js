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
    bio TEXT DEFAULT 'Hey there I love to learn',
    password_hash TEXT NOT NULL,

    token_expires TIMESTAMP,
    token VARCHAR,

    role TEXT DEFAULT 'student',
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_affiliate BOOLEAN DEFAULT FALSE,

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
      INSERT INTO users (full_name, email, password_hash, id, phone )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [fullName, email, passwordHash, id, phone]);

      return result.rows[0];
    } catch (error) {
      console.log(`error creating user: ${error.message}`);
      return null

    }
  }

    static async update(fullName, bio, phone, id) {
      try {
        const result = await pool.query(`
          UPDATE users
          SET full_name = $1,
              bio = $2,
              phone = $3
          WHERE id = $4
          RETURNING *;
        `, [fullName, bio, phone, id]);

        return result.rowCount > 0; // true if update happened
      } catch (error) {
        console.log(`error editing user: ${error.message}`);
        return null;
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

  static async findTeacher() {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM users WHERE role = $1`,
        ["admin"]
      );
  
      return rows[0] || [];
    } catch (error) {
      console.error('Error in findByEmail:', error);
      return [];
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

  // User.js
static async getManyByIds(ids) {
  const result = await pool.query(
    `SELECT * FROM users WHERE id = ANY($1::VARCHAR[])`,
    [ids]
  );
  // Return as a map for easy lookup
  const userMap = {};
  result.rows.forEach(user => {
    userMap[user.id] = user;
  });
  return userMap;
}


  static async deleteUser(id){
    const result = await pool.query(`
        DELETE FROM users
        WHERE id = $1
      `, [id]);

      return result.rowCount > 0
  }
}

module.exports = User;
