const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const pool = require('../config/db');
const SeasonUser = require('../models/SeasonUsers');
const Season = require('../models/Season');
const Course = require('../models/Course');


exports.getDashboard = async (req, res) => {
  const userId = req.user.id;
  const customerToPay = 30000;


  const currentSeason = await Season.getCurrent();
  const userSeason = await SeasonUser.get(userId, currentSeason.id);

  // check if user don pay
  req.user = {
    ...req.user,
    seasonInfo: userSeason
  };

  // Fetch all courses under the current season
  const courses = await Course.listAllBySeason(currentSeason.id);
  res.render('./student/dashboard', {
    courses,
    user: req.user,
    customerToPay,
    ebooks: [],
  });
};


exports.getCourseSchedule = async (req, res) => {
const customerToPay = 30000;
 const thisSeasonUser = await SeasonUser.getSeasonsForUser(req.user.id)

 
  let sessions = await ClassSession.listByCourse(req.params.id)
 
  const sessionIds = sessions.map(s => s.id);
  
    const attendance = await Attendance.getBySessionIds(req.user.id, sessionIds);

    const updatedSessions = sessions.map(session => ({
    ...session,
    is_joined: attendance[session.id] || false,
  }));

  
  const currentSeason = await Season.getCurrent();
  const userSeason = await SeasonUser.get(req.user.id, currentSeason.id);


  req.user = {
    ...req.user,
    has_paid:thisSeasonUser[0].has_paid,
    seasonInfo:userSeason
  }

  res.render('./student/classes', {
    sessions:updatedSessions,
    user: req.user,
    customerToPay
  });
};


exports.getCourseForSeason= async (req, res) => {
    const userId = req.user.id;
    const customerToPay = 30000;
    
    const currentSeason = await Season.getCurrent()
    const sessions = await Attendance.studentClassHistory(userId, currentSeason.id);
    const userSeason = await SeasonUser.get(userId, currentSeason.id);

            req.user = {
        ...req.user,       // keep existing user info
        seasonInfo: userSeason  // add extra season-related info under a new key
        };
   
    
    // Get referrer who referred this user 
    const referrerQuery = await pool.query(
        `SELECT referrer_id FROM referral_redemptions WHERE referred_user_id = $1 LIMIT 1`,
        [req.user.id]
    );

    const affiliateId = referrerQuery.rows[0]?.referrer_id || null;

    let affiliateAgent = null;

    if (affiliateId) {
        const afiliateRecord = await pool.query(
            `SELECT user_id FROM referrers WHERE id = $1 LIMIT 1`,
            [affiliateId]
        );

        affiliateAgent = afiliateRecord.rows[0]?.user_id || null;
    }

    res.render('./student/dashboard', {
        sessions,
        user: req.user,
        customerToPay,
        affiliateAgent,
        ebooks:[]
    });

};

exports.studentClassRecord = async (req, res) => {
    const userId = req.user.id;
 const currentSeason = await Season.getCurrent()
 
 const courseID = await Course.findById(req.params.id)

    const sessions = await Attendance.studentClassHistory(req.user.id, courseID.id)
      const userSeason = await SeasonUser.get(userId, currentSeason.id);

            req.user = {
        ...req.user,       // keep existing user info
        seasonInfo: userSeason  // add extra season-related info under a new key
        };
    res.render('./student/classes', {
        sessions,
        user: req.user
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
