const express = require("express");
const router = express.Router();
const {ensureVerifiedEmail} = require('../middleware/auth')
const { ensureAuthenticated } = require("../config/auth");




const adminRouter = require('../routes/adminRoutes')
const affiliateRouter = require('../routes/affiliateRoutes')
const authRouter = require('../routes/authRoutes')
const classRouter = require('../routes/classRoutes')
const indexRoutes =  require('../routes/index')
// const teacherRouter = require('../routes/teacherRoutes')
const userRouter = require('../routes/userRoutes');


router.use('/', indexRoutes)
router.use('/admin',ensureAuthenticated, ensureVerifiedEmail, adminRouter)
router.use('/affiliate', affiliateRouter)
router.use('/auth', authRouter)
router.use('/class',ensureAuthenticated, ensureVerifiedEmail, classRouter)
// router.use('/teacher',ensureAuthenticated, ensureVerifiedEmail, teacherRouter)
router.use('/user',ensureAuthenticated, ensureVerifiedEmail, userRouter)


module.exports = router