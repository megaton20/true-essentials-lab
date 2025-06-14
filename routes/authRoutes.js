const router = require('express').Router();
const auth = require('../controllers/authController');
const { ensureAuthenticated,forwardAuthenticated } = require("../config/auth");
const { checkRegistrationOpen, checkPaymentOpen } = require('../middleware/settingsMiddleware');

const {forwardVerifyAlert} = require('../middleware/auth')

router.get('/register',checkRegistrationOpen,forwardAuthenticated, auth.registerPage);
router.post('/register',checkRegistrationOpen,forwardAuthenticated, auth.register);

router.get('/login',forwardAuthenticated, auth.loginPage);
router.post('/login', forwardAuthenticated,auth.login);

router.get('/verify-alert', ensureAuthenticated,forwardVerifyAlert, async (req, res) => {
      return  res.render('verify-alert', 
                {
              user:{name: req.user.full_name, email: req.user.email}
            })
});

router.get('/verify-email-sent', ensureAuthenticated, forwardVerifyAlert, async (req, res)=>{
      return res.render('verify-sent',{
            user: {name: req.user.full_name, email: req.user.email}
      })
})

router.post('/verify-email-sent', ensureAuthenticated, forwardVerifyAlert, auth.verifyEmailRequest)
router.get('/verify-email',ensureAuthenticated, forwardVerifyAlert,auth.verifyEmailCallBack);



router.get('/verify-email-completed', ensureAuthenticated, forwardVerifyAlert, async (req, res)=>{
      return res.render('verify-success',{
            user: {name: req.user.full_name, email: req.user.email}
      })
})



router.get('/forget-password', forwardAuthenticated, async (req, res) => {
      return  res.render('forget',);
})
router.get('/otp', forwardAuthenticated, async (req, res) => {
      return  res.render('otp',);
})
router.get('/reset-success', forwardAuthenticated, async (req, res) => {
      return  res.render('reset-success',);
})




module.exports = router;
