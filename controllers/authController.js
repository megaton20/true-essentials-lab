const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const bcrypt = require("bcryptjs")
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid')
const passport = require('../config/passport');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { generateResetToken, verifyResetToken } = require('../config/jsonWebToken');
const sendEmail = require('../utils/mailer');
const {welcomeToAppTemplate} = require('../utils/templates');

const { verificationEmailSentTemplate } = require('../utils/templates');

exports.registerPage = async (req, res) => {
   const referrerCode = req.query.ref || null;
  if (referrerCode) {
    req.session.referrerCode = referrerCode
  }
     
 res.render('register',{
  referralCode:referrerCode,
 })
}

exports.loginPage = (req, res) => {
 res.render('login')
}


exports.register = async (req, res, next) => {
  const { firstname, lastname, email, password, referralCode } = req.body;

  try {
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      req.flash('error_msg', 'Email is already taken.');
      return res.redirect('/auth/register');
    }

    const fullName = `${firstname} ${lastname}`;
    const newUserId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      id: newUserId,
      fullName,
      email,
      passwordHash: hashedPassword,
    });

 
     
    // Handle referral if a valid referral code is given
    if (referralCode) {
      const referrer = await ReferralCode.isCodeValid(referralCode);

      if (referrer) {
        await pool.query(
          `INSERT INTO referral_redemptions (referrer_id, referred_user_id, id) 
           VALUES ($1, $2, $3)`,
          [referrer.id, newUserId, uuidv4()]
        );
      }
    }

    // Auto-login user
    req.login(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        req.flash('error_msg', 'Login failed. Please try again.');
        return res.redirect('/auth/register');
      }
      return res.redirect('/handler');
    });

  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again.');
    return res.redirect('/auth/register');
  }
};



exports.verifyEmailRequest = async (req, res) => {
  const { email } = req.body; // Destructuring

  try {
    const user = await User.findByEmail(email);

    if (!user) {
      req.flash('error_msg', 'User with this email does not exist');
      return res.redirect('/handler');
    }

    if (user.is_email_verified) {
      req.flash('warning_msg', 'This user email is already verified');
      return res.redirect('/handler');
    }

    // Generate verification token
    const token = generateResetToken(email);
    const tokenExpires = new Date(Date.now() + 3600000); // 1 hour

    // Update user with token
    const updateResults = await pool.query(
      `UPDATE users SET token_expires = $1, token = $2 WHERE id = $3`,
      [tokenExpires, token, user.id]
    );

    if (updateResults.rowCount < 1) {
      req.flash('error_msg', 'Unknown error occurred when requesting email token');
      return res.redirect('/handler');
    }

    // Send verification email
    const resetLink = `${process.env.LIVE_DIRR || `http://localhost:${process.env.PORT}`}/auth/verify-email?token=${token}`;    
    
    const emailDone = await sendEmail(
      email, 
      "Verify your Email", 
      verificationEmailSentTemplate(resetLink)
    );

    // Set appropriate flash message
    req.flash(emailDone ? 'success_msg' : 'error_msg', 
      emailDone 
        ? 'Check your mail inbox or spam to activate your account'
        : 'Failed to send verification email. Please try again.'
    );

    return res.redirect(`/auth/verify-${emailDone ? 'email-sent' :'alert' }`);

  } catch (error) {
    console.error('Email verification request error:', error);
    req.flash('error_msg', 'An error occurred while processing your request');
    return res.redirect('/auth/verify-alert');
  }
};

exports.verifyEmailCallBack = async (req, res) => {
  const token = req.query.token;

  if (!token) {
    req.flash('error_msg', `Error: Verification token is required`);
    return res.redirect('/handler');
  }

  try {
    // Get user by token
    const {rows:userResult} = await pool.query(
      'SELECT id, email, full_name, token_expires FROM users WHERE token = $1', 
      [token]
    );

    if (userResult.length === 0) {
      req.flash('error_msg', `Error: Invalid or expired token`);
      return res.redirect('/handler');
    }

    const user = userResult[0];

    if (new Date(user.token_expires) < new Date()) {
      req.flash('error_msg', `Error: Token has expired!`);
      return res.redirect('/handler');
    }

    // Verify token using promise
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    // Update user as verified
    await pool.query(
      `UPDATE users 
       SET is_email_verified = true, token = NULL, token_expires = NULL 
       WHERE email = $1`,
      [user.email]
    );

    // Send welcome email
    await sendEmail(
      user.email, 
      "Welcome to TSA",
      welcomeToAppTemplate(user)
    );
    
    
    req.flash('success_msg', `Email verified successfully`);
    return res.redirect('/handler');

  } catch (error) {
    console.log('Error:', error);
    req.flash('error_msg', `Error: ${error.message}`);
    return res.redirect('/handler');
  }
};

exports.login = async (req, res, next) => {

   passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error_msg', `error loging in, no user found!`)
      return res.redirect('/auth/login');
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
      req.flash('error_msg', `error loging in, no user found!`)
      return res.redirect('/auth/login');
    }
  })(req, res, next);
};
