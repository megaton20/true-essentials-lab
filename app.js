require('dotenv').config();
const express = require('express')
const app = express()
const session = require('express-session');
const env = process.env
const database = require("./config/db")
const flash = require('connect-flash');
const passport = require('passport');
const path = require('path')

const PORT = env.PORT

// const user = require('./models/User')
const openRoutes = require('./routes/index')

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, './', 'public')));
// Middleware

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
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error'); // Passport uses 'error' by default
  next();
});


app.use('/', openRoutes); // open less secure routes


app.listen(PORT, ()=>{
    console.log(`listing...${PORT}`);
    
})