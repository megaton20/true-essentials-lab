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
    from: `"YourApp" <${process.env.EMAIL}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
  }
};

module.exports = sendEmail;
