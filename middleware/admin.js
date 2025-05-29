const User = require('../models/User');

module.exports = async (req, res, next) => {
  const user = await User.getById(req.headers.userId);
  if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access only' });
  req.userId = user.id;
  next();
};
