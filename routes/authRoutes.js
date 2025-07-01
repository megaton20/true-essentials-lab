const router = require('express').Router();
const bcrypt = require("bcryptjs")
const auth = require('../controllers/authController');
const { ensureAuthenticated,forwardAuthenticated } = require("../config/auth");
const { checkRegistrationOpen,checkingActiveSeason, checkPaymentOpen, forwardRegClosed } = require('../middleware/settingsMiddleware');
const { generateResetToken, verifyResetToken } = require('../config/jsonWebToken');
const sendEmail = require('../utils/mailer');
const pool = require('../config/db');

const {forwardVerifyAlert} = require('../middleware/auth');
const User = require('../models/User');


const {
    resetPasswordTemplate
} = require('../utils/templates');



router.get('/register',forwardAuthenticated,checkingActiveSeason, checkRegistrationOpen, auth.registerPage);
router.post('/register',checkRegistrationOpen,forwardAuthenticated, auth.register);
router.get('/registration-closed',forwardAuthenticated,checkingActiveSeason, auth.registerClosed);
router.get('/season-closed',forwardAuthenticated,checkRegistrationOpen,forwardRegClosed, auth.seasonClosed);

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


router.get('/forget-password', forwardAuthenticated, (req, res) => res.render('forget-password',{
  pageTitle:`enter recovery email for`,
  }));




router.post('/change-password/request',forwardAuthenticated, async (req,res)=>{
        const { email } = req.body;

      if (!email) {
      req.flash('error_msg', `Error: Enter a valid email address`);
      return res.redirect('/auth/forget-password');
      }

      const results = await User.findByEmail(email)
    if (!results) {
      req.flash('error_msg', `email not found in our record`)
     return res.redirect('/auth/forget-password')
      
    }
       if (results.length <= 0) {
      req.flash('error_msg', `Error: No user found with this email`);
      return res.redirect('/auth/forget-password');
    }

        const token = generateResetToken(email);
    const resetLink = `${process.env.LIVE_DIRR || `http://localhost:${process.env.PORT || 2000}`}/auth/reset-password/${token}`;

   const sentEmail =  await sendEmail(email, 'Password Reset Link', resetPasswordTemplate(resetLink));

            if (sentEmail) {
                  return res.redirect('/auth/request-password/success')
            }else{
                        req.flash('error_msg',`email did not go through`)
                  return res.redirect('/auth/forget-password')

            }
})


router.get('/request-password/success',forwardAuthenticated, async (req, res)=>{
      return res.render('forget-new-sent')
})




router.get('/reset-password/:token', forwardAuthenticated, async (req, res) => {

      const { token } = req.params;

        const decoded = verifyResetToken(token);
            if (!decoded) {
            req.flash('error_msg', `invalid token`)
            return res.redirect('/auth/forget-password')
            }

      return  res.render('forget-new-password',{
            token
      });

})

router.post('/change-password/:token', forwardAuthenticated, async (req, res) => {

        const { token } = req.params;
  const { password, confirm } = req.body;
  const decoded = verifyResetToken(token);
  
  if (!decoded) {
        req.flash('error_msg', 'Invalid or expired token');
        return res.redirect('/auth/forget-password');
      }
      
      if (password !== confirm) {
            req.flash('error_msg', 'Passwords do not match');
            return res.redirect(`/auth/reset-password/${token}`);
      }
      


      const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, decoded.email])

    req.flash('success_msg', 'Password changed successfully');
    return res.redirect('/auth/login');

  } catch (error) {
    console.log(error);
    req.flash('error_msg', `errorr form server: ${error.message}`);
    return res.redirect('/auth/forget-password');
  }

})


router.get('/reset-success', forwardAuthenticated, async (req, res) => {
      return  res.render('reset-success',);
})




module.exports = router;
