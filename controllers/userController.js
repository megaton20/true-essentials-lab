const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const pool = require('../config/db');

const Course = require('../models/Course');
const axios = require('axios');
const Affiliate = require('../models/Affiliate');
const Category = require('../models/Category');
const Enrollment = require('../models/Enrollment');
const Badge = require('../models/Badge');




exports.getDashboard = async (req, res) => {
  const userId = req.user.id;
  const customerToPay = 70000;
  
 
  try {
    const categories = await Category.allWithCourses(); 
    const freeCourses = await Course.findFree()

    
    res.render('./student/dashboard', {
      user: req.user,
      customerToPay,
      ebooks: [],
      categories:categories || [],
      freeCourses: freeCourses || []

    });

  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).send('Something went wrong. Please try again later.');
  }
};



exports.getCategoryCourses = async (req,res)=>{
  const userId = req.user.id
  const categoryId = req.params.id;
  const category = await Category.findById(categoryId);

  if (!category) {
    req.flash('error_msg', "category not found or was removed...")
    return res.redirect('/user')
  }
  const courses = await Course.findByCategory(categoryId);

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
    
      const enrolledCourses = await Enrollment.listEnrolledCourses(userId); // You may already have this
      const enrolledCourseIds = enrolledCourses.map(c => c.id); // extract just the course IDs
          

  res.render('./student/cat-details', {
    category,
    categoryId,
    courses,
    user: req.user,
    enrolledCourseIds
  });

}

// Updated getProfile function
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const banksRes = await axios.get('https://api.paystack.co/bank', {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });
    const banks = banksRes.data.data;

    // Fetch affiliate info
    const affiliateResult = await Affiliate.getAffiliateByUserId(userId);
    let isAffiliate = [];
    if (affiliateResult.length > 0) {
      isAffiliate = affiliateResult;
      const affiliate = isAffiliate[0];
      const matchedBank = banks.find(b => b.code === affiliate.bank_name);
      if (matchedBank) {
        affiliate.bank_name = matchedBank.name;
      }
    }

    // Get enrolled courses with progress and sessions
    const enrolledCourses = await Enrollment.listEnrolledCoursesWithProgress(userId);

    // Calculate overall progress and prepare badge data
    const profileStats = await calculateUserProgress(userId);

     // Check for new badges (optional - you might want to do this less frequently)
    await Badge.checkAndAwardBadges(userId);
    const earnedBadges = await Badge.getUserBadges(userId);
    const badgeProgress = await Badge.getUserBadgeProgress(userId);
    
    // utility function

    async function calculateUserProgress(userId) {
      try {
        const query = `
          SELECT 
            COUNT(DISTINCT e.course_id) as total_courses,
            COUNT(DISTINCT cs.id) as total_sessions,
            COUNT(DISTINCT ca.session_id) as attended_sessions,
            COUNT(DISTINCT CASE WHEN ca.status = true THEN ca.session_id END) as approved_sessions,
            COUNT(DISTINCT cv.id) as total_videos,
            COUNT(DISTINCT ub.badge_id) as badges_earned,
            MAX(e.enrolled_at) as last_enrollment
          FROM enrollment e
          LEFT JOIN courses c ON e.course_id = c.id
          LEFT JOIN class_sessions cs ON cs.course_id = c.id
          LEFT JOIN class_attendance ca ON ca.session_id = cs.id AND ca.user_id = $1 AND ca.is_joined = true
          LEFT JOIN class_videos cv ON cv.class_id = cs.id
          LEFT JOIN user_badges ub ON ub.user_id = $1
          WHERE e.user_id = $1 AND e.paid = true
        `;
        
        const { rows: [stats] } = await pool.query(query, [userId]);
        
        // Calculate completion rates
        stats.attendance_rate = stats.total_sessions > 0 
          ? Math.round((stats.attended_sessions / stats.total_sessions) * 100) 
          : 0;
          
        stats.approval_rate = stats.attended_sessions > 0 
          ? Math.round((stats.approved_sessions / stats.attended_sessions) * 100) 
          : 0;
        
        return stats;
      } catch (error) {
        console.error('Error calculating user progress:', error);
        return {};
      }
    }

    res.render('./student/profile', {
      user: req.user,
      banks,
      isAffiliate: isAffiliate[0] || [],
      enrolledCourses,
      profileStats,
      earnedBadges,
      badgeProgress
    });

  } catch (err) {
    console.error('Error loading profile:', err);
    req.flash("error_msg", "sorry error from server")
    res.redirect('/handler')
  }
};


exports.getCourses = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get enrolled course IDs for the user
    const enrolledCourses = await Enrollment.listEnrolledCourses(userId);
    
    res.render('./student/my-courses', {
      courses: enrolledCourses, // Filter out nulls
      user: req.user
    });

  } catch (err) {
    console.error('Error loading courses:', err);
    req.flash('error', 'Failed to load your courses.');
    res.redirect('/');
  }
};

