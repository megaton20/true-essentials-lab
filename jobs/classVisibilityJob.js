const cron = require('node-cron');
const pool = require('../config/db');

// Run every minute
cron.schedule('* * * * *', async () => {
  const now = new Date();

  await pool.query(`
    UPDATE class_sessions
    SET show_link = TRUE
    WHERE scheduled_at <= $1 AND show_link = FALSE
  `, [now]);

  console.log('Checked and updated class session visibility');
});
