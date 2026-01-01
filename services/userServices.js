const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const pool = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const Affiliate = require('../models/Affiliate');
const Badge = require('../models/Badge');
const ReferralCode = require('../models/ReferralCode');

class UserService {
  // ==================== DASHBOARD ====================
  static async getDashboard(userId) {
    try {
      const categories = await Category.allWithCourses();
      const freeCourses = await Course.findFree();

    

      const getEnrolledCount = async () => {
        return []
      }
      const getCompletedCount = async () => {
        return []
      }
      const getHoursLearned = async () => {
        return []
      }
      const getLearningStreak = async () => {
        return []
      }

   
      const getActiveCourses = async () => {
        return []
      }
      const getUpcomingSessions = async () => {
        return []
      }
      const getRecentlyViewed = async () => {
        return []
      }
      const getAchievements = async () => {
        return []
      }
      const getRecommendedCourses = async () => {
        return []
      }

        const stats = {
        enrolledCourses: await getEnrolledCount(userId),
        completedCourses: await getCompletedCount(userId),
        hoursLearned: await getHoursLearned(userId),
        streak: await getLearningStreak(userId)
      };


      return {
        success: true,
        data: {
          categories: categories || [],
          freeCourses: freeCourses || [],
          customerToPay: 70000,
          stats,
          activeCourses: await getActiveCourses(userId),
          upcomingSessions: await getUpcomingSessions(userId),
          recentCourses: await getRecentlyViewed(userId),
          achievements: await getAchievements(userId),
          recommendedCourses: await getRecommendedCourses(userId),
        }
      };
    } catch (error) {
      console.error('Dashboard service error:', error);
      return {
        success: false,
        error: 'Failed to load dashboard',
        statusCode: 500
      };
    }
  }

  // ==================== CATEGORY COURSES ====================
  static async getCategoryCourses(userId, categoryId) {
    try {
      const category = await Category.findById(categoryId);

      if (!category) {
        return {
          success: false,
          error: 'Category not found',
          statusCode: 404
        };
      }

      const courses = await Course.findByCategory(categoryId);

      // Calculate progress for each course
      for (const course of courses) {
        const totalRes = await pool.query(
          `SELECT COUNT(*) FROM class_sessions WHERE course_id = $1`,
          [course.id]
        );
        const completeRes = await pool.query(
          `SELECT COUNT(*) FROM class_sessions WHERE course_id = $1 AND is_complete = true`,
          [course.id]
        );

        const total = parseInt(totalRes.rows[0].count);
        const completed = parseInt(completeRes.rows[0].count);

        course.total_sessions = total;
        course.completed_sessions = completed;
        course.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      }

      const enrolledCourses = await Enrollment.listEnrolledCourses(userId);
      const enrolledCourseIds = enrolledCourses.map(c => c.id);

      return {
        success: true,
        data: {
          category,
          courses,
          enrolledCourseIds
        }
      };
    } catch (error) {
      console.error('Category courses service error:', error);
      return {
        success: false,
        error: 'Failed to load category courses',
        statusCode: 500
      };
    }
  }

  // ==================== PROFILE ====================
  static async getProfile(userId) {
    try {
      // Fetch banks from Paystack
      let banks = [];
      try {
        const banksRes = await axios.get('https://api.paystack.co/bank', {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        });
        banks = banksRes.data.data;
      } catch (paystackError) {
        console.error('Paystack banks error:', paystackError);
        // Continue without banks
      }

      // Fetch affiliate info
      const affiliateResult = await Affiliate.getAffiliateByUserId(userId);
      let affiliate = null;
      if (affiliateResult.length > 0) {
        affiliate = affiliateResult[0];
        if (affiliate.bank_name) {
          const matchedBank = banks.find(b => b.code === affiliate.bank_name);
          if (matchedBank) {
            affiliate.bank_name = matchedBank.name;
          }
        }
      }

      // Get enrolled courses with progress
      const enrolledCourses = await Enrollment.listEnrolledCoursesWithProgress(userId);

      // Calculate profile stats
      const profileStats = await UserService.calculateUserProgress(userId);

      // Check and award badges
      await Badge.checkAndAwardBadges(userId);
      const earnedBadges = await Badge.getUserBadges(userId);
      const badgeProgress = await Badge.getUserBadgeProgress(userId);

      return {
        success: true,
        data: {
          banks,
          affiliate: affiliate || {},
          enrolledCourses,
          profileStats,
          earnedBadges,
          badgeProgress
        }
      };
    } catch (error) {
      console.error('Profile service error:', error);
      return {
        success: false,
        error: 'Failed to load profile',
        statusCode: 500
      };
    }
  }

