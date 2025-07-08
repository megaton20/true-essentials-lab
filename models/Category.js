const pool = require('../config/db');
const createTableIfNotExists = require('../utils/createTableIfNotExists');
const slugify = require('slugify');

class Category {
  // Auto-create table on class load
  static async init() {
    const createTableQuery = `
            CREATE TABLE categories (
          id VARCHAR PRIMARY KEY,
          name TEXT NOT NULL,
          details VARCHAR,
          icon TEXT DEFAULT 'fa fas-folder',
          slug TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await createTableIfNotExists('categories', createTableQuery);
  }

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.slug = data.slug;
    this.created_at = data.created_at;
  }

    // Create new category
  static async create(name, id, details, icon) {
    const slug = slugify(name, { lower: true, strict: true });
    const query = `
      INSERT INTO categories (name, slug,details, icon, id)
      VALUES ($1, $2,$3, $4,$5)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [name, slug,details,icon, id]);
    return rows[0];
  }

  // Get all categories
  static async all() {
    const query = `SELECT * FROM categories ORDER BY created_at DESC`;
    const { rows } = await pool.query(query);
    return rows;
  }

  // Get single category by ID
  static async findById(id) {
    const query = `SELECT * FROM categories WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  // Get single category by slug
  static async findBySlug(slug) {
    const query = `SELECT * FROM categories WHERE slug = $1`;
    const { rows } = await pool.query(query, [slug]);
    return rows[0] || null;
  }

      // Update category name (and slug)
      static async update(id, newName, details, icon) {
        const newSlug = slugify(newName, { lower: true, strict: true });
        const query = `
          UPDATE categories
          SET name = $1, slug = $2, details = $3, icon = $4
          WHERE id = $5
          RETURNING *;
        `;
        const { rows:result } = await pool.query(query, [newName, newSlug,details, icon, id]);
        return result[0];
      }


        // Delete category by ID
      static async delete(id) {
        const query = `DELETE FROM categories WHERE id = $1`;
        await pool.query(query, [id]);
        return true;
      }

      // Count how many courses use this category
      static async countCourses(id) {
        const query = `
          SELECT COUNT(*) FROM courses WHERE category_id = $1
        `;
        const { rows } = await pool.query(query, [id]);
        return parseInt(rows[0].count);
      }

  static async allWithCourses() {
  const query = `
    SELECT c.id AS category_id, c.name, c.icon, c.slug, c.created_at, co.id AS course_id, co.title, c.details
    FROM categories c
    LEFT JOIN courses co ON co.category_id = c.id
    ORDER BY c.created_at DESC;
  `;
  const { rows } = await pool.query(query);

  // Group into categories with embedded courses
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.category_id]) {
      grouped[row.category_id] = {
        id: row.category_id,
        name: row.name,
        slug: row.slug,
        icon: row.icon,
        details: row.details,
        created_at: row.created_at,
        courses: [],
        course_count: 0
      };
    }
    if (row.course_id) {
      grouped[row.category_id].courses.push({
        id: row.course_id,
        title: row.title
      });
      grouped[row.category_id].course_count++;
    }
  }

  return Object.values(grouped);
}



}

module.exports = Category