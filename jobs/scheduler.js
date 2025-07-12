const cron = require('node-cron');
const pool = require('../config/db');
const sendEmail = require('../utils/mailer');

const {
    dayBeforeTemplate,
    welcomeToClassTemplate,
    paymentReminderTemplate
} = require('../utils/templates');




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



