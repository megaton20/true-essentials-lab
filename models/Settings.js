const pool = require('../config/db');


class Setting {
  static async get(key) {
    const res = await pool.query(`SELECT value FROM settings WHERE key = $1`, [key]);
    return res.rows[0]?.value;
  }

  static async set(key, value) {
    await pool.query(`
      INSERT INTO settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `, [key, value]);
  }

  static async isRegistrationOpen() {
    const value = await this.get('registrationOpen');
    return value === 'true';
  }

  static async isPaymentEnabled() {
    const value = await this.get('paymentEnabled');
    return value === 'true';
  }
}

module.exports = Setting;
