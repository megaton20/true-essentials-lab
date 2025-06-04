const pool = require('../config/db');

const createTableIfNotExists = require('../utils/createTableIfNotExists');

class ReferralCode {

      // Auto-create table on class load
  static async init() {
    const createTableQuery = `
        CREATE TABLE referral_codes (
          id VARCHAR PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          location_name TEXT NOT NULL,
          discount_percentage FLOAT NOT NULL,
          max_uses INTEGER NOT NULL,
          current_uses INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
    `;

     await createTableIfNotExists('referral_codes', createTableQuery);
  }


  
  static async lisAll() {
    const result = await pool.query(`SELECT * FROM referral_codes`);
    return result.rows;
  }

  static async findByCode(code) {
    const result = await pool.query(`SELECT * FROM referral_codes WHERE code = $1`, [code]);
    return result.rows[0];
  }

  static async incrementUsage(code) {
    await pool.query(`
      UPDATE referral_codes
      SET current_uses = current_uses + 1
      WHERE code = $1 AND current_uses < max_uses;
    `, [code]);
  }

  static async isCodeValid(code) {
    const res = await pool.query(`
      SELECT * FROM referral_codes
      WHERE code = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > NOW());
    `, [code]);
    return res.rows[0];
  }

  static async create({ code, location, discount, maxUses, expires, id }) {
    try {
        const result = await pool.query(`
      INSERT INTO referral_codes (code, location_name, discount_percentage, max_uses, expires_at, id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `, [code, location, discount, maxUses, expires, id]);
    return result.rows[0];
    } catch (error) {
      console.log(`error creating code: ${error}`);
      return null
      
    }
  }
}

module.exports = ReferralCode;
