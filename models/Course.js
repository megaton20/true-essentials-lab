const pool = require('../config/db');
const createTableIfNotExists = require('../utils/createTableIfNotExists');

class Course {
  // Auto-create table on class load
  static async init() {
    const createTableQuery = `
      CREATE TABLE courses (
        id VARCHAR PRIMARY KEY,
        category_id VARCHAR REFERENCES categories(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        teacher_id VARCHAR REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        price NUMERIC (10,2) DEFAULT 0 NOT NULL,
        takeaways JSONB DEFAULT '[]'::jsonb
      );
    `;

    await createTableIfNotExists('courses', createTableQuery);
  }

  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.teacher_id = data.teacher_id;
    this.price = data.price;
    this.created_at = data.created_at;
  }


static async create({ id, title, description, teacherId, category_id, price,takeawaysJson }) {
   let fee = 0.00
   if(price){
    fee = price
   }

  try {
    const result = await pool.query(
      `
      INSERT INTO courses (id, title, description, teacher_id, category_id, price, takeaways)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
      `,
      [id, title, description, teacherId, category_id, fee, takeawaysJson]
    );

    if (result.rows.length > 0) {
      return { success: true, message: 'Course created successfully.' };
    } else {
      return { success: false, message: 'Failed to create course.' };
    }

  } catch (error) {
    console.error('Error creating course:', error);
    return { success: false, message: 'An error occurred while creating the course.' };
  }
}


  static async update(id, { title, description, teacherId, category_id,price, takeawaysJson }) {

      let fee = 0.00
   if(price){
    fee = price
   }

    try {
      const result = await pool.query(
        `
        UPDATE courses
        SET title = $1, description = $2, teacher_id = $3, category_id = $4, takeaways = $5, price = $6
        WHERE id = $7
        RETURNING *;
        `,
        [title, description, teacherId,category_id,takeawaysJson, fee, id]
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

  static async listAllByCreator(userId) {
    
    try {
      const {rows:result} = await pool.query(`SELECT * FROM courses WHERE teacher_id = $1 ORDER BY created_at DESC;`, [userId]);
      return result || [];
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

      return result.rows[0];
    } catch (error) {
      console.error('Error finding course by ID:', error);
      return null;
    }
  }



  static async deleteCourse(id){
    const result = await pool.query(`
        DELETE FROM courses
        WHERE id = $1
      `, [id]);

      return result.rowCount > 0
  }

      static async findByCategory(categoryId) {
      const query = `
        SELECT * FROM courses
        WHERE category_id = $1
        ORDER BY created_at DESC;
      `;
      const { rows:result } = await pool.query(query, [categoryId]);
      return result || [];
    }


}

module.exports = Course;
