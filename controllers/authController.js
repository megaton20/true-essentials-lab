const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');

exports.register = async (req, res) => {
  const { fullName, email, password, referralCode } = req.body;

  // validate code
  const validCode = await ReferralCode.isCodeValid(referralCode);
  if (!validCode) return res.status(400).json({ error: 'Invalid or expired referral code' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, passwordHash: hashed, referralCode });

  // send verification email here (simulated)
  res.status(201).json({ message: 'Check your email to verify your account.' });
};

exports.verifyEmail = async (req, res) => {
  const { userId } = req.query;
  await User.verifyEmail(userId);
  res.send('Email verified. You can now log in.');
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findByEmail(email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Incorrect password' });

  if (!user.is_email_verified) return res.status(403).json({ error: 'Verify your email first' });

  // Simulate session or JWT
  res.json({ message: 'Login successful', userId: user.id, role: user.role });
};
