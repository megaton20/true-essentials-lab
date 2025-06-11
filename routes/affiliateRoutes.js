const router = require('express').Router();
const affiliateController = require('../controllers/affiliateController');
const { v4: uuidv4 } = require('uuid');



// Affiliate actions
router.post('/affiliate/apply', affiliateController.applyAsAffiliate);
router.get('/affiliate/code', affiliateController.getReferralCode);
router.post('/affiliate/redeem', affiliateController.redeemReferral);

router.get('/affiliate/stats', affiliateController.getAffiliateStats);
router.post('/affiliate/request-payout', affiliateController.requestAffiliatePayout);



module.exports = router;
