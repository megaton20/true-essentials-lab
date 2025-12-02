const cron = require('node-cron');
const pool = require('../config/db');
const sendEmail = require('../utils/mailer');

const {
    dayBeforeTemplate,
    welcomeToClassTemplate,
    paymentReminderTemplate,
    dayReminderTemplate
} = require('../utils/templates');



const todayReminder = async ()=>{
    try {
    // Get all sessions for tomorrow
    const { rows: sessions } = await pool.query(`
      SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.scheduled_at,
        cs.meet_link,
        cs.course_id
      FROM class_sessions cs
      WHERE DATE(cs.scheduled_at) = CURRENT_DATE + INTERVAL '0 days'
      AND cs.status = TRUE
      ORDER BY cs.scheduled_at
    `);

    if (sessions.length === 0) {
      console.log('No sessions found for tomorrow at 7 AM check');
      return;
    }

    sessions.forEach(session => {
      console.log(`   - ${session.title} (${new Date(session.scheduled_at).toISOString()})`);
    });

    // Get ALL enrolled users for ALL sessions first
    const userSessions = {};
    
    for (let session of sessions) {
      const { rows: enrolledUsers } = await pool.query(`
        SELECT 
          u.id,
          u.email,
          u.full_name,
          e.enrolled_at
        FROM enrollment e
        JOIN users u ON u.id = e.user_id
        WHERE e.course_id = $1
        AND e.paid = true
      `, [session.course_id]);

      
      console.log(`Session "${session.title}" has ${enrolledUsers.length} enrolled users`);

      if (enrolledUsers.length === 0) {
        console.log(`No enrolled users found for session: ${session.title}`);
        continue;
      }

      
      // Add sessions to each user
      enrolledUsers.forEach(user => {
        if (!userSessions[user.id]) {
          userSessions[user.id] = {
            user: { email: user.email, full_name: user.full_name },
            sessions: []
          };
        }
        userSessions[user.id].sessions.push(session);
      });
    }

    // Now send ONE email per user with ALL their sessions
    for (let userId in userSessions) {
      const { user, sessions: userSessionsList } = userSessions[userId];
      
      try {
        await sendEmail(
          user.email, 
          `Upcoming Class${userSessionsList.length > 1 ? 'es' : ''} Reminder`,
          dayReminderTemplate(user, userSessionsList)
        );
        
        console.log(`Sent reminder to ${user.email} for ${userSessionsList.length} session(s)`);
      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError.message);
      }
    }

    console.log(`7 AM Reminders completed. Sent ${Object.keys(userSessions).length} emails for ${sessions.length} session(s)`);
  } catch (error) {
    console.error('Error in 7 AM day-before reminder cron:', error.message);
  }
}
const joinedNotifier = async ()=>{
     const { rows } = await pool.query(`
    SELECT u.email, u.full_name, cs.title, cs.scheduled_at, cs.meet_link, ca.session_id, ca.user_id
    FROM class_attendance ca
    JOIN users u ON u.id = ca.user_id
    JOIN class_sessions cs ON cs.id = ca.session_id
    WHERE ca.is_joined = true AND ca.welcome_sent = false
  `);

    for (let row of rows) {
        await sendEmail(row.email, `Welcome to ${row.title}`, 
          welcomeToClassTemplate(row, row));
        await pool.query(`
      UPDATE class_attendance
      SET welcome_sent = true
      WHERE session_id = $1 AND user_id = $2
    `, [row.session_id, row.user_id]);
    }
}
const allSessionForTomorrow = async ()=>{
    try {
    // Get all sessions for tomorrow
    const { rows: sessions } = await pool.query(`
      SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.scheduled_at,
        cs.meet_link,
        cs.course_id
      FROM class_sessions cs
      WHERE DATE(cs.scheduled_at) = CURRENT_DATE + INTERVAL '1 days'
      AND cs.status = TRUE
      ORDER BY cs.scheduled_at
    `);

    if (sessions.length === 0) {
      console.log('No sessions found for tomorrow at 7 AM check');
      return;
    }

    sessions.forEach(session => {
      console.log(`   - ${session.title} (${new Date(session.scheduled_at).toISOString()})`);
    });

    // Get ALL enrolled users for ALL sessions first
    const userSessions = {};
    
    for (let session of sessions) {
      const { rows: enrolledUsers } = await pool.query(`
        SELECT 
          u.id,
          u.email,
          u.full_name,
          e.enrolled_at
        FROM enrollment e
        JOIN users u ON u.id = e.user_id
        WHERE e.course_id = $1
        AND e.paid = true
      `, [session.course_id]);

      console.log(`Session "${session.title}" has ${enrolledUsers.length} enrolled users`);

      if (enrolledUsers.length === 0) {
        console.log(`No enrolled users found for session: ${session.title}`);
        continue;
      }

      // Add sessions to each user
      enrolledUsers.forEach(user => {
        if (!userSessions[user.id]) {
          userSessions[user.id] = {
            user: { email: user.email, full_name: user.full_name },
            sessions: []
          };
        }
        userSessions[user.id].sessions.push(session);
      });
    }

    // Now send ONE email per user with ALL their sessions
    for (let userId in userSessions) {
      const { user, sessions: userSessionsList } = userSessions[userId];
      
      try {
        await sendEmail(
          user.email, 
          `Upcoming Class${userSessionsList.length > 1 ? 'es' : ''} Reminder`,
          dayBeforeTemplate(user, userSessionsList)
        );
        
        console.log(`Sent reminder to ${user.email} for ${userSessionsList.length} session(s)`);
      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError.message);
      }
    }

    console.log(`7 AM Reminders completed. Sent ${Object.keys(userSessions).length} emails for ${sessions.length} session(s)`);
  } catch (error) {
    console.error('Error in 7 AM day-before reminder cron:', error.message);
  }
}


// 2️⃣ Every 5 minutes – Send welcome email to new class joiners
cron.schedule('*/5 * * * *', async () => {
 await joinedNotifier()

});

// Every day at 7 AM
cron.schedule('0 7 * * *', async () => {
await allSessionForTomorrow()
});


// // manual runner
// cron.schedule('* * * * *', async () => {
//   console.log("running 1 minu");
  
// //  await todayReminder()
// });


