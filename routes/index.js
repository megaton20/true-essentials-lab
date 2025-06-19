const router = require('express').Router();
const pool = require('../config/db');
const axios = require('axios');
const { ensureVerifiedEmail } = require('../middleware/auth')
const { checkRegistrationOpen, checkPaymentOpen } = require('../middleware/settingsMiddleware');

const { ensureAuthenticated } = require("../config/auth");
const Season = require('../models/Season');



// Admin creates a class
router.get('/', async (req, res) => {
  res.render('index')
});
router.get('/read-more', async (req, res) => {
  res.render('read-more')
});




router.get('/handler', (req, res) => {

  if (req.isAuthenticated()) {
    const role = req.user.role
    const user = req.user.full_name


    if (role == "admin") {
      req.flash("success_msg", `welcome back ${user}`);
      return res.redirect("/admin");

    } else if (role == "student") {
      return res.redirect("/user")
    }else if (role == "teacher") {
      return res.redirect("/teacher")
    }else {
      req.flash("error_msg", `please log in to use our valuable resources`);
      res.redirect('/auth/login')
    }

  } else {
    console.log("session expired");
    return res.redirect('/auth/login')
  }
})

// Logout route
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'You have logged out successfully.');
    res.redirect('/');
  });
});



router.get('/info/affiliate', (req, res) => {
  res.render('affiliate')
});

router.get('/info/affiliate/terms', (req, res) => {
  res.render('affiliate-terms')
});




// paystack
router.post('/pay', checkPaymentOpen, ensureAuthenticated, ensureVerifiedEmail, async (req, res) => {
  const { email, amount, referrerId } = req.body;


  req.session.referrerId = referrerId
  try {
    // Proceed with Paystack payment initialization
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount: amount * 100, // Paystack expects the amount in kobo
      callback_url: `${process.env.LIVE_DIRR || process.env.NGROK_URL || `http://localhost:${process.env.PORT}`}/verify`,
      metadata: {
        referrerId: referrerId || null,
        userId: req.user.id
      }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/verify',checkPaymentOpen, ensureAuthenticated, ensureVerifiedEmail, async (req, res) => {
  const reference = req.query.reference;

  if (!reference) {
    req.flash('error_msg', 'No reference provided');
    return res.redirect('/user');
  }

  try {
    // Verify transaction with Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    if (response.data.status && response.data.data.status === 'success') {
      const affiliateAgent = req.session.referrerId;

      if (affiliateAgent) {
        try {
          // Get the referrer's ID
          const { rows: agent } = await pool.query(
            `SELECT id FROM referrers WHERE user_id = $1`,
            [affiliateAgent]
          );

          if (agent.length > 0) {
            const referrerId = agent[0].id;

            // Mark referral as earned
            await pool.query(
              `UPDATE referral_redemptions 
                SET has_earned = $1 
                WHERE referrer_id = $2 AND referred_user_id = $3`,
              [true, referrerId, req.user.id]
            );

            // Fetch the referrer's current balance
            const { rows: userResults } = await pool.query(
              `SELECT balance FROM referrers WHERE user_id = $1`,
              [affiliateAgent]
            );

            const currentBalance = parseInt(userResults[0]?.balance || 0);
            const newCashback = currentBalance + 5000;

            // Update referrer's balance
            await pool.query(
              `UPDATE referrers SET balance = $1 WHERE user_id = $2`,
              [newCashback, affiliateAgent]
            );
          }
        } catch (error) {
          console.error('Error processing referral:', error);
          req.flash('error_msg', 'There was an issue processing the referral.');
          return res.redirect('/user');
        }
      }

      // Mark the current user as having paid
       const currentSeason = await Season.getCurrent();
       
      try {
      await pool.query(
                `UPDATE season_users 
                SET has_paid = $1, payment_reference = $4, paid_at = NOW() 
                WHERE user_id = $2 AND season_id = $3`,
                [true, req.user.id, currentSeason.id, reference]  // This is OK since order matches
              );

        req.flash('success_msg', 'Payment has been sent!');
      } catch (error) {
        console.error('Error updating payment status:', error);
        req.flash('error_msg', 'Failed to update payment status.');
      }

      return res.redirect('/user');


    } else {
      // Handle failed verification
      console.log('Payment verification failed:', response.data.data);
      req.flash('error_msg', 'Payment unsuccessful');
      return res.redirect('/user');
    }
  } catch (error) {

    console.log(`error on payment verification: ${error}`);

  }
});



// Paystack webhook handler
router.post('/webhook', async (req, res) => {
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');

  // Check Paystack webhook signature
  if (hash === req.headers['x-paystack-signature']) {
    const event = req.body;

    try {
      // Handle successful payments
      if (event.event === 'charge.success') {
        const { id, reference, amount, status, customer: { email }, paid_at, metadata } = event.data;

        const { referrerId } = metadata; // Retrieve discount from metadata
        const transactionId = id
        // Check if transaction already exists in the database to prevent duplication
        const existingTransactionQuery = `SELECT * FROM transactions WHERE reference = $1`;
        const { rows: existingTransaction } = await pool.query(existingTransactionQuery, [reference]);

        if (existingTransaction.length > 0) {
          console.log('Transaction already exists, no need to insert.');
          return res.sendStatus(200); // Acknowledge the webhook and exit
        }

        // Save transaction details to the database
        const insertTransactionQuery = `
          INSERT INTO transactions (transaction_id, reference, amount, status, email, paid_at, user_id,id) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        await pool.query(insertTransactionQuery, [transactionId, reference, amount / 100, status, email, paid_at, userId, uuidv4()]);

        // Fetch the user's current cashback using userId
        const userQuery = `SELECT balance FROM users WHERE id = $1`;
        const userResults = await query(userQuery, [userId]);
        const currentBalance = userResults.rows[0].balance || 0;

        // Apply the exact discount if cashback was applied
        if (referrerId) {
          const newCashback = Math.max(0, currentBalance - 5000); // Ensure cashback doesn't go below 0

          // Update user's cashback in the database
          const updateBalanceQuery = `UPDATE users SET balance = $1 WHERE "id" = $2`;
          await pool.query(updateBalanceQuery, [newCashback, referrerId]);
        }


        return res.sendStatus(200); // Acknowledge the webhook

      } else {
        console.log(`Unhandled event type: ${event.event}`);
        return res.sendStatus(200); // Acknowledge other unhandled events
      }
    } catch (error) {
      console.error('Error processing Paystack webhook:', error);
      return res.sendStatus(500); // Internal server error
    }
  } else {
    console.log('Invalid webhook signature');
    return res.sendStatus(400); // Bad request due to invalid signature
  }
});


module.exports = router