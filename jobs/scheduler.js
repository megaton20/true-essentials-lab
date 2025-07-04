const cron = require('node-cron');
const pool = require('../config/db');
const sendEmail = require('../utils/mailer');

const {
    dayBeforeTemplate,
    welcomeToClassTemplate,
    paymentReminderTemplate
} = require('../utils/templates');
const Season = require('../models/Season');

// 1️⃣ Daily @ 9AM – Class reminder for sessions scheduled tomorrow
cron.schedule('0 9 * * *', async () => {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);

    // 1. Get all sessions scheduled for tomorrow
    const { rows: sessions } = await pool.query(`
    SELECT title, scheduled_at, meet_link 
    FROM class_sessions
    WHERE scheduled_at >= $1 AND scheduled_at < $2
`, [tomorrow, nextDay]);

    // 2. Get all paid users
    const { rows: users } = await pool.query(`
  SELECT email, full_name FROM users WHERE has_paid = true
`);

    // 3. For each user, send an email with all the sessions
    if (sessions.length > 0) {
        for (let user of users) {

            await sendEmail(user.email, 'Class Reminder', dayBeforeTemplate(user, sessions));
        }
    }

});

// 2️⃣ Every 15 minutes – Send welcome email to new class joiners
cron.schedule('*/15 * * * *', async () => {
    const { rows } = await pool.query(`
    SELECT u.email, u.full_name, cs.title, cs.scheduled_at, cs.meet_link, ca.session_id, ca.user_id
    FROM class_attendance ca
    JOIN users u ON u.id = ca.user_id
    JOIN class_sessions cs ON cs.id = ca.session_id
    WHERE ca.is_joined = true AND ca.welcome_sent = false
  `);

    for (let row of rows) {
        await sendEmail(row.email, `Welcome to ${row.title}`, welcomeToClassTemplate(row, row));
        await pool.query(`
      UPDATE class_attendance
      SET welcome_sent = true
      WHERE session_id = $1 AND user_id = $2
    `, [row.session_id, row.user_id]);
    }

});

// 3️⃣ Every 5 days @ 10AM – Payment reminder to unpaid students
cron.schedule('0 10 */5 * *', async () => {
       const seasonRows = await Season.getCurrent()
       
    if (!seasonRows) return; // No active season

    
      const currentSeasonId = seasonRows.id;

    // 1. Check if payment is open
    const { rows: setting } = await pool.query(`
      SELECT is_payment_open FROM settings LIMIT 1
      `);
      
      if (setting[0]?.is_payment_open){
    
      // 3. Get users who haven't paid for this season
      const { rows: users } = await pool.query(`
        SELECT u.email, u.full_name
        FROM users u
        JOIN season_users us ON us.user_id = u.id
        WHERE us.season_id = $1
          AND us.has_paid = false
          AND u.role = 'student'
      `, [currentSeasonId]);

      // 4. Send email reminder
      for (let user of users) {
        await sendEmail(user.email, 'Complete Your Payment', paymentReminderTemplate(user));       
      }

      } ;

});

// every minute
cron.schedule('* * * * *', async () => {
  try {

    const a = await Season.deactivateExpired();
    
    await Season.activateCurrent();
  } catch (err) {
    console.error('[Season Job Error]', err);
  }
});