  // ==================== COURSES ====================
  static async getCourses(userId) {
    try {
      const enrolledCourses = await Enrollment.listEnrolledCourses(userId);

      return {
        success: true,
        data: {
          courses: enrolledCourses
        }
      };
    } catch (error) {
      console.error('Courses service error:', error);
      return {
        success: false,
        error: 'Failed to load courses',
        statusCode: 500
      };
    }
  }

  static async getCourseDetails(userId, courseId) {
    try {
      const courseDetails = await Course.getCourseDetails(courseId);
      const isEnrolled = await Enrollment.isEnrolled(userId, courseId);

      return {
        success: true,
        data: {
          course: courseDetails,
          isEnrolled
        }
      };
    } catch (error) {
      console.error('Course details service error:', error);
      return {
        success: false,
        error: 'Failed to load course details',
        statusCode: 500
      };
    }
  }

  // ==================== FREE COURSES ====================
  static async getFreeCourses(userId) {
    try {
      const categories = await Category.allWithCourses();
      const freeCourses = await Course.allFreeCourses();

      return {
        success: true,
        data: {
          categories: categories || [],
          freeCourses: freeCourses || []
        }
      };
    } catch (error) {
      console.error('Free courses service error:', error);
      return {
        success: false,
        error: 'Failed to load free courses',
        statusCode: 500
      };
    }
  }

  // ==================== EDIT PROFILE ====================
  static async editProfile(userId, profileData) {
    try {
      const { fullName, bio, phone } = profileData;

      if (!fullName) {
        return {
          success: false,
          error: 'Full name is required',
          statusCode: 400
        };
      }

      const isEdited = await User.update(fullName, bio, phone, userId);

      return {
        success: isEdited,
        data: {
          message: isEdited
            ? 'Profile updated successfully'
            : 'Failed to update profile'
        }
      };
    } catch (error) {
      console.error('Edit profile service error:', error);
      return {
        success: false,
        error: 'Failed to update profile',
        statusCode: 500
      };
    }
  }

  // ==================== COURSE SCHEDULE ====================
  static async getCourseSchedule(userId, categoryId, courseId) {
    try {
      const sessions = await ClassSession.listByCourse(courseId);
      const allSessionsComplete = sessions.length > 0 &&
        sessions.every(session => session.is_complete);

      const sessionIds = sessions.map(s => s.id);
      const attendance = await Attendance.getBySessionIds(userId, sessionIds);

      const creatorIds = [...new Set(sessions.map(s => s.created_by))];
      const creatorMap = await User.getManyByIds(creatorIds);

      const updatedSessions = sessions.map(session => ({
        ...session,
        is_joined: attendance[session.id] || false,
        teacher: creatorMap[session.created_by]?.full_name || 'Unknown Teacher'
      }));

      // Check referral
      const { rows: referralCheck } = await pool.query(
        `SELECT * FROM referral_redemptions WHERE referred_user_id = $1 AND has_earned = $2`,
        [userId, false]
      );

      const referrerId = referralCheck.length > 0 ? referralCheck[0].referrer_id : null;

      const course = await Course.findById(courseId);

      return {
        success: true,
        data: {
          sessions: updatedSessions,
          categoryId,
          courseId,
          courses: course || {},
          allSessionsComplete,
          referrerId
        }
      };
    } catch (error) {
      console.error('Course schedule service error:', error);
      return {
        success: false,
        error: 'Failed to load course schedule',
        statusCode: 500
      };
    }
  }

