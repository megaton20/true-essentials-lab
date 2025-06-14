const nodemailer = require('nodemailer')

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