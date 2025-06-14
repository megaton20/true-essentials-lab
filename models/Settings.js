const pool = require('../config/db');
const createTableIfNotExists = require('../utils/createTableIfNotExists');


class Setting {

        // Auto-create table on class load
  static async init() {
    const createTableQuery = `
        CREATE TABLE settings (
           id VARCHAR PRIMARY KEY,
           is_registration_open BOOLEAN DEFAULT FALSE,
           is_payment_open BOOLEAN DEFAULT TRUE
        );
    `;
      await createTableIfNotExists('settings', createTableQuery);
  }


  static async getAll() {
   const {rows:settings} = await pool.query('SELECT * FROM settings');
    return settings
  }

  static async toggleColumn(column) {
    const validColumns = ['is_registration_open', 'is_payment_open'];
    if (!validColumns.includes(column)) {
      throw new Error('Invalid setting column');
    }

    // Ensure row exists
    const { rows } = await pool.query('SELECT * FROM settings LIMIT 1');
    if (rows.length === 0) {
      await pool.query(`
        INSERT INTO settings (id, is_registration_open, is_payment_open)
        VALUES ($1, $2, $3)
      `, ['default', false, true]);
    }

    // Toggle the column
    await pool.query(`UPDATE settings SET ${column} = NOT ${column}`);
    return `${column.replace(/_/g, ' ')} toggled successfully.`;
  }
  
}

module.exports = Setting;
