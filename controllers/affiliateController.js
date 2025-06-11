const Affiliate = require('../models/Affiliate');
const { v4: uuidv4 } = require('uuid');

const AffiliateController = {
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
      const { applicationText } = req.body;
      const result = await Affiliate.applyAsAffiliate(req.user.id, applicationText);
      res.json(result);
    } catch (err) {
        console.log(err);
        
    //   res.status(400).json({ error: err.message });
    }
  },

  async approveAffiliate(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const result = await Affiliate.approveAffiliate(req.params.userId, req.user.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getReferralCode(req, res) {
    try {
      const code = await Affiliate.getReferralCode(req.user.id);
      res.json({ referralCode: code });
    } catch (err) {
      res.status(400).json({ error: err.message });
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
