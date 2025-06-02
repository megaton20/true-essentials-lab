const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const bcrypt = require("bcryptjs")
const uuid = require('uuid').v4()


exports.registerPage = (req, res) => {

   const referrerCode = req.query.ref || null;

  if (referrerCode) {
    req.session.referrerCode = referrerCode
  }

 res.render('register',{
  referrerCode
 })
}



exports.loginPage = (req, res) => {
 res.render('login')
}


exports.register = async (req, res) => {
  const { firstname, lastname, email, password, referralCode } = req.body;

 
  

  let validCode
  // validate code
  if (referralCode) {
    validCode = await ReferralCode.isCodeValid(referralCode);
  }

  
  if (!validCode){
    console.log("invalid or expired referral code");
    
  };
  
  
  let fullName = `${firstname} ${lastname}`

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, passwordHash: hashed, referralCode, id:uuid});

  
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
