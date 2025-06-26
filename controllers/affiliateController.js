const Affiliate = require('../models/Affiliate');
const pool = require('../config/db')
const { v4: uuidv4 } = require('uuid');
const { update } = require('./TeacherController');
const axios = require('axios');


const AffiliateController = {


  affliteInfo(req, res) {
    res.render('affiliate')
  },

  affliteWaitingAppproval(req, res) {
    res.render('affiliate-already')
  },
  
  async affliteDash(req, res) {
    try {

        const banksRes = await axios.get('https://api.paystack.co/bank', {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        });
        const banks = banksRes.data.data; // Array of bank objects (code + name)
      

  //  Fetch affiliate info (if the user is an affiliate)
          const affiliateResult = await Affiliate.getAffiliateByUserId(req.user.id);
          let isAffiliate = [];
          if (affiliateResult.length > 0) {
            isAffiliate = affiliateResult;

            //  If affiliate has bank_code saved, find and attach corresponding bank name from Paystack list
            const affiliate = isAffiliate[0];
            const matchedBank = banks.find(b => b.code === affiliate.bank_name);
            
            if (matchedBank) {
              affiliate.bank_name = matchedBank.name; // Replace bank_code with human-readable name
            }
          }

      // Get referrer info for current user
      const referrerQuery = `
      SELECT id, referral_code, balance, bank_name, account_number, account_name 
      FROM referrers 
      WHERE user_id = $1
    `;
      const { rows } = await pool.query(referrerQuery, [req.user.id]);

      if (rows.length === 0) {
        req.flash('error_msg', `you are not part of the program...`)
        return res.redirect('/handler');
      }

      const referrer = rows[0];
      const referralCode = referrer.referral_code;
      const referralLink = `${process.env.LIVE_DIRR || `http://localhost:${process.env.PORT}`}/auth/register/?ref=${referralCode}`;

      // Now get all users who were referred by this user
      const usersQuery = `
      SELECT 
        u.id, 
        u.full_name,  
        rd.has_earned,
        rd.redeemed_at
      FROM referral_redemptions rd
      JOIN users u ON u.id = rd.referred_user_id
      WHERE rd.referrer_id = $1
    `;
      const { rows: referees } = await pool.query(usersQuery, [referrer.id]);

      
   
      res.render('affiliate-dash', {
        user: req.user,
        referralLink,
        referees,
        referrer:isAffiliate[0]
      });

    } catch (err) {
      console.error('Affiliate Dashboard Error:', err);
      res.status(500).send('Something went wrong loading your affiliate dashboard.');
    }
  }
  ,

  async signup(req, res) {
    try {
      //   const result = await Affiliate.applyAsAffiliate(req.user.id, applicationText);
      res.render('affiliate-form')
    } catch (err) {
      console.log(err);

      //   res.status(400).json({ error: err.message });
    }
  },

  async applyAsAffiliate(req, res) {
    try {
      const { refSource, experience, whyJoin } = req.body;


      const result = await Affiliate.applyAsAffiliate(req.user.id, refSource, experience, whyJoin);

      if (result == 1) {
        req.flash('success_msg', "Application submitted")

      } else {
        req.flash('error_msg', "Application failed")

      }

      return res.redirect('/handler')

    } catch (err) {
      req.flash('error_msg', `Application failed: ${err}`)
      return res.redirect('/user')
    }
  },

   async updateBankDetails(req, res) {
    try {
      const { bank_code, account_number, account_name } = req.body;      

      const result = await Affiliate.updateBank(bank_code,account_name, account_number, req.user.id);

      if (result) {
        req.flash('success_msg', "Application submitted")

      } else {
        req.flash('error_msg', "Application failed")

      }

      return res.redirect('/user/profile')

    } catch (err) {
      req.flash('error_msg', `Application failed: ${err}`)
      return res.redirect('/user')
    }
  },

  // all applications
  async affiliateApplications(req, res) {
    try {

      const applicationList = await Affiliate.getAllApplications();

      return res.render('./admin/affiliate-application', {
        applicationList
      })

    } catch (err) {
      req.flash('error_msg', `Application list failed: ${err}`)
      return res.redirect('/admin')
    }
  },

  // view application
  async viewAnApplication(req, res) {
    try {

      const application = await Affiliate.getApplicationById(req.params.id);

      return res.render('./admin/affiliate-view', {
        application
      })

    } catch (err) {
      req.flash('error_msg', `Application list failed: ${err}`)
      return res.redirect('/admin')
    }
  },

  // admin to approve applications
  async approveAffiliate(req, res) {
    const applicationId = req.params.id;
    const status = req.params.status;
    const userId = req.body.userId;

    try {
      const result = await Affiliate.approveAffiliate(applicationId, status, req.user.id, userId);

      if (result.success) {
        req.flash('success_msg', result.message || "Application approved successfully.");
      } else {
        req.flash('error_msg', result.message || "Something went wrong while approving the application.");
      }

      return res.redirect('/admin/affiliate/applications');
    } catch (err) {
      console.error("Affiliate approval error:", err);

      // Fallback error message in case an unhandled exception is thrown
      req.flash('error_msg', `Unexpected error: ${err.message}`);
      return res.redirect('/admin');
    }
  },



  async redeemReferral(req, res) {
    try {
      const { referralCode } = req.body;
      const result = await Affiliate.redeemReferral(req.user.id, referralCode);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async markReferredUserAsPaid(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const result = await Affiliate.markReferredUserAsPaid(req.params.userId);
      res.json({ message: 'User marked as paid.' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getAffiliateStats(req, res) {
    try {
      const stats = await Affiliate.getAffiliateStats(req.user.id);
      res.json(stats);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async requestAffiliatePayout(req, res) {
    try {
      const result = await Affiliate.requestAffiliatePayout(req.user.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

module.exports = AffiliateController;
