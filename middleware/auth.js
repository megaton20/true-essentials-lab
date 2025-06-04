

module.exports =  {
    farwardVerifyAlert: function(req, res, next){
      
      if (req.user.is_email_verified) {
        console.log("already verified email...");
        
       return res.redirect('/user')
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
       return res.redirect('/')
    }

};