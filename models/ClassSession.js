const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const createTableIfNotExists = require('../utils/createTableIfNotExists');

class ClassSession {

   // Auto-create table on class load
  static async init() {
    const createTableQuery = `
            CREATE TABLE class_sessions (
          id VARCHAR PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          scheduled_at TIMESTAMP NOT NULL,
          meet_link TEXT NOT NULL,
          join_code VARCHAR(12) UNIQUE NOT NULL,
          show_link BOOLEAN DEFAULT FALSE, -- to control visibility
          created_by VARCHAR REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status BOOLEAN DEFAULT FALSE
        );
        
    `;

     await createTableIfNotExists('class_sessions', createTableQuery);
  }


  static async create({ title, description, scheduledAt, meetLink, id }) {
    const joinCode = uuidv4().split('-')[0]; // Generate a short unique join code
    try {
         const result = await pool.query(`
      INSERT INTO class_sessions (title, description, scheduled_at, meet_link, join_code, id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `, [title, description, scheduledAt, meetLink, joinCode, id]);

    return result.rows[0];
    } catch (error) {
      console.log(`error creating class: ${error}`);
      return []
    }
  }

  static async listAll() {
   try {
     const result = await pool.query(`SELECT * FROM class_sessions ORDER BY scheduled_at DESC`);
    return result.rows;
   } catch (error) {
    console.log(`error getting all classes: ${error}`);
    return []
    
   }
  }

  static async findById(id) {
    try {
         const result = await pool.query(`SELECT * FROM class_sessions WHERE id = $1`, [id]);
        return result.rows[0];
    } catch (error) {
      return []
    }
  }

  static async findByJoinCode(joinCode) {
    try {
         const result = await pool.query(`SELECT * FROM class_sessions WHERE join_code = $1`, [joinCode]);
        return result.rows[0];
    } catch (error) {
      return []
    }
  }

  static async toggleLinkVisibility(id, visible) {
    await pool.query(`UPDATE class_sessions SET show_link = $1 WHERE id = $2`, [visible, id]);
  }

  static async getVisibleLink(joinCode) {
    const result = await pool.query(`
      SELECT meet_link FROM class_sessions
      WHERE join_code = $1 AND show_link = TRUE;
    `, [joinCode]);
    return result.rows[0]?.meet_link || null;
  }
}

module.exports = ClassSession;
