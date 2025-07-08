const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const pool = require('../config/db');
const SeasonUser = require('../models/SeasonUsers');
const Season = require('../models/Season');
const Course = require('../models/Course');
const axios = require('axios');
const Affiliate = require('../models/Affiliate');
const Category = require('../models/Category');



exports.getDashboard = async (req, res) => {
  const userId = req.user.id;
  const customerToPay = 70000;
  
 
  try {
    const categories = await Category.allWithCourses(); 
    const currentSeason = await Season.getCurrent();

    if (!currentSeason) {
      // No active season
      req.flash('error', 'No active season available at the moment.');
      return res.render('./student/dashboard', {
        season: null,
        user: req.user,
        customerToPay,
        ebooks: [],
        categories:categories || []
      });
    }

    const userSeason = await SeasonUser.get(userId, currentSeason.id);

    // Merge season info into user
    req.user = {
      ...req.user,
      seasonInfo: userSeason,
    };
    

    res.render('./student/dashboard', {
      season: currentSeason,
      user: req.user,
      customerToPay,
      ebooks: [],
      categories:categories || []

    });

  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).send('Something went wrong. Please try again later.');
  }
};

exports.getCatDetails = async (req,res)=>{
  const userId = req.user.id
  const categoryId = req.params.id;
  const category = await Category.findById(categoryId);

  if (!category) {
    req.flash('error_msg', "category not found or was removed...")
    return res.redirect('/user')
  }
  const courses = await Course.findByCategory(categoryId);

      const currentSeason = await Season.getCurrent();
   if (!currentSeason) {
      // No active season
      req.flash('error', 'No active season available at the moment.');
      return res.redirect('/user');
    }

      const userSeason = await SeasonUser.get(userId, currentSeason.id);

    // Merge season info into user
    req.user = {
      ...req.user,
      seasonInfo: userSeason,
    };

    for (const course of courses) {
      const totalQuery = `SELECT COUNT(*) FROM class_sessions WHERE course_id = $1`;
      const completeQuery = `SELECT COUNT(*) FROM class_sessions WHERE course_id = $1 AND is_complete = true`;

      const totalRes = await pool.query(totalQuery, [course.id]);
      const completeRes = await pool.query(completeQuery, [course.id]);

      const total = parseInt(totalRes.rows[0].count);
      const completed = parseInt(completeRes.rows[0].count);

      course.total_sessions = total;
      course.completed_sessions = completed;
      course.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    }


  res.render('./student/cat-details', {
    category,
    categoryId,
    courses,
    user: req.user
  });

}


exports.getProfile = async (req, res) => {
  const userId = req.user.id;

try {
  const banksRes = await axios.get('https://api.paystack.co/bank', {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
    }
  });
  const banks = banksRes.data.data; // Array of bank objects (code + name)

  //  Fetch affiliate info (if the user is an affiliate)
  const affiliateResult = await Affiliate.getAffiliateByUserId(userId);

  let isAffiliate = [];
  if (affiliateResult.length > 0) {
    isAffiliate = affiliateResult;

    //  If affiliate has bank_code saved, find and attach corresponding bank name from Paystack list
    const affiliate = isAffiliate[0];
    const matchedBank = banks.find(b => b.code === affiliate.bank_name);
    
    if (matchedBank) {
      affiliate.bank_name = matchedBank.name; // Replace bank_code with human-readable name
    }
  }

  //  Check if a season is currently active
  const currentSeason = await Season.getCurrent();
  if (!currentSeason) {
    req.flash('error', 'No active season available at the moment.');
    return res.render('./student/profile', {
      season: null,
      user: req.user,
      banks: banks || [],
      isAffiliate: isAffiliate[0] || []
    });
  }

  // Get user’s registration info for current season
  const userSeason = await SeasonUser.get(userId, currentSeason.id);

  //  Merge season info into user object
  req.user = {
    ...req.user,
    seasonInfo: userSeason
  };

  // Render profile page with user + season + affiliate + bank data
  res.render('./student/profile', {
    season: currentSeason,
    user: req.user,
    banks,
    isAffiliate: isAffiliate[0] || []
  });

} catch (err) {
  console.error('Error loading profile:', err);
  res.status(500).send('Something went wrong. Please try again later.');
}

};

