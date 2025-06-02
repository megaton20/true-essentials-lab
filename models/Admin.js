const pool = require('../config/db');
const User = require('../models/User'); // adjust path if needed

class Admin extends User {
// Dashboard statistics for admin panel
  static async getDashboardStats() {
    try {
      const totalStudentsRes = await pool.query(
        'SELECT COUNT(*) FROM users WHERE role = $1',
        ['student']
      );
      const pendingVerificationsRes = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = $1 AND is_email_verified = false",
        ['student']
      );
      const activeCodesRes = await pool.query(
        'SELECT COUNT(*) FROM referral_codes WHERE is_active = true'
      );
    //   const verifiedPaymentsRes = await pool.query(
    //     'SELECT COUNT(*) FROM payments WHERE status = $1',
    //     ['verified']
    //   );

      return {
        totalStudents: parseInt(totalStudentsRes.rows[0]?.count || 0, 10),
        // pendingVerifications: parseInt(pendingVerificationsRes.rows[0]?.count || 0, 10),
        activeCodes: parseInt(activeCodesRes.rows[0]?.count || 0, 10),
        // verifiedPayments: parseInt(verifiedPaymentsRes.rows[0]?.count || 0, 10),
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error.message);
      return {
        totalStudents: 0,
        pendingVerifications: 0,
        activeCodes: 0,
        // verifiedPayments: 0,
        error: true, // for frontend to detect fallback
      };
    }
  }

  // Class session status for control
        static async getClassStatus() {
        try {
            const res = await pool.query("SELECT status FROM class_sessions LIMIT 1");
            // Return status if exists, else 'closed'
            return res.rows[0]?.status ?? 'closed';
        } catch (error) {
            console.error("Error fetching class status:", error);
            // Return safe default on error
            return 'closed';
        }
        }


        static async setClassStatus(status) {

         try {
            return pool.query("UPDATE class_sessions SET status = $1", [status]);
        } catch (error) {
            console.error("Error updating class status:", error.message);
        }
           
        }

        static async allUsers(){
          try {
            return pool.query(`SELECT * FROM users ORDER BY createdAt DESC`)
          } catch (error) {
            console.log(error);
            
          }
        }

            isAdmin() {
            return this.role === 'admin';
            }

}

module.exports = Admin;
