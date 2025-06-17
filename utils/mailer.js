const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your SMTP provider
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
,
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
    console.log(`Email sent to ${to}`);
    return true
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
    return false
  }
};

module.exports = sendEmail;