exports.editProfile = async (req, res) => {
  const {fullName, bio, phone} = req.body
  const userId = req.user.id;
  
  try {
    const isEdited = await User.update(fullName, bio, phone,userId);
    if (isEdited) {
      req.flash('success_msg', `${fullName} update done`)
    }else{
      req.flash('error_msg', `${fullName} update failed`)

    }
    
    return res.redirect('/user/profile')
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).send('Something went wrong. Please try again later.');
  }
};


exports.getCourseSchedule = async (req, res) => {
  const customerToPay = 70000;
  const backUrl =req.params.categoryId

  const currentSeason = await Season.getCurrent();
  let sessions = await ClassSession.listByCourse(req.params.id);

  const sessionIds = sessions.map(s => s.id);
  const attendance = await Attendance.getBySessionIds(req.user.id, sessionIds);

  const creatorIds = [...new Set(sessions.map(s => s.created_by))];
  const creatorMap = await User.getManyByIds(creatorIds); // returns { id: user }

  const updatedSessions = sessions.map(session => ({
    ...session,
    is_joined: attendance[session.id] || false,
    teacher: creatorMap[session.created_by]?.full_name || 'Unknown Teacher'
  }));

  let thisSeasonUser = [];
  let userSeason = null;
  let hasPaid = false;

  if (currentSeason) {
    thisSeasonUser = await SeasonUser.getSeasonsForUser(req.user.id);
    userSeason = await SeasonUser.get(req.user.id, currentSeason.id);

    if (thisSeasonUser.length > 0) {
      hasPaid = thisSeasonUser[0].has_paid;
    }
  }

const { rows: referralCheck } = await pool.query(
  `SELECT * FROM referral_redemptions WHERE referred_user_id = $1 AND has_earned = $2`,
  [req.user.id, false]
);

if (referralCheck.length > 0) {
  req.user = {
    ...req.user,
    has_paid: hasPaid,
    seasonInfo: userSeason,
    referrer_id: referralCheck[0].referrer_id
  };
} else {
  req.user = {
    ...req.user,
    has_paid: hasPaid,
    seasonInfo: userSeason
  };
}

// console.log(req.user.referrer_id);

  res.render('./student/classes', {
    sessions: updatedSessions,
    user: req.user,
    customerToPay,
    backUrl
  });
};

exports.getClassDetails = async (req, res) => {

   const session = await ClassSession.findById(req.params.id)
// chec \k if user is paid before contiuning
  res.render('./student/class', {
    user: req.user,
    session: session || []
  });
};

exports.getCourseForSeason= async (req, res) => {
    const userId = req.user.id;
    const customerToPay = 30000;
    
    const currentSeason = await Season.getCurrent()
    const sessions = await Attendance.studentClassHistory(userId, currentSeason.id);
    const userSeason = await SeasonUser.get(userId, currentSeason.id);

            req.user = {
        ...req.user,       // keep existing user info
        seasonInfo: userSeason  // add extra season-related info under a new key
        };
   
    
    // Get referrer who referred this user 
    const referrerQuery = await pool.query(
        `SELECT referrer_id FROM referral_redemptions WHERE referred_user_id = $1 LIMIT 1`,
        [req.user.id]
    );

    const affiliateId = referrerQuery.rows[0]?.referrer_id || null;

    let affiliateAgent = null;

    if (affiliateId) {
        const afiliateRecord = await pool.query(
            `SELECT user_id FROM referrers WHERE id = $1 LIMIT 1`,
            [affiliateId]
        );

        affiliateAgent = afiliateRecord.rows[0]?.user_id || null;
    }

    res.render('./student/dashboard', {
        sessions,
        user: req.user,
        customerToPay,
        affiliateAgent,
        ebooks:[]
    });

};

exports.studentClassRecord = async (req, res) => {
    const userId = req.user.id;
 const currentSeason = await Season.getCurrent()
 
 const courseID = await Course.findById(req.params.id)

    const sessions = await Attendance.studentClassHistory(req.user.id, courseID.id)
      const userSeason = await SeasonUser.get(userId, currentSeason.id);

            req.user = {
        ...req.user,       // keep existing user info
        seasonInfo: userSeason  // add extra season-related info under a new key
        };
    res.render('./student/classes', {
        sessions,
        user: req.user
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
