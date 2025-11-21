const getBaseUrl = () => {
  return process.env.LIVEDIR || process.env.NGROK || `http://localhost:${process.env.PORT}`;
};

const teaEmailWrapper = (subject, content) => `
  <div style="font-family: 'Segoe UI', sans-serif; background: #f4f4f4; padding: 40px 0;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(90deg,rgba(17, 114, 49, 1),rgba(25, 200, 133, 1)); padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">True Series Academy</h1>
        <p style="margin: 0; font-size: 14px;">${subject}</p>
      </div>
      <div style="padding: 30px;">
        ${content}
      </div>
      <div style="background: #fafafa; text-align: center; font-size: 12px; padding: 20px; color: #888;">
        &copy; ${new Date().getFullYear()} True Series Academy – All rights reserved.
      </div>
    </div>
  </div>
`;

const paymentReminderTemplate = (user) => teaEmailWrapper(
  "Complete Your Payment",
  `
    <h3>Complete Your Payment</h3>
    <p>Hi ${user.full_name},</p>
    <p>We noticed you haven't completed your payment. Don't miss out on upcoming classes and materials!</p>
    <p><a href="${getBaseUrl()}/user">Click here to complete your payment</a></p>
    <p>– True Series Academy Team</p>
  `
);

const welcomeToClassTemplate = (user, session) => teaEmailWrapper(
  `Welcome to ${session.title}`,
  `
    <p>Hi ${user.full_name},</p>
    <p>You've successfully joined the class "<strong>${session.title}</strong>".</p>
    <p>Session Details:</p>
    <ul>
      <li><strong>Date & Time:</strong> ${new Date(session.scheduled_at).toLocaleString()}</li>
      <li><strong>Meeting Link:</strong> <a href="${session.meet_link}">Join Class</a></li>
    </ul>
    <p>Glad to have you on board!</p>
    <p>– True Series Academy Team</p>
  `
);

const dayBeforeTemplate = (user, sessions) => teaEmailWrapper(
  `Upcoming Class${sessions.length > 1 ? 'es' : ''} Reminder`,
  `
    <h3>Class Reminder: Upcoming Sessions</h3>
    <p>Hi ${user.full_name},</p>
    <p>This is a reminder that you have the following class${sessions.length > 1 ? 'es' : ''} scheduled for tomorrow:</p>
    <ul>
      ${sessions.map(session => `
        <li>
          <strong>${session.title}</strong><br/>
          <strong>Date:</strong> ${new Date(session.scheduled_at).toLocaleString()}<br/>
          <p><a href="${getBaseUrl()}/user">Read more...</a></p>
        </li>
      `).join('')}
    </ul>
    <p>Please be prepared and join on time.</p>
    <p>– True Series Academy Team</p>
  `
);

const resetPasswordTemplate = (resetLink) => teaEmailWrapper(
  "Reset Your Password",
  `
    <p>Reset your password by clicking the button below:</p>
    <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #41afa5; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>If you did not request this, please ignore this email.</p>
  `
);

const verificationEmailSentTemplate = (resetLink) => teaEmailWrapper(
  "Verify your email",
  `
    <p>Visit your dashboard by clicking the button below:</p>
    <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #41afa5; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>If you did not request this, please ignore this email.</p>
  `
);

const welcomeToAppTemplate = (user) => teaEmailWrapper(
  `Welcome to True Series Academy`,
  `
    <p>Dear ${user.full_name},</p>
    
    <p>A very warm welcome to <strong>True Series Academy</strong>! We're absolutely delighted to have you join our learning community.</p>
    
    <p>Your account has been successfully activated, and you now have access to all the resources and features our platform has to offer.</p>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 10px 0;"><strong>🎯 What you can do now:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Browse and enroll in courses/ programs</li>
        <li>Access your learning dashboard</li>
        <li>Track your progress</li>
        <li>Connect with instructors and peers in this community </li>
      </ul>
    </div>

    <p>We're committed to providing you with exceptional learning experiences that empower your growth and success.</p>
        
    <p>If you have any questions or need assistance, our support team is always here to help.</p>
    
    <p>Happy learning! 🎓</p>
    
    <p>Warm regards,<br>
    <strong>The True Series Academy Team</strong></p>
    
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px;">
      <p>Need help? Contact us at support@trueseriesacademy.com</p>
    </div>
  `
);

module.exports = {
  paymentReminderTemplate,
  welcomeToClassTemplate,
  dayBeforeTemplate,
  resetPasswordTemplate,
  verificationEmailSentTemplate,
  welcomeToAppTemplate
};