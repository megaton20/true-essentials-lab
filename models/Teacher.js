const pool = require('../config/db');
const createTableIfNotExists = require('../utils/createTableIfNotExists');
const { v4: uuidv4 } = require('uuid');


class Teacher {
  // Auto-create table on class load
  static async init() {
    const createTableQuery = `
              CREATE TABLE teachers (
                id VARCHAR PRIMARY KEY,
                about TEXT,
                user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                profile_picture TEXT,
                specialization VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              );
         `;
         const createTeacherToCourse = `
         CREATE TABLE teacher_courses (
          teacher_id VARCHAR REFERENCES teachers(id) ON DELETE CASCADE,
          course_id VARCHAR REFERENCES courses(id) ON DELETE CASCADE,
          PRIMARY KEY (teacher_id, course_id)
        );

         `

         await createTableIfNotExists('teachers', createTableQuery);
         await createTableIfNotExists('teacher_courses', createTeacherToCourse);
  }

  constructor(data) {
    this.id = data.id;
    this.about = data.about;
    this.user_id = data.user_id;
    this.profile_picture = data.profile_picture;
    this.specialization = data.specialization;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }




      static async create({ specialization, user_id  }) {
        const query = `
          INSERT INTO teachers (id, user_id, specialization)
          VALUES ($1, $2, $3)
          RETURNING *;
        `;
        const values = [uuidv4(), user_id, specialization];

        await pool.query(`UPDATE users SET role = $1 WHERE id = $2`, ['teacher', user_id]);


        const { rows } = await pool.query(query, values);
        return rows.length > 0; 
      }


      // assign course to treat
    static async assign({ course_id, teacher_id }) {
      const query = `
        INSERT INTO teacher_courses (teacher_id, course_id)
        VALUES ($1, $2)
        ON CONFLICT (teacher_id, course_id) DO NOTHING
        RETURNING *;
      `;
      const values = [teacher_id, course_id];
      const { rows } = await pool.query(query, values);
      return rows.length > 0; // true if inserted, false if already existed
    }




  static async findTeacher(id) {
    const { rows:result } = await pool.query(`SELECT * FROM teachers WHERE id = $1`, [id]);
    return result[0] ;
  }
  
  static async findById(id) {
    const { rows } = await pool.query(`SELECT * FROM teachers WHERE id = $1`, [id]);
    return rows[0] || [];
  }

  static async findAll() {
    const { rows } = await pool.query(`SELECT * FROM teachers ORDER BY created_at DESC`);
    return rows;
  }

  static async update(id, fields) {
    const columns = Object.keys(fields);
    const updates = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    const values = Object.values(fields);
    values.push(id);

    const query = `UPDATE teachers SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`;
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async deactivate(id) {
    const { rows } = await pool.query(
      `UPDATE teachers SET is_active = FALSE WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0];
  }

  static async delete(id) {
    await pool.query(`DELETE FROM teachers WHERE id = $1`, [id]);
    return true;
  }
}

module.exports = Teacher;
