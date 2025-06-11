const router = require('express').Router();
const affiliateController = require('../controllers/affiliateController');
const { v4: uuidv4 } = require('uuid');



// Affiliate actions
router.get('/signup', affiliateController.signup);

router.post('/apply', affiliateController.applyAsAffiliate);
router.get('/code', affiliateController.getReferralCode);
router.post('/redeem', affiliateController.redeemReferral);

router.get('/stats', affiliateController.getAffiliateStats);
router.post('/request-payout', affiliateController.requestAffiliatePayout);



module.exports = router;
