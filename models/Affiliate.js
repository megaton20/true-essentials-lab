
const nodemailer = require('nodemailer')
const createTableIfNotExists = require('../utils/createTableIfNotExists');
const pool = require('../config/db')
const { v4: uuidv4 } = require('uuid');
const User = require('./User');
 
 
 class Affiliate {
//   constructor(data) {
//     Object.assign(this, data);
//   }
 
    static async init(){
        
    const affiliateApplicationTable = `
            CREATE TABLE affiliate_applications (
                id VARCHAR PRIMARY KEY,
                user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                application_text TEXT,
                ref_source TEXT,
                experience VARCHAR,
                status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
                reviewed_by VARCHAR REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP
            );

    `;
    const referrersTable = `
                CREATE TABLE referrers (
            id VARCHAR PRIMARY KEY,
            user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            referral_code VARCHAR(20) UNIQUE NOT NULL,
            max_redemptions INTEGER DEFAULT NULL, -- NULL means unlimited
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const redemptionTable = `
            CREATE TABLE referral_redemptions (
            id VARCHAR PRIMARY KEY,
            referrer_id VARCHAR NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
            referred_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            redeemed_at TIMESTAMP DEFAULT NULL,
            has_earned BOOLEAN DEFAULT FALSE
        );

        `;

        const payoutTable = `
        CREATE TABLE affiliate_payouts (
            id VARCHAR PRIMARY KEY,
            user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            total_referrals INTEGER NOT NULL,
            amount NUMERIC NOT NULL DEFAULT 0, -- always 5000 * total_referrals
            status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid'
            requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            paid_at TIMESTAMP
        );

`;
    await createTableIfNotExists('affiliate_applications', affiliateApplicationTable);
    await createTableIfNotExists('referrers', referrersTable);
    await createTableIfNotExists('referral_redemptions', redemptionTable);
    await createTableIfNotExists('affiliate_payouts', payoutTable);
    
  }

 // Apply to be an affiliate
  static async applyAsAffiliate(userId, refSource, experience, whyJoin) {
    const existing = await pool.query(
      'SELECT * FROM affiliate_applications WHERE user_id = $1 AND status = $2',
      [userId, 'pending']
    );

    if (existing.rows.length > 0) {
      throw new Error('You already have a pending application.');
    }

   const result =  await pool.query(
      `INSERT INTO affiliate_applications (user_id, ref_source, experience, application_text, id) VALUES ($1, $2, $3, $4, $5)`,
      [userId, refSource, experience, whyJoin, uuidv4()]
    );

    return result.rowCount

  }
 

  // all pending applications alone
  static async getAllApplications() {
    const result = await pool.query('SELECT * FROM affiliate_applications ');
    return result.rows
  }

static async getApplicationById(applicationId) {
  const res = await pool.query(`
    SELECT 
      ap.*, 
      u.id AS user_id, 
      u.full_name, 
      u.email, 
      u.is_affiliate
    FROM affiliate_applications ap
    JOIN users u ON ap.user_id = u.id
    WHERE ap.id = $1
  `, [applicationId]);

  return res.rows[0]; 
}


  static async getAffiliateByUserId(userId) {
    const isAffiliate = await pool.query('SELECT * FROM referrers WHERE user_id = $1',[userId]);
  
    return  isAffiliate
  }

  static async getPendingApplications() {
    const result = await pool.query(
      'SELECT * FROM affiliate_applications WHERE status = $1',['pending']
    );

    return result.rows

  }


  // Admin approves application

static async approveAffiliate(applicationId, status, adminId, userId) {
  try {
    const user = await User.getById(userId);

    if (!user) throw new Error("User not found");

    // Update user's affiliate flag
    await pool.query(
      `UPDATE users SET is_affiliate = $1 WHERE id = $2`,
      [status === 'approved', userId]
    );

    // Update the application status
    await pool.query(
      `UPDATE affiliate_applications
       SET status = $1, reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $3`,
      [status, adminId, applicationId]
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Only handle referral setup if approved
    if (status === 'approved') {
      const isReferrer = await Affiliate.getAffiliateByUserId(userId);

      let referralCode;
      if (isReferrer.rows.length === 0) {
        referralCode = uuidv4().split('-')[0];
        await pool.query(
          `INSERT INTO referrers (user_id, referral_code, id) VALUES ($1, $2, $3)`,
          [userId, referralCode, uuidv4()]
        );
      } else {
        referralCode = isReferrer.rows[0].referral_code;
      }

      const referralLink = `${process.env.LIVE_DIRR || 'http://localhost:' + process.env.PORT}/auth/register/${referralCode}`;

      // Send approval email
      await transporter.sendMail({
        from: { name: "TEA", address: process.env.EMAIL },
        to: user.email,
        subject: 'You’ve been approved as an Affiliate!',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Hi ${user.name || ''},</h2>
            <p>We’re excited to let you know that your affiliate application has been <strong>approved</strong>! 🎉</p>
            <p>Here’s your unique referral link:</p>
            <p><a href="${referralLink}" style="color: #2b6cb0;">${referralLink}</a></p>
            <p>You can start sharing this link in your promotions to earn commissions.</p>
            <p>If you have any questions, feel free to reach out.</p>
            <p>Welcome aboard!<br>The Affiliate Team</p>
          </div>
        `
      });
    } else {
      // Send rejection or notice email
      await transporter.sendMail({
        from: { name: "TEA", address: process.env.EMAIL },
        to: user.email,
        subject: 'Affiliate Application Status Update',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Hi ${user.name || ''},</h2>
            <p>Your affiliate application has been updated to: <strong>${status}</strong>.</p>
            ${status === 'pending' ? 
              '<p>Your application is still under review. We’ll get back to you soon!</p>' : 
              '<p>Unfortunately, your application has not been approved at this time. Feel free to reapply in the future or contact us for more details.</p>'
            }
            <p>Thank you,<br>The Affiliate Team</p>
          </div>
        `
      });
    }

    return { success: true, message: `Affiliate status updated to "${status}" and email sent.` };

  } catch (error) {
    console.error("Error in approveAffiliate:", error.message);
    return { success: false, message: error.message };
  }
}


  // Get user's referral code
  static async getReferralCode(userId) {
    const res = await pool.query(
      `SELECT referral_code FROM referrers WHERE user_id = $1`,
      [userId]
    );
    if (!res.rows.length) throw new Error('User is not an affiliate.');
    return res.rows[0].referral_code;
  }

  // Redeem referral code on registration
  static async redeemReferral(referredUserId, referralCode) {
    const referrerRes = await db.query(
      `SELECT id FROM referrers WHERE referral_code = $1`,
      [referralCode]
    );

    if (!referrerRes.rows.length) throw new Error('Invalid referral code.');

    const referrerId = referrerRes.rows[0].id;

    // Check if already redeemed
    const check = await db.query(
      `SELECT * FROM referral_redemptions WHERE referred_user_id = $1`,
      [referredUserId]
    );
    if (check.rows.length) throw new Error('User already redeemed a referral.');

    await db.query(
      `INSERT INTO referral_redemptions (referrer_id, referred_user_id) VALUES ($1, $2)`,
      [referrerId, referredUserId]
    );

    return { message: 'Referral redeemed.' };
  }

  // Mark referred user as paid
  static async markReferredUserAsPaid(userId) {
    await db.query(
      `UPDATE referral_redemptions
       SET paid = TRUE
       WHERE referred_user_id = $1`,
      [userId]
    );
  }

  // Get affiliate dashboard stats
  static async getAffiliateStats(userId) {
    const referrer = await db.query(
      `SELECT id FROM referrers WHERE user_id = $1`,
      [userId]
    );
    if (!referrer.rows.length) throw new Error('Not an affiliate.');

    const referrerId = referrer.rows[0].id;

    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE paid = TRUE) AS paid_referrals,
         COUNT(*) AS total_referrals
       FROM referral_redemptions
       WHERE referrer_id = $1`,
      [referrerId]
    );

    return {
      total_referrals: parseInt(rows[0].total_referrals),
      paid_referrals: parseInt(rows[0].paid_referrals),
      total_earnings: parseInt(rows[0].paid_referrals) * 5000
    };
  }

  // Request payout
  static async requestAffiliatePayout(userId) {
    // Count unpaid earnings
    const referrer = await db.query(
      `SELECT id FROM referrers WHERE user_id = $1`,
      [userId]
    );
    if (!referrer.rows.length) throw new Error('Not an affiliate.');

    const referrerId = referrer.rows[0].id;

    const unpaid = await db.query(
      `SELECT COUNT(*) AS count FROM referral_redemptions
       WHERE referrer_id = $1 AND paid = TRUE AND incentive_granted = FALSE`,
      [referrerId]
    );

    const count = parseInt(unpaid.rows[0].count);
    if (count === 0) throw new Error('No unpaid earnings.');

    const amount = count * 5000;

    // Create payout record
    await db.query(
      `INSERT INTO affiliate_payouts (user_id, total_referrals, amount)
       VALUES ($1, $2, $3)`,
      [userId, count, amount]
    );

    // Mark referrals as paid out
    await db.query(
      `UPDATE referral_redemptions
       SET incentive_granted = TRUE
       WHERE referrer_id = $1 AND paid = TRUE AND incentive_granted = FALSE`,
      [referrerId]
    );

    return { message: 'Payout request submitted.', amount };
  }
}

module.exports = Affiliate