const pool = require('../config/db');
const createTableIfNotExists = require('../utils/createTableIfNotExists');


class Season {

    // Auto-create table on class load
    static async init() {
        const createSeason = `
                CREATE TABLE seasons (
                id VARCHAR PRIMARY KEY,
                name VARCHAR(100) NOT NULL,           
                reg_open TIMESTAMP NOT NULL,
                reg_close TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
    `;
            
        await createTableIfNotExists('seasons', createSeason);
    }

    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.course = data.course;
        this.reg_open = new Date(data.reg_open);
        this.reg_close = new Date(data.reg_close);
        this.is_active = data.is_active;
        this.created_at = data.created_at;
    }

    static async getCurrent() {
        const now = new Date();
        const result = await pool.query(
            `SELECT * FROM seasons
       WHERE reg_open <= $1 AND reg_close >= $1 AND is_active = TRUE
       ORDER BY reg_open DESC LIMIT 1;`,
            [now]);
        if (result.rows.length === 0) return null;
        return new Season(result.rows[0]);
    }

    static async getUpcoming() {
        const result = await pool.query(
            `SELECT * FROM seasons
       WHERE reg_open > NOW()
       ORDER BY reg_open ASC LIMIT 1;`
        );
        if (result.rows.length === 0) return null;
        return new Season(result.rows[0]);
    }

    static async create({ name, id, reg_open, reg_close }) {
        const result = await pool.query(
            `INSERT INTO seasons (name, id, reg_open, reg_close)
       VALUES ($1, $2, $3, $4) RETURNING *;`,
            [name, id, reg_open, reg_close]
        );
        return new Season(result.rows[0]);
    }

    static async edit( id, name, reg_open, reg_close ) {
    const result = await pool.query(
        `UPDATE seasons
         SET name = $1,
             reg_open = $2,
             reg_close = $3
         WHERE id = $4
         RETURNING *;`,
        [name, reg_open, reg_close, id]
    );

    return result.rowCount > 0; // true if updated, false if not found
}


    static async deactivateExpired() {
        await pool.query(`UPDATE seasons SET is_active = FALSE WHERE reg_close < NOW();`);
    }

    static async activateCurrent() {
  const result = await pool.query(`
    UPDATE seasons
    SET is_active = TRUE
    WHERE reg_open <= NOW()
      AND reg_close > NOW()
      AND is_active = FALSE
  `);

  return result.rowCount > 0; // returns true if any row was updated
}


  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT * FROM seasons WHERE id = $1;`,
        [id]
      );
      if (result.rows.length === 0) return null;
      return new Season(result.rows[0]);
    } catch (error) {
      console.error('Error finding course by ID:', error);
      return null;
    }
  }

}

module.exports = Season;
