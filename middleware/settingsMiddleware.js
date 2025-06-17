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

        const currentSeason = await Season.getCurrent();
        
      if (!currentSeason) {
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
};
