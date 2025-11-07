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
          course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          description TEXT,
          scheduled_at TIMESTAMP NOT NULL,
          meet_link TEXT NOT NULL,
          join_code VARCHAR(12) UNIQUE NOT NULL,
          show_link BOOLEAN DEFAULT FALSE, -- to control visibility
          created_by VARCHAR REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_complete BOOLEAN DEFAULT FALSE,
          status BOOLEAN DEFAULT FALSE
        );
        
    `;

    const createCourseVideos = `
      CREATE TABLE class_videos (
          id VARCHAR PRIMARY KEY,
          class_id VARCHAR REFERENCES class_sessions(id) ON DELETE CASCADE,
          title VARCHAR(255),
          video_url TEXT,
          video_public_id TEXT,
          thumbnail_url TEXT,
          thumbnail_public_id TEXT,
          part_number INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
      );

      `
    await createTableIfNotExists('class_videos', createCourseVideos);
     await createTableIfNotExists('class_sessions', createTableQuery);
  }

    constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.scheduled_at = data.scheduled_at;
    this.class_link = data.class_link;
    this.meet_link = data.meet_link;
    this.join_code = data.join_code;
    this.show_link = data.show_link;
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.duration = data.duration;
  }

  static async create({ title, description, scheduledAt, meetLink, id, courseId, createdBy }) {
    const joinCode = uuidv4().split('-')[0]; // Generate a short unique join code
    try {
         const result = await pool.query(`
      INSERT INTO class_sessions (title, description, scheduled_at, meet_link, join_code, id, course_id,created_by )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `, [title, description, scheduledAt, meetLink, joinCode, id, courseId, createdBy]);

    return result.rows[0];
    } catch (error) {
      console.log(`error creating class: ${error}`);
      return []
    }
  }

  static async update(title, description, scheduledAt, meetLink, id ) {
    
    try {
         const result = await pool.query(`
              UPDATE class_sessions 
                SET title = $1, scheduled_at = $2, description = $3, meet_link = $4
                WHERE id = $5
    `, [title,scheduledAt, description,  meetLink, id]);

    return result.rows[0];
    } catch (error) {
      console.log(`error editing class: ${error}`);
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

  static async listByCourse(courseId) {
  try {
const {rows:result} = await pool.query(`
  SELECT 
    cs.*,
    u.id as teacher_user_id,
    u.full_name as teacher_name,
    u.email as teacher_email
    -- add other user columns with aliases as needed
  FROM class_sessions cs
  JOIN courses c ON cs.course_id = c.id
  JOIN users u ON c.teacher_id = u.id
  WHERE cs.course_id = $1
  ORDER BY cs.scheduled_at ASC
`, [courseId]);

    return result;
  } catch (error) {
    console.error(`Error fetching sessions for course ${courseId}:`, error);
    return [];
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
   try {
     const result = await pool.query(`UPDATE class_sessions SET show_link = $1, status = $1 WHERE id = $2`, [visible, id]);
    return result.rowCount
   } catch (error) {

     console.log(`error in toggle func`);
    return null
    
   }
  }

  static async getVisibleLink(joinCode) {
    const result = await pool.query(`
      SELECT meet_link FROM class_sessions
      WHERE join_code = $1 AND show_link = TRUE;
    `, [joinCode]);
    return result.rows[0]?.meet_link || null;
  }

  static async deleteClass(id){
    const result = await pool.query(`
        DELETE FROM class_sessions
        WHERE id = $1
      `, [id]);

      return result.rowCount > 0
  }

    static async completeClass(id,status){
   const result = await pool.query(`
        UPDATE class_sessions 
        SET is_complete = $1 
        WHERE id = $2
      `, [status, id]);

      return result.rowCount > 0
  }

}

module.exports = ClassSession;
