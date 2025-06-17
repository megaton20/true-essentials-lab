const pool = require('../config/db');
const createTableIfNotExists = require('../utils/createTableIfNotExists');
const Season = require('./Season');

class Course {
  // Auto-create table on class load
  static async init() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR PRIMARY KEY,
        season_id VARCHAR NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        teacher_id VARCHAR REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await createTableIfNotExists('courses', createTableQuery);
  }

  constructor(data) {
    this.id = data.id;
    this.season_id = data.season_id;
    this.title = data.title;
    this.description = data.description;
    this.teacher_id = data.teacher_id;
    this.created_at = data.created_at;
  }

  static async create({ id, title, description, teacherId }) {
     const season = await Season.getCurrent()
     console.log(season.id);
    
    try {
      const result = await pool.query(
        `
        INSERT INTO courses (id, title, description, teacher_id, season_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
        `,
        [id, title, description, teacherId, season.id]
      );

      return new Course(result.rows[0]);
    } catch (error) {
      console.error('Error creating course:', error);
      return null;
    }
  }

  static async update(id, { title, description, teacherId }) {
    try {
      const result = await pool.query(
        `
        UPDATE courses
        SET title = $1, description = $2, teacher_id = $3
        WHERE id = $4
        RETURNING *;
        `,
        [title, description, teacherId, id]
      );

      return new Course(result.rows[0]);
    } catch (error) {
      console.error('Error updating course:', error);
      return null;
    }
  }

  static async listAll() {
    try {
      const result = await pool.query(
        `SELECT * FROM courses ORDER BY created_at DESC;`
      );
      return result.rows.map(row => new Course(row));
    } catch (error) {
      console.error('Error listing all courses:', error);
      return [];
    }
  }

  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT * FROM courses WHERE id = $1;`,
        [id]
      );
      if (result.rows.length === 0) return null;
      return new Course(result.rows[0]);
    } catch (error) {
      console.error('Error finding course by ID:', error);
      return null;
    }
  }

  static async listAllBySeason(seasonId) {
  try {
    const {rows: result} = await pool.query(
      `SELECT * FROM courses WHERE season_id = $1 ORDER BY created_at DESC`,
      [seasonId]
    );
    return result || []
  } catch (error) {
    console.error('Error fetching courses for season:', error);
    return [];
  }
}

}

module.exports = Course;
