const router = require('express').Router();
const auth = require('../controllers/authController');

router.post('/register', auth.register);
router.get('/verify', auth.verifyEmail);
router.post('/login', auth.login);

module.exports = router;
