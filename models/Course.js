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
        difficulty VARCHAR DEFAULT 'easy',
        image_url VARCHAR,
        is_open BOOLEAN DEFAULT FALSE,
        teacher_id VARCHAR REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        price NUMERIC (10,2) DEFAULT 0 NOT NULL,
        takeaways JSONB DEFAULT '[]'::jsonb
      );
    `;
    const createCourseLike = `
    CREATE TABLE course_likes (
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id)
);

`

    await createTableIfNotExists('course_likes', createCourseLike);

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


static async create({ id, title, description, teacherId, category_id, price,level, takeawaysJson }) {
   let fee = 0.00
   if(price){
    fee = price
   }

  try {
    const result = await pool.query(
      `
      INSERT INTO courses (id, title, description, teacher_id, category_id, price, takeaways, difficulty)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
      `,
      [id, title, description, teacherId, category_id, fee, takeawaysJson, level]
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


  static async update(id, { title, description, teacherId, category_id,price,level, takeawaysJson }) {

      let fee = 0.00
        if(price){
          fee = price
        }

    try {
      const result = await pool.query(
        `
        UPDATE courses
        SET title = $1, description = $2, teacher_id = $3, category_id = $4, takeaways = $5, price = $6, difficulty = $7
        WHERE id = $8
        RETURNING *;
        `,
        [title, description, teacherId,category_id,takeawaysJson, fee,level, id]
      );

      return new Course(result.rows[0]);
    } catch (error) {
      console.error('Error updating course:', error);
      return null;
    }
  }

  static async listAll() {
    try {
      const {rows:result} = await pool.query(
        `SELECT * FROM courses ORDER BY created_at DESC;`
      );      

        result.sort((a,b) =>{
      if(a.is_openis_open === b.is_open) return 0;
      return a.is_open ? -1 : 1 
     })

      return result || []
    } catch (error) {
      console.error('Error listing all courses:', error);
      return [];
    }
  }

  static async listAllByCreator(userId) {
    
    try {
      const {rows:result} = await pool.query(`SELECT * FROM courses WHERE teacher_id = $1 ORDER BY created_at DESC;`, [userId]);
       result.sort((a,b) =>{
      if(a.is_openis_open === b.is_open) return 0;
      return a.is_open ? -1 : 1 
     })

      return result || [];
    } catch (error) {
      console.error('Error listing all courses:', error);
      return [];
    }
  }


  static async findById(id) {
try {
  const result = await pool.query(
    `SELECT 
       c.*,
       JSON_AGG(
         JSON_BUILD_OBJECT(
           'user_id', u.id,
           'user_name', u.full_name,
           'user_email', u.email,
           'enrolled_at', e.enrolled_at,
           'paid', e.paid
         )
       ) as enrolled_users
     FROM courses c
     LEFT JOIN enrollment e ON c.id = e.course_id
     LEFT JOIN users u ON e.user_id = u.id
     WHERE c.id = $1
     GROUP BY c.id;`,
    [id]
  );
  
  if (result.rows.length === 0) return null;
  return result.rows[0];
} catch (error) {
  console.error('Error finding course with enrolled users:', error);
  return null;
}
  }

  static async findFree() {
    try {
      const {rows:result} = await pool.query(
        `SELECT 
          c.*, 
          COALESCE(l.like_count, 0) AS like_count,
          COALESCE(e.enrolled_count, 0) AS enrolled_count
        FROM courses c
        LEFT JOIN (
          SELECT course_id, COUNT(*) AS like_count
          FROM course_likes
          GROUP BY course_id
        ) l ON l.course_id = c.id
        LEFT JOIN (
          SELECT course_id, COUNT(*) AS enrolled_count
          FROM enrollment
          GROUP BY course_id
        ) e ON e.course_id = c.id
        WHERE c.price <= 0 LIMIT 10;

        `);

             result.sort((a,b) =>{
      if(a.is_openis_open === b.is_open) return 0;
      return a.is_open ? -1 : 1 
     })

      return result;
    } catch (error) {
      console.error('Error finding free course:', error);
      return null;
    }
  }

  

  static async allFreeCourses() {
    try {
      const {rows:result} = await pool.query(
        `SELECT 
          c.*, 
          COALESCE(l.like_count, 0) AS like_count,
          COALESCE(e.enrolled_count, 0) AS enrolled_count
        FROM courses c
        LEFT JOIN (
          SELECT course_id, COUNT(*) AS like_count
          FROM course_likes
          GROUP BY course_id
        ) l ON l.course_id = c.id
        LEFT JOIN (
          SELECT course_id, COUNT(*) AS enrolled_count
          FROM enrollment
          GROUP BY course_id
        ) e ON e.course_id = c.id
        WHERE c.price <= 0;

        `);
             result.sort((a,b) =>{
      if(a.is_openis_open === b.is_open) return 0;
      return a.is_open ? -1 : 1 
     })

      return result;
    } catch (error) {
      console.error('Error finding free course:', error);
      return null;
    }
  }


  static async getCourseDetails(id) {
    try {
        const { rows: result } = await pool.query(
          `SELECT 
            c.*, 
            u.full_name AS teacher_name,
            COALESCE(l.like_count, 0) AS like_count,
            COALESCE(e.enrolled_count, 0) AS enrolled_count
          FROM courses c
          LEFT JOIN users u ON c.teacher_id = u.id
          LEFT JOIN (
            SELECT course_id, COUNT(*) AS like_count
            FROM course_likes
            GROUP BY course_id
          ) l ON l.course_id = c.id
          LEFT JOIN (
            SELECT course_id, COUNT(*) AS enrolled_count
            FROM enrollment
            GROUP BY course_id
          ) e ON e.course_id = c.id
          WHERE c.id = $1
          LIMIT 1;`,
          [id]
        );

      return result[0] || [];
    } catch (error) {
      console.error('Error finding free course:', error);
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
           result.sort((a,b) =>{
      if(a.is_openis_open === b.is_open) return 0;
      return a.is_open ? -1 : 1 
     })

      return result || [];
    }

    static async listAllWithCategory() {
      const query = `
        SELECT c.*, cat.name AS category_name
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        ORDER BY cat.name, c.created_at DESC;
      `;
      const { rows } = await pool.query(query);
      
      return rows;
    }


  static async toggleCourseOpen(id, visible) {
   try {
     const result = await pool.query(`UPDATE courses SET is_open = $1 WHERE id = $2`, [visible, id]);
     
    return result.rowCount
   } catch (error) {

    console.log(error);
    
     console.log(`error in toggle func`);
    return null
    
   }
  }

}

module.exports = Course;
