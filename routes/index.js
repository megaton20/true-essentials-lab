const router = require('express').Router();


// Admin creates a class
router.get('/', async (req, res) => {
    res.render('index')
});
router.get('/read-more', async (req, res) => {
    res.render('read-more')
});



router.get('/email-sent', async (req, res) => {
    res.render('email-sent')
});

router.get('/das', async (req, res) => {
    res.render('dash')
});



router.get('/handler', (req, res) => {

    if (req.isAuthenticated()) {
        const role = req.user.role
        const user = req.user.full_name


        if ((role == "admin")) {
            req.flash("success_msg", `welcome back ${user}`);
            return res.redirect("/admin");

        } else if (role == "student") {
            return res.redirect("/user")
        } else {
            req.flash("error_msg", `please log in to use our valuable resources`);
            res.redirect('/auth/login')
        }

    } else {
        console.log("session expired");
        return res.redirect('/')
    }
})

// Logout route
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'You have logged out successfully.');
    res.redirect('/');
  });
});

module.exports = router