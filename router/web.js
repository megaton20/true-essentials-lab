const express = require("express");
const router = express.Router();
const {ensureVerifiedEmail} = require('../middleware/auth')



const adminRouter = require('../routes/adminRoutes')
const affiliateRouter = require('../routes/affiliateRoutes')
const authRouter = require('../routes/authRoutes')
const classRouter = require('../routes/classRoutes')
const indexRoutes =  require('../routes/index')
const teacherRouter = require('../routes/teacherRoutes')
const userRouter = require('../routes/userRoutes')


router.use('/', indexRoutes)
router.use('/admin',ensureVerifiedEmail, adminRouter)
router.use('/affiliate', affiliateRouter)
router.use('/auth', authRouter)
router.use('/class',ensureVerifiedEmail, classRouter)
router.use('/teacher',ensureVerifiedEmail, teacherRouter)
router.use('/user',ensureVerifiedEmail, userRouter)


module.exports = router