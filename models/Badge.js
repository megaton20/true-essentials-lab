// badgeModel.js
const pool = require('../config/db');
const createTableIfNotExists = require('../utils/createTableIfNotExists');

class Badge {
  static async init() {
    const createTableQuery = `
      CREATE TABLE badges (
        id VARCHAR PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(255),
        criteria_type VARCHAR(50) NOT NULL,
        criteria_value INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE user_badges (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        badge_id VARCHAR REFERENCES badges(id) ON DELETE CASCADE,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, badge_id)
      );
    `;
    
    await createTableIfNotExists('badges', createTableQuery.split(';')[0]);
    await createTableIfNotExists('user_badges', createTableQuery.split(';')[1]);
    
    // Insert default badges
    await this.createDefaultBadges();
  }

  static async createDefaultBadges() {
    const defaultBadges = [
      {
        id: 'first_course',
        name: 'First Course',
        description: 'Enrolled in your first course',
        icon: '🎯',
        criteria_type: 'courses_enrolled',
        criteria_value: 1
      },
      {
        id: 'course_explorer',
        name: 'Course Explorer',
        description: 'Enrolled in 5 courses',
        icon: '🧭',
        criteria_type: 'courses_enrolled',
        criteria_value: 5
      },
      {
        id: 'perfect_attendance',
        name: 'Perfect Attendance',
        description: 'Attended all sessions in a course',
        icon: '⭐',
        criteria_type: 'course_completion',
        criteria_value: 100
      },
      {
        id: 'quick_learner',
        name: 'Quick Learner',
        description: 'Completed a course with 100% attendance',
        icon: '🚀',
        criteria_type: 'course_completion',
        criteria_value: 100
      },
      {
        id: 'dedicated_student',
        name: 'Dedicated Student',
        description: 'Attended 10 sessions total',
        icon: '📚',
        criteria_type: 'sessions_attended',
        criteria_value: 10
      },
      {
        id: 'session_master',
        name: 'Session Master',
        description: 'Attended 25 sessions total',
        icon: '🏆',
        criteria_type: 'sessions_attended',
        criteria_value: 25
      },
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Attended your first session',
        icon: '🐦',
        criteria_type: 'first_session',
        criteria_value: 1
      },
      {
        id: 'consistent_learner',
        name: 'Consistent Learner',
        description: 'Maintained 80% attendance across all courses',
        icon: '📊',
        criteria_type: 'overall_attendance',
        criteria_value: 80
      },
      {
        id: 'video_binger',
        name: 'Video Bing-er',
        description: 'Watched videos from 5 different sessions',
        icon: '🎬',
        criteria_type: 'videos_watched',
        criteria_value: 5
      }
    ];

    for (const badge of defaultBadges) {
      await pool.query(`
        INSERT INTO badges (id, name, description, icon, criteria_type, criteria_value)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [badge.id, badge.name, badge.description, badge.icon, badge.criteria_type, badge.criteria_value]);
    }
  }

  static async getUserBadges(userId) {
    try {
      const { rows } = await pool.query(`
        SELECT b.*, ub.earned_at 
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = $1
        ORDER BY ub.earned_at DESC
      `, [userId]);
      
      return rows;
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }
  }

  static async awardBadge(userId, badgeId) {
    try {
      const badgeExists = await pool.query(
        'SELECT 1 FROM user_badges WHERE user_id = $1 AND badge_id = $2',
        [userId, badgeId]
      );

      if (badgeExists.rows.length > 0) {
        return false; // Badge already awarded
      }

      const { rows } = await pool.query(`
        INSERT INTO user_badges (id, user_id, badge_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [require('uuid').v4(), userId, badgeId]);

      console.log(`🎉 Badge awarded to user ${userId}: ${badgeId}`);
      return true;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return false;
    }
  }

  static async checkAndAwardBadges(userId) {
    try {
      console.log(`🔍 Checking badges for user: ${userId}`);
      
      // Get user progress statistics
      const userStats = await this.getUserProgressStats(userId);
      const allBadges = await this.getAllBadges();
      
      let awardedCount = 0;

      for (const badge of allBadges) {
        const shouldAward = await this.evaluateBadgeCriteria(userId, badge, userStats);
        
        if (shouldAward) {
          const awarded = await this.awardBadge(userId, badge.id);
          if (awarded) {
            awardedCount++;
            console.log(`🏆 Awarded badge: ${badge.name} to user ${userId}`);
          }
        }
      }

      console.log(`✅ Badge check completed. Awarded ${awardedCount} new badges.`);
      return awardedCount;
    } catch (error) {
      console.error('Error in checkAndAwardBadges:', error);
      return 0;
    }
  }

