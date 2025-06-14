const ReferralCode = require('../models/ReferralCode');
const Setting = require('../models/Settings');
const Admin = require('../models/Admin');
const ClassSession = require('../models/ClassSession');
const { v4: uuidv4 } = require('uuid');
const Attendance = require('../models/Attendance');
const pool = require('../config/db')

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



exports.getClassSession = async (req, res) => {
  const id = req.params.id
    const attendance = await Attendance.getAttendanceForSession(id)

    const singleClass = await ClassSession.findById(id); 
        res.render('./admin/class', {
      singleClass,
      attendance
    })
};

exports.grantAccess = async (req, res) => {
  
  try {
    const { classId, userId } = req.params;
    const granted = req.body.granted 
    let grant 
    if (granted == "on") {
      grant = true
    }else{
      grant = false
    }
    
   const stats =  await Attendance.approveAttendance(classId, userId, grant);

   
    if (stats === 1 || stats === true) {
      req.flash("success_msg", "Access status updated.");
    } else {
      req.flash("error_msg", "Check failed");
    }
    
   return res.redirect(`/admin/class/${classId}`);


  } catch (err) {
    console.error(`error in grant access controller: ${err}`);
  }
}

exports.updateById = async (req, res) => {
  const {title, description, scheduled_at, meet_link }= req.body
  const id = req.params.id

  
  try {
 
    const singleClass = await ClassSession.update(title, description, scheduled_at, meet_link, id); 
    res.redirect(`/admin/class/${id}`) 
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
  const id = req.params.id
  const visible = req.params.status
try {
  const stats = await ClassSession.toggleLinkVisibility(id, visible); 

  if (stats === 1 || stats === true) {
    req.flash("success_msg", "Class status was updated successfully");
  } else {
    req.flash("error_msg", "Class status update failed");
  }

  return res.redirect(`/admin/class/${id}`);

} catch (error) {
  console.error(`Error updating class status: ${error}`);
  req.flash("error_msg", "Something went wrong while updating status.");
  return res.redirect(`/admin/class/${id}`);
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
exports.Setting = async (req, res) => {
  
  const settings = await Setting.getAll()
  // const {rows:settings} = await pool.query('SELECT * FROM settings');
  res.render('./admin/settings', { settings:settings[0] });

};

exports.toggleSetting = async (req, res) => {
  const { column } = req.params;

  try {
    const message = await Setting.toggleColumn(column);
    req.flash('success_msg', message);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', err.message || 'Failed to update setting.');
  }

  res.redirect('/admin/setting');
};

// attendance section
exports.getAttendanceForSession =  async (req, res) => {
    const attendance = await Attendance.getAttendanceForSession(req.params.id); 
  console.log(attendance);
  
}


