const pool = require('../config/db');
const createTableIfNotExists = require('../utils/createTableIfNotExists');


class SeasonUser {
    static async init(){
            const seasonUsers = `
            CREATE TABLE season_users (
            id VARCHAR PRIMARY KEY,
            user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
            season_id VARCHAR REFERENCES seasons(id) ON DELETE CASCADE,
            has_paid BOOLEAN DEFAULT FALSE,
            payment_reference TEXT,
            discount_applied NUMERIC(5, 2) DEFAULT 0.00,
            joined_at TIMESTAMP DEFAULT NOW(),
            paid_at TIMESTAMP,

            UNIQUE (user_id, season_id)

            );

            `
            await createTableIfNotExists('season_users', seasonUsers);
    }


  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.season_id = data.season_id;
    this.has_paid = data.has_paid;
    this.payment_reference = data.payment_reference;
    this.discount_applied = data.discount_applied;
    this.joined_at = data.joined_at;
    this.paid_at = data.paid_at;
  }

static async register(userId, seasonId, id) {
  const result = await pool.query(
    `INSERT INTO season_users (id, user_id, season_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, season_id) DO NOTHING
     RETURNING *`,
    [id, userId, seasonId]
  );
  return result.rows[0] ? new SeasonUser(result.rows[0]) : null;
}



  // Mark a user as paid for a season
  static async markPaid(userId, seasonId, reference, discount = 0.0) {
    const result = await pool.query(
      `UPDATE season_users
       SET has_paid = TRUE,
           payment_reference = $1,
           discount_applied = $2,
           paid_at = NOW()
       WHERE user_id = $3 AND season_id = $4
       RETURNING *`,
      [reference, discount, userId, seasonId]
    );
    return result.rows[0] ? new SeasonUser(result.rows[0]) : null;
  }

  // Get season-user status
  static async get(userId, seasonId) {
    const result = await pool.query(
      `SELECT * FROM season_users WHERE user_id = $1 AND season_id = $2`,
      [userId, seasonId]
    );
    return result.rows[0] ? new SeasonUser(result.rows[0]) : null;
  }

  // Get all seasons a user has joined
  static async getSeasonsForUser(userId) {
    const result = await pool.query(
      `SELECT * FROM season_users WHERE user_id = $1 ORDER BY joined_at DESC`,
      [userId]
    );
    return result.rows.map(row => new SeasonUser(row));
  }

  // Get all users who paid for a season
  static async getPaidUsers(seasonId) {
    const result = await pool.query(
      `SELECT * FROM season_users WHERE season_id = $1 AND has_paid = TRUE`,
      [seasonId]
    );
    return result.rows.map(row => new SeasonUser(row));
  }
}

module.exports = SeasonUser;
