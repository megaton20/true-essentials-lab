const getBaseUrl = () => {
  return process.env.LIVEDIR || process.env.NGROK || `http://localhost:${process.env.PORT}`;
};

const teaEmailWrapper = (subject, content) => `
  <div style="font-family: 'Segoe UI', sans-serif; background: #f4f4f4; padding: 40px 0;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(90deg,rgb(17, 88, 114),rgb(25, 142, 200)); padding: 20px; text-align: center; color: white;">
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

module.exports = {
  paymentReminderTemplate,
  welcomeToClassTemplate,
  dayBeforeTemplate,
  resetPasswordTemplate,
  verificationEmailSentTemplate
};