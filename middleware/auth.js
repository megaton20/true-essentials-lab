const Affiliate = require("../models/Affiliate");
const Enrollment = require("../models/Enrollment");


module.exports =  {
    forwardVerifyAlert: function(req, res, next){
      
      if (req.user.is_email_verified) {
        console.log("already verified email...");
        
       return res.redirect('/handler')
      }
      return next()
    },
    
    forwardAlreadyAffiliate: function(req, res, next){
      
      if (req.user.is_affiliate) {
      
          req.flash('error_msg', `already an affiliate!`)
       return res.redirect('/affiliate/dashboard')
      }
      return next()
    },

     affiliateApplicationStatus: async function(req, res, next){
      const result =  await Affiliate.getSingleApplicationsStatus(req.user.id)
                  
      if (result.length > 0) {
        req.flash('error_msg', `already an applicant, wait!`)
       return res.redirect('/affiliate/pending/applicants')
      }
      return next()
    },
    

     ensureVerifiedEmail: function(req, res, next){
      
      if (req.user.is_email_verified) {
        return next()
      }
      console.log("verified email required...");
     return res.redirect('/auth/verify-alert')
    },

    ensureAdmin: function(req, res, next){

      if (req.user.role == 'admin') {
        return  next()
      }
      req.flash('error_msg', "invalid request...")
       return res.redirect('/user')
    },
    
    ensureTeacher: function(req, res, next){

      if (req.user.role == 'teacher') {
        return  next()
      }
      req.flash('error_msg', "invalid request...")
       return res.redirect('/user')
    },

       ensureEnrolled: async function(req, res, next){

        const isEnrolled = await Enrollment.isEnrolled(req.user.id, req.params.id);


      if (isEnrolled) {
        return  next()
      }

      req.flash('error_msg', "You need to pay to access this course ...")
       return res.redirect('/user')
    }

};