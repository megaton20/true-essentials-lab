const router = require('express').Router();
const affiliateController = require('../controllers/affiliateController');
const { ensureAuthenticated, } = require("../config/auth");
const {ensureVerifiedEmail,forwardAlreadyAffiliate} = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid');



// Affiliate actions
router.get('/', affiliateController.affliteInfo);
router.get('/dashboard',ensureAuthenticated,ensureVerifiedEmail, affiliateController.affliteDash);

router.get('/signup',ensureAuthenticated,ensureVerifiedEmail,forwardAlreadyAffiliate, affiliateController.signup);
router.post('/apply',ensureAuthenticated,ensureVerifiedEmail, affiliateController.applyAsAffiliate);




router.post('/redeem', ensureAuthenticated,ensureVerifiedEmail,affiliateController.redeemReferral);

router.get('/stats',ensureAuthenticated,ensureVerifiedEmail, affiliateController.getAffiliateStats);
router.post('/request-payout',ensureAuthenticated,ensureVerifiedEmail, affiliateController.requestAffiliatePayout);



module.exports = router;
