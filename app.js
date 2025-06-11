require('dotenv').config();
const express = require('express')
const app = express()
const session = require('express-session');
const bodyParser = require('body-parser')
const ejsLayouts = require('express-ejs-layouts');
const env = process.env
const database = require("./config/db")
const flash = require('connect-flash');
const passport = require('passport');
const path = require('path')
const methodOverride = require('method-override');
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
const affiliateRoutes = require('./routes/affiliateRoutes')

app.set('view engine', 'ejs');
// app.use(ejsLayouts);
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

app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      let method = req.body._method;
      delete req.body._method;
      return method;
  }
}));


// Handle when the user clicks "Later" or visits the Black Friday page
app.post('/dismiss-modal', (req, res) => {
  // Set the session flag to indicate the modal has been dismissed
  req.session.blackFridayShown = true;
  res.redirect('/');
});


app.use('/', openRoutes); // open less secure routes
app.use('/auth', authRoutes); // open less secure routes
app.use('/user',ensureAuthenticated, userRoutes); // open less secure routes
app.use('/class',ensureAuthenticated, classRoutes); // open less secure routes
app.use('/admin',ensureAuthenticated, adminRoutes); // open less secure routes
app.use('/affiliate',ensureAuthenticated, affiliateRoutes); // open less secure routes


app.use((req, res) => {
  let userActive = req.user ? true : false;
  res.render('404', {
    pageTitle: `404`,
    userActive
  });
});

// General error handling middleware
app.use((err, req, res, next) => {
  console.log(err);
  let userActive = req.user ? true : false;
  res.redirect('/')
});



app.listen(PORT, ()=>{
    console.log(`listing...${PORT}`);
    
})