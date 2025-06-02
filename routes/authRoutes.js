const router = require('express').Router();
const auth = require('../controllers/authController');

router.get('/register', auth.registerPage);
router.post('/register', auth.register);

router.get('/login', auth.loginPage);
router.post('/login', auth.login);

router.get('/verify', auth.verifyEmail);

module.exports = router;
