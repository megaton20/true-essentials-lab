const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const bcrypt = require("bcryptjs")
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid')
const passport = require('../config/passport');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { generateResetToken, verifyResetToken } = require('../config/jsonWebToken');


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
  
  if (existingUser.length > 0) {
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

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
      }
    });


    const mailOptions = {
      from: {
        name: "TEA",
        address: process.env.EMAIL,
      },
      to: email,
      subject: 'Confirm Your Email Address',
      html: `
    <a href="${process.env.LIVE_DIRR || 'http://localhost:2000'}/auth/verify-email?token=${token}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #41afa5; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>If you did not create an account with us, please disregard this email.</p>
  `
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(`error sending mail: ${err}`);
        req.flash('error_msg', `Error from our server... try to verify your email again after 30 minutes:`);
        return res.redirect('/auth/verify-alert');
      }

      req.flash('success_msg', `Check your mail inbox or spam to activate your account`);
      return res.redirect('/auth/verify-email-sent');
    });

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
