const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const ClassSession = require('../models/ClassSession');


exports.getDashboard = async (req, res) => {

    
   let sessions = await ClassSession.listAll()
    const now = new Date();
        sessions = sessions.map(s => {
        const classTime = new Date(s.scheduled_at);
        const isFuture = classTime > now;
        
        let cardColor = 'secondary'; // default gray
        let buttonState = { text: 'Unavailable', disabled: true };

        if (s.status === true) {
            cardColor = 'success'; // green
            buttonState = { text: 'Joined', disabled: true, icon: 'fa-check' };
        } else if (s.status === false && !isFuture) {
            cardColor = 'danger'; // red for closed
            buttonState = { text: 'Closed', disabled: true, icon: 'fa-lock' };
        } else if (s.status !== true && isFuture) {
            cardColor = 'warning'; // yellow for upcoming
            buttonState = { text: 'Join Now', disabled: false, icon: 'fa-bell' };
        }

        return {
            ...s,
            dateString: classTime.toLocaleString(),
            cardColor,
            buttonState,
        };
        });

        
    res.render('./student/dashboard',{
        sessions,
        user:{name: req.user.full_name, email: req.user.email}
    })
}

exports.studentClassRecord = async (req, res) => {

    
   let sessions = await ClassSession.listAll()
    // let lastFiveSessrions = ClassSession.listAllForStudent(req.user.id)
        
    res.render('./student/dashboard',{
        sessions,
        user:{name: req.user.full_name, email: req.user.email}
    })
}


exports.completePayment = async (req, res) => {
  const user = await User.getById(req.userId);
  const code = await ReferralCode.findByCode(user.referral_code);

  const eligible = code.current_uses < code.max_uses;
  const discount = eligible ? code.discount_percentage : 0;
  const paymentReference = req.body.reference; // from Paystack

  await User.markAsPaid(user.id, discount, paymentReference);

  if (eligible) await ReferralCode.incrementUsage(user.referral_code);

  res.json({ message: 'Payment complete. Dashboard unlocked.' });
};
