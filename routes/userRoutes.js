const router = require('express').Router();
const user = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.get('/dashboard', authMiddleware, user.getDashboard);
router.post('/payment', authMiddleware, user.completePayment);

module.exports = router;