exports.getCourseDetails = async (req, res) => {
  const courseId = req.params.id;

  try {
    // Get enrolled course IDs for the user
    const courseDetails = await Course.getCourseDetails(courseId);
    const isEnrolled = await Enrollment.isEnrolled(req.user.id, courseId);

    res.render('./student/courses-details', {
      course: courseDetails,
      isEnrolled, 
      user: req.user
    });

  } catch (err) {
    console.error('Error loading courses:', err);
    req.flash('error', 'Failed to load your courses.');
    res.redirect('/');
  }
};


exports.getFreeCourses = async (req, res) => {
  const userId = req.user.id;
  const customerToPay = 70000;
  
 
  try {
    const categories = await Category.allWithCourses(); 
    const freeCourses = await Course.allFreeCourses()

    
    res.render('./student/free-courses', {
      user: req.user,
      customerToPay,
      ebooks: [],
      categories:categories || [],
      freeCourses: freeCourses || []

    });

  } catch (err) {
    console.error('Error loading dashboard:', err);
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
    res.redirect('/')
  }
};


exports.getCourseSchedule = async (req, res) => {
  const categoryId =req.params.categoryId
  const courseId = req.params.id

  let sessions = await ClassSession.listByCourse(req.params.id);

const allSessionsComplete = sessions.length > 0 && sessions.every(session => session.is_complete);
  
  const sessionIds = sessions.map(s => s.id);
  const attendance = await Attendance.getBySessionIds(req.user.id, sessionIds);

  const creatorIds = [...new Set(sessions.map(s => s.created_by))];
  const creatorMap = await User.getManyByIds(creatorIds); // returns { id: user }

  const updatedSessions = sessions.map(session => ({
    ...session,
    is_joined: attendance[session.id] || false,
    teacher: creatorMap[session.created_by]?.full_name || 'Unknown Teacher'
  }));



    const { rows: referralCheck } = await pool.query(
      `SELECT * FROM referral_redemptions WHERE referred_user_id = $1 AND has_earned = $2`,
      [req.user.id, false]
    );

    if (referralCheck.length > 0) {
      req.user = {
        ...req.user,
        referrer_id: referralCheck[0].referrer_id
      };
    } else {
      req.user = {
        ...req.user,
      };
    }


  const courses = await Course.findById(courseId)

  res.render('./student/classes', {
    sessions: updatedSessions,
    user: req.user,
    categoryId,
    courseId,
    courses: courses || [],
    allSessionsComplete
  });
};

exports.getClassDetails = async (req, res) => {

   const session = await ClassSession.findById(req.params.id)
             // Fetch videos for this course
    const { rows: courseVideos } = await pool.query(
      `SELECT id, title, part_number, video_url, thumbnail_url
       FROM class_videos
       WHERE class_id = $1
       ORDER BY part_number ASC`,
      [req.params.id]
    );

  res.render('./student/class', {
    user: req.user,
    session: session || [],
    categoryId:req.params.categoryId,
    courseId:req.params.courseId,
    courseVideos: courseVideos || []
  });
};



exports.studentClassRecord = async (req, res) => {
    const userId = req.user.id;
 
 const courseID = await Course.findById(req.params.id)

    const sessions = await Attendance.studentClassHistory(userId, courseID.id)

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



exports.enrollInCourse = async (req, res) => {
  const user_id = req.user.id;
  const course_id = req.params.id;

  try {
    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({ status: false, message: 'Course not found.' });
    }

    const alreadyEnrolled = await Enrollment.isEnrolled(user_id, course_id);
    if (alreadyEnrolled) {
         req.flash('warning_msg', 'You’re already enrolled in this course.');
      return res.redirect('/user/my-courses');
      return res.status(409).json({ status: false, message: 'You are already enrolled in this course.' });
    }

    // Handle free course
    if (course.price <= 0) {
      await Enrollment.enroll({
        id: uuidv4(),
        user_id,
        course_id,
        paid: true,
        payment_id: null
      });

      req.flash('success_msg', 'Enrolled successfully for free');
      return res.redirect('/user/my-courses');

      return res.status(200).json({ status: true, message: '.' });
    }

    // Handle paid course
    const reference = uuidv4();
    const payment_id = uuidv4();

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: false, message: 'Email is required for payment.' });
    }

    const callbackUrl =
      `${process.env.LIVE_DIRR || process.env.NGROK_URL || `http://localhost:${process.env.PORT}`}/user/course/verify`;

    const paystackRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: course.price * 100, // Kobo
        reference,
        callback_url: callbackUrl,
        metadata: {
          userId: user_id,
          courseId: course_id,
          paymentId: payment_id
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    // Optional: Save pending payment record
    // await Payment.create({
    //   id: payment_id,
    //   user_id,
    //   course_id,
    //   amount: course.price,
    //   status: 'pending',
    //   reference
    // });

    return res.status(200).json({
      status: true,
      data: paystackRes.data.data // contains authorization_url
    });

  } catch (err) {
    console.error('Enrollment Error:', err?.response?.data || err.message);

    return res.status(500).json({
      status: false,
      message: 'Failed to enroll or initiate payment. Please try again.'
    });
  }
};