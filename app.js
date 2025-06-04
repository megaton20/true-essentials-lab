require('dotenv').config();
const express = require('express')
const app = express()
const session = require('express-session');
const bodyParser = require('body-parser')
const env = process.env
const database = require("./config/db")
const flash = require('connect-flash');
const passport = require('passport');
const path = require('path')
const { ensureAuthenticated } = require("./config/auth");




const initAllModels = require('./initAllModels');
initAllModels();


const PORT = env.PORT
// const user = require('./models/User')
const openRoutes = require('./routes/index')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const classRoutes = require('./routes/classRoutes')
const adminRoutes = require('./routes/adminRoutes')

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, './', 'public')));
// Middleware
// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Flash message usage example
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.warning_msg = req.flash('warning_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  // res.locals.msg = req.flash('msg');
  next();
});


app.use('/', openRoutes); // open less secure routes
app.use('/auth', authRoutes); // open less secure routes
app.use('/user',ensureAuthenticated, userRoutes); // open less secure routes
app.use('/class',ensureAuthenticated, classRoutes); // open less secure routes
app.use('/admin',ensureAuthenticated, adminRoutes); // open less secure routes


app.listen(PORT, ()=>{
    console.log(`listing...${PORT}`);
    
})