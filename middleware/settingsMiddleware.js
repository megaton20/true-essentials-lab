const pool = require('../config/db');
const Season = require('../models/Season');

// Check if registration is allowed
async function checkRegistrationOpen(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT is_registration_open FROM settings LIMIT 1');
    const isOpen = rows.length > 0 ? rows[0].is_registration_open : false;
    
    
    if (!isOpen) {
      req.flash('error_msg', 'Registration is currently closed.');
      return res.redirect('/auth/registration-closed');
    }

    next();
  } catch (err) {
    console.error('Error checking registration setting:', err);
    req.flash('error_msg', 'Unable to process request.');
    return res.redirect('/auth/login');
  }
}

async function checkingActiveSeason(req, res, next) {
  try {


        const currentSeason = await Season.getCurrent();
      if (currentSeason) {
       return next();
      }
      req.flash('error_msg', 'No new batch, Sign in if you joined previous batch...');
      return res.redirect('/auth/login');
  } catch (err) {
    console.error('Error checking season status:', err);
    req.flash('error_msg', 'Unable to process request.');
    return res.redirect('/auth/login');
  }
}

// Check if payment is enabled
async function checkPaymentOpen(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT is_payment_open FROM settings LIMIT 1');
    const isOpen = rows.length > 0 ? rows[0].is_payment_open : true;

    if (!isOpen) {
      req.flash('error_msg', 'Payments are currently disabled.');
      return res.redirect('/user');
    }

    next();
  } catch (err) {
    console.error('Error checking payment setting:', err);
    req.flash('error_msg', 'Unable to process request.');
    return res.redirect('/user');
  }
}



module.exports = {
  checkRegistrationOpen,
  checkPaymentOpen,
  checkingActiveSeason,
};
