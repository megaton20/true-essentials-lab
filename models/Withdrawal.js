
const nodemailer = require('nodemailer')
const createTableIfNotExists = require('../utils/createTableIfNotExists');
const pool = require('../config/db')
const { v4: uuidv4 } = require('uuid');
const User = require('./User');
 
 
 class Withdrawal {

    static async init(){
        
    const withdrawals = `
            CREATE TABLE withdrawals  (
                id VARCHAR PRIMARY KEY,
                referral_id VARCHAR REFERENCES referrers(id) ON DELETE CASCADE,
                amount NUMERIC(12, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, paid
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_at TIMESTAMP,
                paid_at TIMESTAMP,
                admin_id VARCHAR REFERENCES users(id)
            );

    `;

    await createTableIfNotExists('withdrawals', withdrawals);
    
  }

  static async create(referral_id, amount) {
    console.log(amount);
    
    try {
      const result = await pool.query(`
        INSERT INTO withdrawals (id, referral_id, amount, status)
        VALUES ($1, $2, $3, 'pending')
        RETURNING *;
      `, [uuidv4(), referral_id, amount]);

      return result.rows[0]; // Return the inserted withdrawal
    } catch (error) {
      console.error('Error creating withdrawal:', error.message);
      return null;
    }
  }
}

module.exports = Withdrawal