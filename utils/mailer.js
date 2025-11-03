const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // use TLS
  auth: {
    user: process.env.SMTP_LOGIN,      // e.g. 9ab199001@smtp-brevo.com
    pass: process.env.EMAIL_PASSWORD,  // your Brevo SMTP key
  },
  tls: {
    rejectUnauthorized: false, // important for Render in some cases
  },
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
