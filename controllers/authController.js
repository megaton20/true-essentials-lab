const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require('uuid')
const passport = require('../config/passport');


exports.registerPage = (req, res) => {

   const referrerCode = req.query.ref || null;

  if (referrerCode) {
    req.session.referrerCode = referrerCode
  }

 res.render('register',{
  referrerCode
 })
}



exports.loginPage = (req, res) => {
 res.render('login')
}


exports.register = async (req, res) => {
  const { firstname, lastname, email, password, referralCode } = req.body;

  const existingUser = await User.findByEmail(email)

  if (existingUser) {
    req.flash('error_msg', "email already taken...")
    return res.redirect('/auth/register')
  }
  // validate code
  let validCode
  if (referralCode) {
    validCode = await ReferralCode.isCodeValid(referralCode);
  }

  if (!validCode){
    console.log("invalid or expired referral code");
    
  };
  
  
  let fullName = `${firstname} ${lastname}`

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, passwordHash: hashed, referralCode, id: uuidv4()});

  
  // send verification email here (simulated)

    req.login(user, err => {
        if (err) {
          next(err);
          req.flash('error_msg', `Try again`);
          return res.redirect('/');
        }
        return res.redirect('/handler');
      });

  // res.status(201).json({ message: 'Check your email to verify your account.' });
};


exports.verifyEmail = async (req, res) => {
  const { userId } = req.query;
  await User.verifyEmail(userId);
  res.send('Email verified. You can now view resources.');
};

exports.login = async (req, res, next) => {

   passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.render('login', {
        error_msg: info.message,
        pageTitle: `Login To continue  `,
      });
    }

    try {

      req.login(user, err => {
        if (err) {
          next(err);
          req.flash('error_msg', `Try again`);
          return res.redirect('/');
        }
        // return res.redirect('/handler');
        return res.redirect('/handler');
      });
    } catch (error) {
      // Log the error for debugging purposes
      console.error('Error during update:', error);

      return res.render('login', {
        error_msg: 'Error loging in, Please try again.',
        // pageTitle: `Login To continue Using ${appName} `,
        // appName: appName,
      });
    }
  })(req, res, next);


};
