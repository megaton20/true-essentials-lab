const ReferralCode = require('../models/ReferralCode');
const Setting = require('../models/Settings');

exports.createReferral = async (req, res) => {
    
  const { code, locationName, discountPercentage, maxUses, expiresAt } = req.body;
  const newCode = await ReferralCode.create({ code, locationName, discountPercentage, maxUses, expiresAt });
  res.json(newCode);
};

exports.toggleSetting = async (req, res) => {
  const { key, value } = req.body;
  await Setting.set(key, value);
  res.json({ message: `Setting ${key} updated to ${value}` });
};
