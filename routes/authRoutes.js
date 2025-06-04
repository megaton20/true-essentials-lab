const router = require('express').Router();
const auth = require('../controllers/authController');
const { ensureAuthenticated,forwardAuthenticated } = require("../config/auth");
const {farwardVerifyAlert} = require('../middleware/auth')

router.get('/register',forwardAuthenticated, auth.registerPage);
router.post('/register',forwardAuthenticated, auth.register);

router.get('/login',forwardAuthenticated, auth.loginPage);
router.post('/login', forwardAuthenticated,auth.login);

router.get('/verify-alert', ensureAuthenticated,farwardVerifyAlert, async (req, res) => {
      return  res.render('verify-alert', 
                {
              user:{name: req.user.full_name, email: req.user.email}
            })
});

router.get('/forget-password', forwardAuthenticated, async (req, res) => {
      return  res.render('forget',);
})
router.get('/otp', forwardAuthenticated, async (req, res) => {
      return  res.render('otp',);
})

router.get('/verify',ensureAuthenticated, auth.verifyEmail);



module.exports = router;
