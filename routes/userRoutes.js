const router = require('express').Router();
const user = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const ClassSession = require('../models/ClassSession');
const {ensureVerifiedEmail} = require('../middleware/auth')



// /dashboard/:userId
router.get('/', ensureVerifiedEmail, async (req, res) => {

   let sessions = await ClassSession.listAll()
    const now = new Date();
        sessions = sessions.map(s => {
        const classTime = new Date(s.scheduled_at);
        const isFuture = classTime > now;
        
        let cardColor = 'secondary'; // default gray
        let buttonState = { text: 'Unavailable', disabled: true };

        if (s.status === true) {
            cardColor = 'success'; // green
            buttonState = { text: 'Joined', disabled: true, icon: 'fa-check' };
        } else if (s.status === false && !isFuture) {
            cardColor = 'danger'; // red for closed
            buttonState = { text: 'Closed', disabled: true, icon: 'fa-lock' };
        } else if (s.status !== true && isFuture) {
            cardColor = 'warning'; // yellow for upcoming
            buttonState = { text: 'Join Now', disabled: false, icon: 'fa-bell' };
        }

        return {
            ...s,
            dateString: classTime.toLocaleString(),
            cardColor,
            buttonState,
        };
        });


        
    res.render('./student/dashboard',{
        sessions,
        user:{name: req.user.full_name, email: req.user.email}
    })
});


// router.get('/dashboard', authMiddleware, user.getDashboard);
// router.post('/payment', authMiddleware, user.completePayment);

module.exports = router;
