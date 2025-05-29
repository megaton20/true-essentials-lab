const router = require('express').Router();
const admin = require('../controllers/adminController');
const adminMiddleware = require('../middleware/admin');

router.post('/referral', adminMiddleware, admin.createReferral);
router.post('/setting', adminMiddleware, admin.toggleSetting);

router.get('/session/:id/attendance', admin, async (req, res) => {
  const data = await Attendance.getAttendanceForSession(req.params.id);
  res.json(data);
});


module.exports = router;
