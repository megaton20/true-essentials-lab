module.exports = async (req, res, next) => {
  const { userId } = req.headers;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  req.userId = userId;
  next();
};
