require('dotenv').config();
const express = require('express')
const app = express()
const session = require('express-session');
const bodyParser = require('body-parser')
const ejsLayouts = require('express-ejs-layouts');
const env = process.env
const flash = require('connect-flash');
const passport = require('passport');
const path = require('path')
const methodOverride = require('method-override');




const initAllModels = require('./initAllModels');
initAllModels();
require('./jobs/scheduler');


const PORT = env.PORT


app.set('view engine', 'ejs');
app.use(ejsLayouts);
app.use(express.static(path.join(__dirname, './', 'public')));
// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
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
  next();
});

app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      let method = req.body._method;
      delete req.body._method;
      return method;
  }
}));

// Routers
const web = require('./router/web');
const api = require('./router/api');


app.use((req, res, next)=>{
 req.isAPI = req.originalUrl.startsWith("/api")
  next()

})

//  Routes
app.use('/', web); 
app.use('/api', api); 


app.post('/api/update-join-status', (req, res) => {
  try {
    // Set to true to indicate user has seen/joined, so don't show modal again
    req.session.showJoinCommunity = true;
    res.json({ success: true });
  } catch (error) {
    console.log(`error from joining community: ${error}`);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

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


if (PORT) {
  app.listen(PORT, ()=>{
    console.log(`listing...${PORT}`);
})
}else{
  app.listen()
}

