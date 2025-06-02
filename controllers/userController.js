const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');

exports.getDashboard = async (req, res) => {
  
  // const user = await User.getById(req.userId);

  // if (!user.has_paid) {
  //   const codeInfo = await ReferralCode.findByCode(user.referral_code);
  //   const eligible = codeInfo.current_uses < codeInfo.max_uses;

  //   return res.json({
  //     locked: true,
  //     discount: eligible ? codeInfo.discount_percentage : 0,
  //     amountDue: eligible ? 150000 * (1 - codeInfo.discount_percentage / 100) : 150000
  //   });
  // }

  // res.json({ locked: false, message: 'Welcome to your dashboard!' });
};

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