  // ==================== CLASS DETAILS ====================
  static async getClassDetails(userId, classId, categoryId, courseId) {
    try {
      const session = await ClassSession.findById(classId);

      const { rows: courseVideos } = await pool.query(
        `SELECT id, title, part_number, video_url, thumbnail_url
         FROM class_videos
         WHERE class_id = $1
         ORDER BY part_number ASC`,
        [classId]
      );

      return {
        success: true,
        data: {
          session: session || {},
          categoryId,
          courseId,
          courseVideos: courseVideos || []
        }
      };
    } catch (error) {
      console.error('Class details service error:', error);
      return {
        success: false,
        error: 'Failed to load class details',
        statusCode: 500
      };
    }
  }

  // ==================== STUDENT CLASS RECORD ====================
  static async getStudentClassRecord(userId, courseId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        return {
          success: false,
          error: 'Course not found',
          statusCode: 404
        };
      }

      const sessions = await Attendance.studentClassHistory(userId, course.id);

      return {
        success: true,
        data: {
          sessions,
          course
        }
      };
    } catch (error) {
      console.error('Student class record service error:', error);
      return {
        success: false,
        error: 'Failed to load class record',
        statusCode: 500
      };
    }
  }

  // ==================== ENROLLMENT ====================
  static async enrollInCourse(userId, courseId, email) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        return {
          success: false,
          error: 'Course not found',
          statusCode: 404
        };
      }

      const alreadyEnrolled = await Enrollment.isEnrolled(userId, courseId);
      if (alreadyEnrolled) {
        return {
          success: false,
          error: 'You are already enrolled in this course',
          statusCode: 409,
          alreadyEnrolled: true
        };
      }

      // Handle free course
      if (course.price <= 0) {
        await Enrollment.enroll({
          id: uuidv4(),
          user_id: userId,
          course_id: courseId,
          paid: true,
          payment_id: null
        });

        return {
          success: true,
          data: {
            message: 'Enrolled successfully for free',
            isFree: true
          }
        };
      }

      // Handle paid course
      if (!email) {
        return {
          success: false,
          error: 'Email is required for payment',
          statusCode: 400
        };
      }

      const reference = uuidv4();
      const payment_id = uuidv4();

      const callbackUrl = `${process.env.LIVE_DIRR || process.env.NGROK_URL || `http://localhost:${process.env.PORT}`}/user/course/verify`;

      const paystackRes = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: course.price * 100, // Kobo
          reference,
          callback_url: callbackUrl,
          metadata: {
            userId,
            courseId,
            paymentId: payment_id
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      // Save pending payment record 
      // await Payment.create({
      //   id: payment_id,
      //   user_id: userId,
      //   course_id: courseId,
      //   amount: course.price,
      //   status: 'pending',
      //   reference
      // });

      return {
        success: true,
        data: {
          message: 'Payment initiated',
          isFree: false,
          paymentData: paystackRes.data.data,
          reference
        }
      };

    } catch (error) {
      console.error('Enrollment service error:', error);
      return {
        success: false,
        error: 'Failed to enroll in course',
        statusCode: 500
      };
    }
  }

  // ==================== PAYMENT VERIFICATION ====================
  static async verifyCoursePayment(reference) {
    try {
      if (!reference) {
        return {
          success: false,
          error: 'Payment reference is required',
          statusCode: 400
        };
      }

      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      if (response.data.status && response.data.data.status === 'success') {
        const metadata = response.data.data.metadata;

        await Enrollment.enroll({
          id: uuidv4(),
          user_id: metadata.userId,
          course_id: metadata.courseId,
          paid: true,
          payment_id: null
        });

        return {
          success: true,
          data: {
            message: 'Enrolled successfully in the course!',
            courseId: metadata.courseId
          }
        };
      } else {
        return {
          success: false,
          error: 'Payment verification failed',
          statusCode: 400
        };
      }
    } catch (error) {
      console.error('Payment verification service error:', error);
      return {
        success: false,
        error: 'Payment verification failed',
        statusCode: 500
      };
    }
  }

  // ==================== HELPER METHODS ====================
  static async calculateUserProgress(userId) {
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

      // Calculate rates
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
}

module.exports = UserService;