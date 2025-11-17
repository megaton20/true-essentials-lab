const pool = require('../config/db');
const createTableIfNotExists = require('../utils/createTableIfNotExists');
const slugify = require('slugify');

class Webinar {
  // Auto-create table on class load
  static async init() {
    const createTableQuery = `
      CREATE TABLE webinars (
        id VARCHAR PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        presenter_name TEXT NOT NULL,
        presenter_credentials TEXT,
        scheduled_date TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        max_attendees INTEGER,
        meeting_url TEXT,
        recording_url TEXT,
        status TEXT DEFAULT 'scheduled', -- scheduled, live, completed, cancelled
        thumbnail_url TEXT,
        slug TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await createTableIfNotExists('webinars', createTableQuery);
    
    const webinar_registrations = `
    CREATE TABLE webinar_registrations (
      id VARCHAR PRIMARY KEY,
      webinar_id VARCHAR REFERENCES webinars(id) ON DELETE CASCADE,
      user_id VARCHAR REFERENCES users(id),
      registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      attended BOOLEAN DEFAULT FALSE
      );
      `;
      
      await createTableIfNotExists('webinar_registrations', webinar_registrations);

        const webinar_takeaways = `
   CREATE TABLE webinar_takeaways (
        id VARCHAR PRIMARY KEY,
        webinar_id VARCHAR REFERENCES webinars(id) ON DELETE CASCADE,
        point TEXT NOT NULL,
        display_order INTEGER DEFAULT 0
        );
    `;


        await createTableIfNotExists('webinar_takeaways', webinar_takeaways);
  }

  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.presenter_name = data.presenter_name;
    this.presenter_credentials = data.presenter_credentials;
    this.scheduled_date = data.scheduled_date;
    this.duration_minutes = data.duration_minutes;
    this.max_attendees = data.max_attendees;
    this.meeting_url = data.meeting_url;
    this.recording_url = data.recording_url;
    this.status = data.status;
    this.thumbnail_url = data.thumbnail_url;
    this.slug = data.slug;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new webinar
  static async create(webinarData) {
    const slug = slugify(webinarData.title, { lower: true, strict: true });
    const query = `
      INSERT INTO webinars (
        id, title, description, presenter_name, presenter_credentials,
        scheduled_date, duration_minutes, max_attendees, meeting_url,
        recording_url, status, thumbnail_url, slug
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const values = [
      webinarData.id,
      webinarData.title,
      webinarData.description,
      webinarData.presenter_name,
      webinarData.presenter_credentials,
      webinarData.scheduled_date,
      webinarData.duration_minutes || 60,
      webinarData.max_attendees,
      webinarData.meeting_url,
      webinarData.recording_url,
      webinarData.status || 'scheduled',
      webinarData.thumbnail_url,
      slug
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Get all webinars
  static async all() {
    const query = `SELECT * FROM webinars ORDER BY scheduled_date DESC`;
    const { rows } = await pool.query(query);
    return rows;
  }

  // Get single webinar by ID
  static async findById(id) {
    const query = `SELECT * FROM webinars WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  // Get single webinar by slug
  static async findBySlug(slug) {
    const query = `SELECT * FROM webinars WHERE slug = $1`;
    const { rows } = await pool.query(query, [slug]);
    return rows[0] || null;
  }

  // Update webinar
  static async update(id, updateData) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query based on provided fields
    if (updateData.title) {
      updates.push(`title = $${paramCount}`);
      values.push(updateData.title);
      paramCount++;
    }
    if (updateData.description) {
      updates.push(`description = $${paramCount}`);
      values.push(updateData.description);
      paramCount++;
    }
    if (updateData.presenter_name) {
      updates.push(`presenter_name = $${paramCount}`);
      values.push(updateData.presenter_name);
      paramCount++;
    }
    if (updateData.presenter_credentials) {
      updates.push(`presenter_credentials = $${paramCount}`);
      values.push(updateData.presenter_credentials);
      paramCount++;
    }
    if (updateData.scheduled_date) {
      updates.push(`scheduled_date = $${paramCount}`);
      values.push(updateData.scheduled_date);
      paramCount++;
    }
    if (updateData.duration_minutes) {
      updates.push(`duration_minutes = $${paramCount}`);
      values.push(updateData.duration_minutes);
      paramCount++;
    }
    if (updateData.max_attendees) {
      updates.push(`max_attendees = $${paramCount}`);
      values.push(updateData.max_attendees);
      paramCount++;
    }
    if (updateData.meeting_url) {
      updates.push(`meeting_url = $${paramCount}`);
      values.push(updateData.meeting_url);
      paramCount++;
    }
    if (updateData.recording_url) {
      updates.push(`recording_url = $${paramCount}`);
      values.push(updateData.recording_url);
      paramCount++;
    }
    if (updateData.status) {
      updates.push(`status = $${paramCount}`);
      values.push(updateData.status);
      paramCount++;
    }
    if (updateData.thumbnail_url) {
      updates.push(`thumbnail_url = $${paramCount}`);
      values.push(updateData.thumbnail_url);
      paramCount++;
    }

    // Update slug if title changed
    if (updateData.title) {
      const newSlug = slugify(updateData.title, { lower: true, strict: true });
      updates.push(`slug = $${paramCount}`);
      values.push(newSlug);
      paramCount++;
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);

    const query = `
      UPDATE webinars
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *;
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Delete webinar by ID
  static async delete(id) {
    const query = `DELETE FROM webinars WHERE id = $1`;
    await pool.query(query, [id]);
    return true;
  }

  // Count how many attendees registered for this webinar
  static async countAttendees(id) {
    const query = `
      SELECT COUNT(*) FROM webinar_registrations WHERE webinar_id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return parseInt(rows[0].count);
  }

  // Get webinars with attendee count
  static async allWithAttendeeCount() {
    const query = `
      SELECT 
        w.*,
        COUNT(wr.id) as attendee_count
      FROM webinars w
      LEFT JOIN webinar_registrations wr ON wr.webinar_id = w.id
      GROUP BY w.id
      ORDER BY w.scheduled_date DESC;
    `;

    const { rows } = await pool.query(query);
    return rows.map(row => ({
      ...row,
      attendee_count: parseInt(row.attendee_count)
    }));
  }

  // Get upcoming webinars
  static async upcoming(limit = 10) {
    const query = `
      SELECT * FROM webinars 
      WHERE scheduled_date > CURRENT_TIMESTAMP 
      AND status = 'scheduled'
      ORDER BY scheduled_date ASC 
      LIMIT $1;
    `;
    const { rows } = await pool.query(query, [limit]);
    return rows;
  }

  // Get past webinars
  static async past(limit = 10) {
    const query = `
      SELECT * FROM webinars 
      WHERE scheduled_date <= CURRENT_TIMESTAMP 
      AND status = 'completed'
      ORDER BY scheduled_date DESC 
      LIMIT $1;
    `;
    const { rows } = await pool.query(query, [limit]);
    return rows;
  }

  // Update webinar status
  static async updateStatus(id, status) {
    const query = `
      UPDATE webinars 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [status, id]);
    return rows[0];
  }
}

module.exports = Webinar;