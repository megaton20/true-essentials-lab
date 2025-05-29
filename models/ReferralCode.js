const pool = require('../config/db');

class ReferralCode {
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

  static async create({ code, locationName, discountPercentage, maxUses, expiresAt = null }) {
    const result = await pool.query(`
      INSERT INTO referral_codes (code, location_name, discount_percentage, max_uses, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [code, locationName, discountPercentage, maxUses, expiresAt]);
    return result.rows[0];
  }
}

module.exports = ReferralCode;
