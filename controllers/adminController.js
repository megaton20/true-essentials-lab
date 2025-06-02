const ReferralCode = require('../models/ReferralCode');
const Setting = require('../models/Settings');
const Admin = require('../models/Admin');
const ClassSession = require('../models/ClassSession');

exports.adminDashboard = async (req, res) => {

    try {
    const stats = await Admin.getDashboardStats(); 
    
    const classStatus = await Admin.getClassStatus();
    res.render('./admin/dashboard',
       { 
        stats, 
        classStatus 

       });
  } catch (err) {
    res.status(500).send("Error loading admin dashboard.");
  }
    //  res.render('./admin/dashboard')
};

exports.getAllUsers = async (req, res) => {

    try {
    const stats = await Admin.getDashboardStats(); 

    res.render('./admin/users',
       { 
        
       });
  } catch (err) {
    res.status(500).send("Error loading admin dashboard.");
  }
    //  res.render('./admin/dashboard')
};


// attendance section
exports.getAttendanceForSession =  async (req, res) => {
  // console.log("running...");
      try {
    const stats = await Admin.getDashboardStats(); 

    res.render('./admin/attendance',
       { 

       });
  } catch (err) {
    res.status(500).send("Error loading admin dashboard.");
  }
    //  res.render('./admin/dashboard')

  // const data = await Attendance.getAttendanceForSession(req.params.id);
  // res.json(data);
}



// class section
exports.getAllClass = async (req, res) => {
  try {
    const stats = await ClassSession.listAll(); 
  } catch (error) {
    
  }
};

exports.createClass = async (req, res) => {
  try {
    const stats = await ClassSession.create(title, desctiption, sheduleAt, meetLink, createdBy); 
  } catch (error) {
    
  }
};

exports.findByJoinCode = async (req, res) => {
  try {
    const stats = await ClassSession.findByJoinCode(code); 
  } catch (error) {
    
  }
};

exports.toggleClasssVisibility = async (req, res) => {
  try {
    const stats = await ClassSession.toggleLinkVisibility(IdleDeadline, visible); 
  } catch (error) {
    
  }
};

exports.getVisibleLink = async (req, res) => {
  try {
    const stats = await ClassSession.getVisibleLink(joinCode); 
  } catch (error) {
    
  }
};


// referral codes section
exports.getReferrals = async (req, res) => {
  const referralCodes = await ReferralCode.lisAll();
  res.json(referralCodes);
};
exports.findReferralCode = async (req, res) => {
  const  code = req.params.code
  const newCode = await ReferralCode.findByCode( code);
  res.json(newCode);
};
exports.createReferral = async (req, res) => {
  const { code, locationName, discountPercentage, maxUses, expiresAt } = req.body;
  const newCode = await ReferralCode.create({ code, locationName, discountPercentage, maxUses, expiresAt });
  res.json(newCode);
};

exports.updateReferral = async (req, res) => {
  const { code, locationName, discountPercentage, maxUses, expiresAt } = req.body;
  const newCode = await ReferralCode.update({ code, locationName, discountPercentage, maxUses, expiresAt });
  res.json(newCode);
};


// settings section
exports.toggleSetting = async (req, res) => {
  const { key, value } = req.body;
  await Setting.set(key, value);
  res.json({ message: `Setting ${key} updated to ${value}` });
};




