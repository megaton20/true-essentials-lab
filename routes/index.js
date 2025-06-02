const router = require('express').Router();


// Admin creates a class
router.get('/', async (req, res) => {
    res.render('index')
});
router.get('/read-more', async (req, res) => {
    res.render('read-more')
});


router.get('/verify-alert', async (req, res) => {
    res.render('verify-alert')
});
router.get('/email-sent', async (req, res) => {
    res.render('email-sent')
});



module.exports = router