const router = require('express').Router();


// Admin creates a class
router.get('/', async (req, res) => {
    res.render('index')
});
router.get('/read-more', async (req, res) => {
    res.render('read-more')
});
router.get('/register', async (req, res) => {
    res.render('register')
});
router.get('/login', async (req, res) => {
    res.render('login')
});
router.get('/verify-alert', async (req, res) => {
    res.render('verify-alert')
});
router.get('/email-sent', async (req, res) => {
    res.render('email-sent')
});

// /dashboard/:userId
router.get('/dashboard', async (req, res) => {
    res.render('./student/dashboard')
});
// /dashboard/:userId
router.get('/dashboard/join', async (req, res) => {
    res.render('./student/join')
});
router.get('/dashboard/joined', async (req, res) => {
    res.render('./student/joined')
});

module.exports = router