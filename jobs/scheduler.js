const cron = require('node-cron');
const pool = require('../config/db');
const sendEmail = require('../utils/mailer');
const Season = require('../models/Season');

const {
    dayBeforeTemplate,
    welcomeToClassTemplate,
    paymentReminderTemplate
} = require('../utils/templates');

// 1️⃣ Daily @ 9AM – Class reminder for sessions scheduled tomorrow
cron.schedule('0 9 * * *', async () => {
    try {
    // Step 1: Calculate tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayAfter = new Date(nextDay);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Step 2: Get sessions scheduled for tomorrow
    const { rows: sessions } = await pool.query(`
      SELECT title, scheduled_at, meet_link 
      FROM class_sessions
      WHERE scheduled_at >= $1 AND scheduled_at < $2
    `, [nextDay, dayAfter]);

    if (sessions.length === 0) return;

    // Step 3: Get current season
    const season = await Season.getCurrent();
    if (!season) return;
    const currentSeasonId = season.id;

    // Step 4: Get users who have paid for this season
    const { rows: users } = await pool.query(`
      SELECT u.email, u.full_name 
      FROM users u
      JOIN season_users su ON su.user_id = u.id
      WHERE su.season_id = $1 AND su.has_paid = true
    `, [currentSeasonId]);

    // Step 5: Send reminders
    for (const user of users) {
      await sendEmail(user.email, 'Class Reminder', dayBeforeTemplate(user, sessions));
    }

    console.log(`Class reminder sent to ${users.length} users.`);
  } catch (err) {
    console.error('Error in class reminder cron:', err);
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

// payment reminder in five days
cron.schedule('0 10 */5 * *', async () => {
  try {
    // 1. Get current season
    const season = await Season.getCurrent();
    if (!season) return;

    const currentSeasonId = season.id;

    // 2. Check if payment is open
    const { rows: setting } = await pool.query(`
      SELECT is_payment_open FROM settings LIMIT 1
    `);
    if (!setting[0]?.is_payment_open) return;

    // 3. Get unpaid students for current season
    const { rows: users } = await pool.query(`
      SELECT u.email, u.full_name
      FROM users u
      JOIN season_users us ON us.user_id = u.id
      WHERE us.season_id = $1
        AND us.has_paid = false
        AND u.role = 'student'
    `, [currentSeasonId]);

    // 4. Send email reminder to each user
    for (const user of users) {
      await sendEmail(
        user.email,
        'Complete Your Payment',
        paymentReminderTemplate(user)
      );
    }

    console.log(`Payment reminders sent to ${users.length} users.`);
  } catch (err) {
    console.error('Error running payment reminder cron job:', err);
  }
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

