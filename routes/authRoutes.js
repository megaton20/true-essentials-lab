const router = require('express').Router();
const authController = require('../controllers/authController');
const { ensureAuthenticated,forwardAuthenticated } = require("../config/auth");

const {forwardVerifyAlert} = require('../middleware/auth');


router.get('/register',forwardAuthenticated,  authController.registerPage);
router.get('/login',forwardAuthenticated, authController.loginPage);

router.post('/register',forwardAuthenticated, authController.userCreate);
router.post('/login', forwardAuthenticated,authController.login);
router.post('/verify-email-sent', ensureAuthenticated, forwardVerifyAlert, authController.verifyEmailRequest)
router.get('/verify-email',ensureAuthenticated, forwardVerifyAlert,authController.verifyEmailCallBack);
router.get('/verify-alert', ensureAuthenticated,forwardVerifyAlert, authController.verifyNotice)

router.get('/verify-email-completed', ensureAuthenticated, forwardVerifyAlert,authController.verifyCompleted)
router.get('/verify-email-sent', ensureAuthenticated, forwardVerifyAlert,authController.verifySent)



// Logout route
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'You have logged out successfully.');
    res.redirect('/');
  });
});


router.get('/forget-password', forwardAuthenticated, authController.forgetPasswordPage)
router.post('/change-password/request',forwardAuthenticated,authController.passwordChangeRequest)
router.get('/request-password/success',forwardAuthenticated,authController.passwordChangeRequestSentPage)

router.get('/reset-password/',forwardAuthenticated,authController.resetPasswordChangeTokenVerification)
router.post('/change-password/:token',forwardAuthenticated,authController.changePasswordChangeTokenVerification)




module.exports = router;
