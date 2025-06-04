const router = require('express').Router();
const ClassSession = require('../models/ClassSession');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');


router.get('/:link', async (req, res) => {
    // error message
   const link = req.params.link
  const code = await ClassSession.findByJoinCode(link)
  
  //  if (!code.status) {
  //     return res.redirect('/user')
  // hide link till time
  //  }
   
      res.render('./student/join', {
        link:code.meet_link
      })
});

router.get('/join/:link', async (req, res) => {
  const link = req.params.link

  
    if (1 == 1) {
      // success msg
       res.render('./student/joined')
    }else{
      // error message
      res.redirect('/user')
    }
});


// Admin creates a class
router.post('/create', admin, async (req, res) => {
  const { title, description, scheduledAt, meetLink } = req.body;
  const newClass = await ClassSession.create({ title, description, scheduledAt, meetLink, createdBy: req.userId });
  res.json(newClass);
});

// Admin toggles visibility of class link
router.post('/:id/toggle', admin, async (req, res) => {
  const { visible } = req.body;
  await ClassSession.toggleLinkVisibility(req.params.id, visible);
  res.json({ message: 'Visibility updated' });
});

// Student requests class link via join code
// router.get('/:joinCode/join', async (req, res) => {
//   const link = await ClassSession.getVisibleLink(req.params.joinCode);
//   if (!link) return res.status(403).json({ error: 'Class link not available yet' });
//   res.json({ meetLink: link });
// });

module.exports = router;
