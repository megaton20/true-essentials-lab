const router = require('express').Router();
const ClassSession = require('../models/ClassSession');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Attendance = require('../models/Attendance');
const { v4: uuidv4 } = require('uuid');



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
     
    // mark attendance
  const isPresent = await Attendance.markAttendance(sessionId, req.user.id, uuidv4());
      res.render('./student/join', {
        link:session.meet_link,
        session,
        user:req.user
      })
});




module.exports = router;
