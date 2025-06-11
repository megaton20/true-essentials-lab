const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');


exports.getDashboard = async (req, res) => {

   const sessions = await Attendance.studentClassHistory(req.user.id)
        
    res.render('./student/dashboard',{
        sessions,
        user:{name: req.user.full_name, email: req.user.email, payment:req.user.has_paid}
    })
}

exports.studentClassRecord = async (req, res) => {

   let sessions = await Attendance.studentClassHistory(req.user.id)

          sessions = sessions.map(session => {
  const now = new Date();
  const scheduled = new Date(session.scheduled_at);

  if (session.is_joined) {
    session.statusText = 'Attended'; // or whatever you want for joined classes
    session.statusClass = 'status-attended';
  } else if (scheduled > now) {
    session.statusText = 'Coming Up';
    session.statusClass = 'status-upcoming';
  } else if (session.status === true) {
    session.statusText = 'Attended';
    session.statusClass = 'status-attended';
  } else {
    session.statusText = 'Missed';
    session.statusClass = 'status-missed';
  }
  return session;
});

        
    res.render('./student/classes',{
        sessions,
        user:{name: req.user.full_name, email: req.user.email}
    })
}


exports.completePayment = async (req, res) => {
  const user = await User.getById(req.userId);
  const code = await ReferralCode.findByCode(user.referral_code);

  const eligible = code.current_uses < code.max_uses;
  const discount = eligible ? code.discount_percentage : 0;
  const paymentReference = req.body.reference; // from Paystack

  await User.markAsPaid(user.id, discount, paymentReference);

  if (eligible) await ReferralCode.incrementUsage(user.referral_code);

  res.json({ message: 'Payment complete. Dashboard unlocked.' });
};
