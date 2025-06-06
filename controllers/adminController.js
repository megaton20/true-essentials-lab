const ReferralCode = require('../models/ReferralCode');
const Setting = require('../models/Settings');
const Admin = require('../models/Admin');
const ClassSession = require('../models/ClassSession');
const { v4: uuidv4 } = require('uuid');
const Attendance = require('../models/Attendance');

exports.adminDashboard = async (req, res) => {

    try {
    const stats = await Admin.getDashboardStats(); 
    const sessions = await ClassSession.listAll(); 
    
    const classStatus = await Admin.getClassStatus();

    res.render('./admin/dashboard',
       { 
        stats,
        sessions, 
        classStatus

       });
  } catch (err) {
    res.status(500).send("Error loading admin dashboard.");
  }
    //  res.render('./admin/dashboard')
};

exports.getAllUsers = async (req, res) => {

    try {
    const users = await Admin.allUsers(); 

    res.render('./admin/users',
       { 
        users
       });
  } catch (err) {
    res.status(500).send("Error loading admin dashboard.");
  }
    //  res.render('./admin/dashboard')
};
exports.findOneUsers = async (req, res) => {

 const userId =  req.params.id
    try {
    const user = await Admin.getById(userId); 

    res.render('./admin/user',
       { 
        user
       });
  } catch (err) {
    res.status(500).send("Error loading user info.");
  }
    //  res.render('./admin/dashboard')
};




// class section
exports.getAllClass = async (req, res) => {
  try {
    const classes = await ClassSession.listAll(); 
    res.render('./admin/classes', {
      classes
    })
  } catch (error){
    
  }
};

exports.createClass = async (req, res) => {
  const {title, description, scheduled_at, meet_link} = req.body
  
  try {
    const stats = await ClassSession.create({title, description, scheduledAt: scheduled_at,meetLink: meet_link,id:uuidv4()});
    res.redirect('/admin/success') 
  } catch (error) {
    res.redirect('/admin/error') 
    console.log("error on create class line 82: "+ error);
    
    
  }
};



exports.findById = async (req, res) => {
  const id = req.params.id
    const singleClass = await ClassSession.findById(id); 
        res.render('./admin/class', {
      singleClass
    })
};

exports.updateById = async (req, res) => {
  const {title, description, scheduledAt, meetLink }= req.body
  const id = req.params.id

  try {
    const singleClass = await ClassSession.update(title, description, scheduledAt, meetLink, id); 
    res.redirect(`/admin/class${id}`) 
  } catch (error) {
    console.log(`error updating class: ${error}`);
    
  }
};

exports.findByJoinCode = async (req, res) => {
  const code = req.params.code
    const getClass = await ClassSession.findByJoinCode(code); 
        res.render('./admin/classes', {
      getClass
    })
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
  
  return res.render('./admin/codes', {
    referralCodes
  })
};
exports.findReferralCode = async (req, res) => {
  const  code = req.params.code
  const newCode = await ReferralCode.findByCode( code);
  res.json(newCode);
};
exports.createReferral = async (req, res) => {

  const { code, location, discount, maxUses, expires } = req.body;

  // chcek if code alrady exist
  // check if location is already set

  const newCode = await ReferralCode.create({ code, location, discount, maxUses, expires, id: uuidv4() });
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

// attendance section
exports.getAttendanceForSession =  async (req, res) => {
    const attendance = await Attendance.getAttendanceForSession(req.params.id); 
  console.log(attendance);
  
}


