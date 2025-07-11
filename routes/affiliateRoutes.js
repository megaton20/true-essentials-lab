const router = require('express').Router();
const affiliateController = require('../controllers/affiliateController');
const { ensureAuthenticated, } = require("../config/auth");
const {ensureVerifiedEmail,forwardAlreadyAffiliate, affiliateApplicationStatus} = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid');



// Affiliate actions
router.get('/', affiliateController.affliteInfo);
router.get('/pending/applicants', affiliateController.affliteWaitingAppproval);
router.get('/dashboard',ensureAuthenticated,ensureVerifiedEmail, affiliateController.affliteDash);

router.get('/signup',ensureAuthenticated,ensureVerifiedEmail,forwardAlreadyAffiliate,affiliateApplicationStatus, affiliateController.signup);
router.post('/apply',ensureAuthenticated,ensureVerifiedEmail, affiliateController.applyAsAffiliate);

router.post('/update-bank',ensureAuthenticated,ensureVerifiedEmail, affiliateController.updateBankDetails);



router.post('/redeem', ensureAuthenticated,ensureVerifiedEmail,affiliateController.requestWithdrawal);

router.get('/stats',ensureAuthenticated,ensureVerifiedEmail, affiliateController.getAffiliateStats);
router.post('/request-payout',ensureAuthenticated,ensureVerifiedEmail, affiliateController.requestAffiliatePayout);



module.exports = router;
