const getBaseUrl = () => {
  return process.env.LIVEDIR || process.env.NGROK || `http://localhost:${process.env.PORT}`;
};

const paymentReminderTemplate = (user) => `
  <h3>Complete Your Payment</h3>
  <p>Hi ${user.full_name},</p>
  <p>We noticed you haven't completed your payment. Don't miss out on upcoming classes and materials!</p>
  <p><a href="${getBaseUrl()}/user">Click here to complete your payment</a></p>
  <p>– TEA Team</p>
`;


const welcomeToClassTemplate = (user, session) => `
  <h3>Welcome to "${session.title}"</h3>
  <p>Hi ${user.full_name},</p>
  <p>You've successfully joined the class "<strong>${session.title}</strong>".</p>
  <p>Session Details:</p>
  <ul>
    <li><strong>Date & Time:</strong> ${new Date(session.scheduled_at).toLocaleString()}</li>
    <li><strong>Meeting Link:</strong> <a href="${session.meet_link}">Join Class</a></li>
  </ul>
  <p>Glad to have you on board!</p>
  <p>– TEA Team</p>
`;

const dayBeforeTemplate = (user, sessions) => `
  <h3>Class Reminder: Upcoming Sessions</h3>
  <p>Hi ${user.full_name},</p>
  <p>This is a reminder that you have the following class${sessions.length > 1 ? 'es' : ''} scheduled for tomorrow:</p>
  <ul>
    ${sessions.map(session => `
      <li>
        <strong>${session.title}</strong><br/>
        <strong>Date:</strong> ${new Date(session.scheduled_at).toLocaleString()}<br/>
         <p><a href="${getBaseUrl()}/user" >Read more...</a></p>
      </li>
    `).join('')}
  </ul>
  <p>Please be prepared and join on time.</p>
  <p>– TEA Team</p>
`;


module.exports = {
  paymentReminderTemplate,
  welcomeToClassTemplate,
  dayBeforeTemplate,
};