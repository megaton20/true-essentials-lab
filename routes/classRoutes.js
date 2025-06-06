const router = require('express').Router();
const ClassSession = require('../models/ClassSession');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Attendance = require('../models/Attendance');
const { v4: uuidv4 } = require('uuid');



router.get('/:code', async (req, res) => {
    // error message
   const code = req.params.code
  const session = await ClassSession.findByJoinCode(code)
    if (!session) {
    return res.status(404).send('Session not found');
  }

  const sessionId = session.id


   if (!code.status) {
      req.flash('warning_msg', "class has not started")
        return res.redirect('/user')
     }
    
    // mark attendance
  const isPresent = await Attendance.markAttendance(sessionId, req.user.id, uuidv4());

  // console.log('Attendance record:', isPresent);

  // limit number of designs and rejoin

      res.render('./student/join', {
        link:session.meet_link,
        session
      })
});



// Admin creates a class
router.post('/create', admin, async (req, res) => {
  const { title, description, scheduledAt, meetLink } = req.body;
  const newClass = await ClassSession.create({ title, description, scheduledAt, meetLink, createdBy: req.userId });
  res.json(newClass);
});

// Admin toggles visibility of class link
router.post('/:id/toggle', admin, async (req, res) => {
  const { visible } = req.body;
  await ClassSession.toggleLinkVisibility(req.params.id, visible);
  res.json({ message: 'Visibility updated' });
});

// Student requests class link via join code
// router.get('/:joinCode/join', async (req, res) => {
//   const link = await ClassSession.getVisibleLink(req.params.joinCode);
//   if (!link) return res.status(403).json({ error: 'Class link not available yet' });
//   res.json({ meetLink: link });
// });

module.exports = router;
