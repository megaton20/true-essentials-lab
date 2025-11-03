const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({

      host: 'smtp-relay.brevo.com',
       port: 587,
        secure: false,
      auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.EMAIL_PASSWORD
      }
    });

const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"True Essentials Academy" <${process.env.EMAIL}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    // console.log(`Email sent to ${to}`);
    return true
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
    return false
  }
};

module.exports = sendEmail;
