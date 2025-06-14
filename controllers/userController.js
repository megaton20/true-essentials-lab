const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const pool = require('../config/db');



exports.getDashboard = async (req, res) => {
    const userId = req.user.id;
    const sessions = await Attendance.studentClassHistory(userId);
    const customerToPay = 30000;


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

    const sessions = await Attendance.studentClassHistory(req.user.id)
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
