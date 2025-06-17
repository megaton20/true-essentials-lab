const router = require('express').Router();
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const { v4: uuidv4 } = require('uuid');
const Season = require('../models/Season');
const SeasonUser = require('../models/SeasonUsers');
const sendEmail = require('../utils/mailer');
const { welcomeToClassTemplate } = require('../utils/templates');
const pool = require('../config/db');


router.get('/:code/:id', async (req, res) => {
    // error message
   const code = req.params.code
   const sessionId = req.params.id
  
  const session = await ClassSession.findByJoinCode(code)
    if (!session) {
        req.flash('warning_msg', "Session not found")
        return res.redirect('/user')
  }

   if (!session.status) {
      req.flash('warning_msg', "class has not started")
        return res.redirect('/user')
     }

       const currentSeason = await Season.getCurrent();
  const userSeason = await SeasonUser.get(req.user.id, currentSeason.id);

  // check if user don pay
  req.user = {
    ...req.user,
    seasonInfo: userSeason
  };
     
    // mark attendance
  const isPresent = await Attendance.markAttendance(sessionId, req.user.id, uuidv4());
     
      const { rows } = await pool.query(`
        SELECT u.email, u.full_name, cs.title, cs.scheduled_at, cs.meet_link, ca.session_id, ca.user_id
        FROM class_attendance ca
        JOIN users u ON u.id = ca.user_id
        JOIN class_sessions cs ON cs.id = ca.session_id
        WHERE ca.is_joined = true AND ca.welcome_sent = false AND ca.user_id = $1
        LIMIT 1
      `, [req.user.id]);

      if (rows.length > 0) {
        const row = rows[0];

        await sendEmail(
          row.email,
          `Welcome to ${row.title}`,
          welcomeToClassTemplate(row, row) // assuming template uses full session & user info from `row`
        );

        await pool.query(`
          UPDATE class_attendance
          SET welcome_sent = true
          WHERE user_id = $1 AND session_id = $2
        `, [row.user_id, row.session_id]);
      }


  res.render('./student/join', {
        link:session.meet_link,
        session,
        user:req.user
      })
});




module.exports = router;
