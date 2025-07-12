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
  const email = req.body.email;

  try {
    // Query to check if the user's email is already verified
   const user =  await User.findByEmail(email)

    if (!user) {
      req.flash('error_msg', `User with this email does not exist`);
      return res.redirect('/handler');
    }

    if (user.is_email_verified) {
      req.flash('warning_msg', `This user email is already verified`);
      return res.redirect('/handler');
    }

    // Generate verification token
    const token = generateResetToken(email);
    const tokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Update query to store the token and its expiry time

    const updateResults = await pool.query(
      `UPDATE users SET token_expires = $1, token = $2 WHERE id = $3`,
       [tokenExpires, token, user.id]);

    if (updateResults.rowCount < 1) {
      req.flash('error_msg', `Unknown error occcured when requesting email token`);
      return res.redirect('/handler');
    }

    const resetLink = `${process.env.LIVE_DIRR || 'http://localhost:2000'}/auth/verify-email?token=${token}`
    const emailDone = await sendEmail(email, "Verify your Email", verificationEmailSentTemplate(resetLink))
    // Send verification email

    if (emailDone) {
      req.flash('success_msg', `Check your mail inbox or spam to activate your account`);
    } else {
      req.flash('error_msg', `sending email failed`);
      
    }
    return res.redirect('/auth/verify-email-sent');    

  } catch (error) {
    console.error(error);
    req.flash('error_msg', `An error occurred while processing your request`);
    res.redirect('/auth/verify-alert');
  }
};

exports.verifyEmailCallBack = (req, res) => {
  const token = req.query.token;

  if (!token) {
    req.flash('error_msg', `Error: Verification token is required`);
    return res.redirect('/handler');
  }

  pool.query('SELECT email, token_expires FROM users WHERE token = $1', [token], (err, results) => {
    if (err) {
      req.flash('error_msg', `Error: ${err.message}`);
      return res.redirect('/handler');
    }

    if (results.rows.length === 0) {
      req.flash('error_msg', `Error: Invalid or expired token`);
      return res.redirect('/handler'); // user profile instead
    }

    const { email, tokenExpires } = results.rows[0];

    if (new Date(tokenExpires) < new Date()) {
      req.flash('error_msg', `Error: Token has expired!`);
      return res.redirect('/handler'); // user profile instead
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        req.flash('error_msg', `Error: Unmatched or expired token`);
        return res.redirect('/handler'); // user profile instead
      }

      // Update user as verified
      const updateQuery = `
        UPDATE users
        SET is_email_verified = true, token = NULL, token_expires = NULL WHERE email = $1
      `;
      pool.query(updateQuery, [email], (err, result) => {
        if (err) {
          console.log(err);
          req.flash('error_msg', `Error: ${err.message}`);
          return res.redirect('/handler'); // user profile instead
        }

        req.flash('success_msg', `Email verified successfully`);
        return res.redirect('/handler'); // user profile instead
      });
    });
  });
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