  static async getUserProgressStats(userId) {
    try {
      const query = `
        SELECT 
          -- Course stats
          COUNT(DISTINCT e.course_id) as total_courses,
          
          -- Session stats
          COUNT(DISTINCT cs.id) as total_sessions,
          COUNT(DISTINCT ca.session_id) as attended_sessions,
          COUNT(DISTINCT CASE WHEN ca.status = true THEN ca.session_id END) as approved_sessions,
          
          -- Course completion stats
          (
            SELECT COUNT(*)
            FROM (
              SELECT c.id
              FROM courses c
              JOIN enrollment e ON e.course_id = c.id
              LEFT JOIN class_sessions cs ON cs.course_id = c.id
              LEFT JOIN class_attendance ca ON ca.session_id = cs.id AND ca.user_id = $1 AND ca.is_joined = true
              WHERE e.user_id = $1 AND e.paid = true
              GROUP BY c.id
              HAVING COUNT(DISTINCT cs.id) > 0 
                AND COUNT(DISTINCT CASE WHEN ca.is_joined = true THEN ca.session_id END) = COUNT(DISTINCT cs.id)
            ) as completed_courses
          ) as completed_courses_count,
          
          -- Video stats
          COUNT(DISTINCT cv.id) as total_videos,
          
          -- Attendance rate
          CASE 
            WHEN COUNT(DISTINCT cs.id) = 0 THEN 0
            ELSE ROUND((COUNT(DISTINCT ca.session_id) * 100.0 / COUNT(DISTINCT cs.id)), 2)
          END as overall_attendance_rate
          
        FROM enrollment e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN class_sessions cs ON cs.course_id = c.id
        LEFT JOIN class_attendance ca ON ca.session_id = cs.id AND ca.user_id = $1
        LEFT JOIN class_videos cv ON cv.class_id = cs.id
        WHERE e.user_id = $1 AND e.paid = true;
      `;
      
      const { rows: [stats] } = await pool.query(query, [userId]);
      return stats || {};
    } catch (error) {
      console.error('Error getting user progress stats:', error);
      return {};
    }
  }

  static async getAllBadges() {
    try {
      const { rows } = await pool.query('SELECT * FROM badges ORDER BY criteria_value');
      return rows;
    } catch (error) {
      console.error('Error fetching all badges:', error);
      return [];
    }
  }

  static async evaluateBadgeCriteria(userId, badge, userStats) {
    const { criteria_type, criteria_value, id: badgeId } = badge;

    // Check if user already has this badge
    const hasBadge = await pool.query(
      'SELECT 1 FROM user_badges WHERE user_id = $1 AND badge_id = $2',
      [userId, badgeId]
    );

    if (hasBadge.rows.length > 0) {
      return false; // Already has the badge
    }

    switch (criteria_type) {
      case 'courses_enrolled':
        return (userStats.total_courses || 0) >= criteria_value;

      case 'sessions_attended':
        return (userStats.attended_sessions || 0) >= criteria_value;

      case 'course_completion':
        if (criteria_value === 100) {
          // Check if any course has 100% completion
          const completedCourse = await pool.query(`
            SELECT c.id
            FROM courses c
            JOIN enrollment e ON e.course_id = c.id
            LEFT JOIN class_sessions cs ON cs.course_id = c.id
            LEFT JOIN class_attendance ca ON ca.session_id = cs.id AND ca.user_id = $1 AND ca.is_joined = true
            WHERE e.user_id = $1 AND e.paid = true
            GROUP BY c.id
            HAVING COUNT(DISTINCT cs.id) > 0 
              AND COUNT(DISTINCT CASE WHEN ca.is_joined = true THEN ca.session_id END) = COUNT(DISTINCT cs.id)
            LIMIT 1
          `, [userId]);
          return completedCourse.rows.length > 0;
        }
        return false;

      case 'first_session':
        return (userStats.attended_sessions || 0) >= criteria_value;

      case 'overall_attendance':
        return (userStats.overall_attendance_rate || 0) >= criteria_value;

      case 'videos_watched':
        // For now, we'll use total videos available as a proxy for videos watched
        // You might want to implement actual video watching tracking
        return (userStats.total_videos || 0) >= criteria_value;

      default:
        return false;
    }
  }

  static async getRecentBadges(userId, limit = 5) {
    try {
      const { rows } = await pool.query(`
        SELECT b.*, ub.earned_at 
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = $1
        ORDER BY ub.earned_at DESC
        LIMIT $2
      `, [userId, limit]);
      
      return rows;
    } catch (error) {
      console.error('Error fetching recent badges:', error);
      return [];
    }
  }

  static async getUserBadgeProgress(userId) {
    try {
      const userStats = await this.getUserProgressStats(userId);
      const allBadges = await this.getAllBadges();
      const userBadges = await this.getUserBadges(userId);
      
      const userBadgeIds = new Set(userBadges.map(badge => badge.id));
      
      const progress = allBadges.map(badge => {
        const hasBadge = userBadgeIds.has(badge.id);
        const progress = this.calculateBadgeProgress(badge, userStats, hasBadge);
        
        return {
          ...badge,
          earned: hasBadge,
          progress: progress.percentage,
          current: progress.current,
          target: progress.target,
          earned_at: hasBadge ? userBadges.find(b => b.id === badge.id)?.earned_at : null
        };
      });
      
      return progress;
    } catch (error) {
      console.error('Error getting user badge progress:', error);
      return [];
    }
  }

  static calculateBadgeProgress(badge, userStats, hasBadge) {
    if (hasBadge) {
      return { percentage: 100, current: badge.criteria_value, target: badge.criteria_value };
    }

    const { criteria_type, criteria_value } = badge;
    let current = 0;

    switch (criteria_type) {
      case 'courses_enrolled':
        current = userStats.total_courses || 0;
        break;
      case 'sessions_attended':
        current = userStats.attended_sessions || 0;
        break;
      case 'overall_attendance':
        current = userStats.overall_attendance_rate || 0;
        break;
      case 'videos_watched':
        current = userStats.total_videos || 0;
        break;
      default:
        current = 0;
    }

    const percentage = Math.min(Math.round((current / criteria_value) * 100), 100);
    return { percentage, current, target: criteria_value };
  }
}

module.exports = Badge;