
const createTableIfNotExists = require('../utils/createTableIfNotExists');
 
 
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
            redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            paid BOOLEAN DEFAULT FALSE,
            incentive_granted BOOLEAN DEFAULT FALSE
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
  static async applyAsAffiliate(userId, applicationText) {
    const existing = await db.query(
      'SELECT * FROM affiliate_applications WHERE user_id = $1 AND status = $2',
      [userId, 'pending']
    );

    if (existing.rows.length > 0) {
      throw new Error('You already have a pending application.');
    }

    await db.query(
      `INSERT INTO affiliate_applications (user_id, application_text) VALUES ($1, $2)`,
      [userId, applicationText]
    );

    return { message: 'Application submitted.' };
  }

  // Admin approves application
  static async approveAffiliate(userId, adminId) {
    // Update user role
    await db.query(`UPDATE users SET role = 'affiliate' WHERE id = $1`, [userId]);

    // Mark application as approved
    await db.query(
      `UPDATE affiliate_applications
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE user_id = $2 AND status = 'pending'`,
      [adminId, userId]
    );

    // Generate referral code
    const referralCode = uuidv4().split('-')[0]; // short unique code

    await db.query(
      `INSERT INTO referrers (user_id, referral_code) VALUES ($1, $2)`,
      [userId, referralCode]
    );

    return { message: 'Affiliate approved', referralCode };
  }

  // Get user's referral code
  static async getReferralCode(userId) {
    const res = await db.query(
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