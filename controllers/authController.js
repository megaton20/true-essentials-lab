const jwt = require('jsonwebtoken');
const AuthServices = require('../services/authServices');

const baseUrl = process.env.LIVE_DIRR || `http://localhost:${process.env.PORT}`;

// ==================== PAGE RENDERING ====================
exports.registerPage = async (req, res) => {
  const { userActive, referrerCode } = await AuthServices.registerPage(req);

  if (req.isAPI) {
    return res.json({
      success: true,
      data: { userActive, referrerCode }
    });
  }

  res.render('register', {
    referralCode: referrerCode,
    messages: req.flash() // Pass flash messages to view
  });
};

exports.loginPage = async (req, res) => {
  const { userActive } = await AuthServices.loginPage(req);

  if (req.isAPI) {
    return res.json({
      success: true,
      data: { userActive }
    });
  }

  res.render('login', {
    messages: req.flash() // Pass flash messages to view
  });
};

// ==================== USER REGISTRATION ====================
exports.userCreate = async (req, res, next) => {
  try {
    const result = await AuthServices.createUser(req.body);

    if (!result.success) {
      // For web - set flash message and redirect
      if (!req.isAPI) {
        req.flash('error_msg', result.error);
        return res.redirect('/auth/register');
      }
      // For API - return JSON
      return res.status(result.statusCode || 400).json({
        success: false,
        error: result.error
      });
    }

    const { user } = result;

    if (req.isAPI) {
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
          },
          token
        }
      });
    } else {
      // Web registration success
      req.login(user, (err) => {
        if (err) {
          req.flash('error_msg', 'Login failed. Please try again.');
          return res.redirect('/auth/register');
        }

        req.flash('success_msg', 'Registration successful! Welcome to True Series Academy.');
        return res.redirect('/handler');
      });
    }

  } catch (error) {
    console.error('User creation error:', error);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Registration failed. Please try again.'
      });
    }
    
    req.flash('error_msg', 'Something went wrong. Please try again.');
    return res.redirect('/auth/register');
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      if (req.isAPI) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }
      req.flash('error_msg', 'Email and password are required');
      return res.redirect('/auth/login');
    }

    const result = await AuthServices.login({ email, password }, req);

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result
      });
    } else {
      // Web login success
      const redirectUrl = req.session.returnTo || '/handler';
      delete req.session.returnTo;

      req.flash('success_msg', 'Login successful! Welcome back.');
      return res.redirect(redirectUrl);
    }

  } catch (error) {
    console.error('Login error:', error.message);
    
    if (req.isAPI) {
      return res.status(401).json({
        success: false,
        error: error.message || 'Invalid email or password'
      });
    }
    
    req.flash('error_msg', error.message || 'Invalid email or password');
    return res.redirect('/auth/login');
  }
};

// ==================== EMAIL VERIFICATION ====================
exports.verifyEmailRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      if (req.isAPI) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }
      req.flash('error_msg', 'Email is required');
      return res.redirect('/auth/verify-alert');
    }

    const result = await AuthServices.requestEmailVerification(email, baseUrl);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }

      // Web error handling with appropriate flash type
      if (result.alreadyVerified) {
        req.flash('warning_msg', result.error);
        return res.redirect('/handler');
      } else {
        req.flash('error_msg', result.error);
        return res.redirect('/auth/verify-alert');
      }
    }

    const { emailSent } = result.data;

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    // Web success
    if (emailSent) {
      req.flash('success_msg', 'Verification email sent! Check your inbox or spam folder.');
      return res.redirect('/auth/verify-email-sent');
    } else {
      req.flash('warning_msg', 'Token generated but email failed to send. Please try again.');
      return res.redirect('/auth/verify-alert');
    }

  } catch (error) {
    console.error('Email verification request error:', error);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'An error occurred while processing your request'
      });
    }
    
    req.flash('error_msg', 'An error occurred while processing your request');
    return res.redirect('/auth/verify-alert');
  }
};

exports.verifyEmailCallBack = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      if (req.isAPI) {
        return res.status(400).json({
          success: false,
          error: 'Verification token is required'
        });
      }
      req.flash('error_msg', 'Verification token is required');
      return res.redirect('/handler');
    }

    const result = await AuthServices.verifyEmailCallback(token);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }

      req.flash('error_msg', result.error);
      return res.redirect('/handler');
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    // Web success
    req.flash('success_msg', 'Email verified successfully! Your account is now active.');
    return res.redirect('/handler');

  } catch (error) {
    console.error('Email verification callback error:', error);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'An error occurred during verification'
      });
    }
    
    req.flash('error_msg', 'An error occurred during verification');
    return res.redirect('/handler');
  }
};

// ==================== VERIFICATION PAGES ====================
exports.verifyNotice = async (req, res) => {
  const user = {
    name: req.user?.full_name || 'User',
    email: req.user?.email || 'No email'
  };

  if (req.isAPI) {
    return res.json({
      success: true,
      data: { user }
    });
  }

  return res.render('verify-alert', {
    ...user,
    messages: req.flash() // Pass flash messages
  });
};

exports.verifyCompleted = async (req, res) => {
  const user = {
    name: req.user?.full_name || 'User',
    email: req.user?.email || 'No email'
  };

  if (req.isAPI) {
    return res.json({
      success: true,
      data: { user }
    });
  }

  return res.render('verify-success', {
    ...user,
    messages: req.flash() // Pass flash messages
  });
};

exports.verifySent = async (req, res) => {
  const user = {
    name: req.user?.full_name || 'User',
    email: req.user?.email || 'No email'
  };

  if (req.isAPI) {
    return res.json({
      success: true,
      data: { user }
    });
  }

  return res.render('verify-sent', {
    ...user,
    messages: req.flash() // Pass flash messages
  });
};

// ==================== PASSWORD RESET ====================
exports.forgetPasswordPage = async (req, res) => {
  if (req.isAPI) {
    return res.json({
      success: true,
      data: { message: 'Password reset page' }
    });
  }

  return res.render('forget-password', {
    pageTitle: 'Enter recovery email',
    messages: req.flash() // Pass flash messages
  });
};

exports.passwordChangeRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      if (req.isAPI) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }
      req.flash('error_msg', 'Email is required');
      return res.redirect('/auth/forget-password');
    }

    const result = await AuthServices.requestPasswordReset(email, baseUrl);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }

      req.flash('error_msg', result.error);
      return res.redirect('/auth/forget-password');
    }

    const { emailSent } = result.data;

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    if (emailSent) {
      req.flash('success_msg', 'Password reset instructions sent to your email!');
      return res.redirect('/auth/request-password/success');
    } else {
      req.flash('warning_msg', 'Failed to send email. Please try again.');
      return res.redirect('/auth/forget-password');
    }

  } catch (error) {
    console.error('Password change request error:', error);

    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'An error occurred'
      });
    }

    req.flash('error_msg', 'An error occurred. Please try again.');
    return res.redirect('/auth/forget-password');
  }
};

exports.passwordChangeRequestSentPage = async (req, res) => {
  if (req.isAPI) {
    return res.json({
      success: true,
      data: { message: 'Password reset email sent' }
    });
  }

  return res.render('forget-new-sent', {
    pageTitle: 'Password Reset Sent',
    messages: req.flash() // Pass flash messages
  });
};

exports.resetPasswordChangeTokenVerification = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      if (req.isAPI) {
        return res.status(400).json({
          success: false,
          error: 'Token is required'
        });
      }
      req.flash('error_msg', 'Token is required');
      return res.redirect('/auth/forget-password');
    }

    const result = await AuthServices.verifyResetToken(token);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }

      req.flash('error_msg', result.error);
      return res.redirect('/auth/forget-password');
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    return res.render('forget-new-password', {
      token,
      email: result.data.email,
      messages: req.flash() // Pass flash messages
    });

  } catch (error) {
    console.error('Token verification error:', error);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Token verification failed'
      });
    }
    
    req.flash('error_msg', 'Invalid reset link');
    return res.redirect('/auth/forget-password');
  }
};

exports.changePasswordChangeTokenVerification = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirm } = req.body;

    if (!token) {
      if (req.isAPI) {
        return res.status(400).json({
          success: false,
          error: 'Token is required'
        });
      }
      req.flash('error_msg', 'Token is required');
      return res.redirect('/auth/forget-password');
    }

    if (!password || !confirm) {
      if (req.isAPI) {
        return res.status(400).json({
          success: false,
          error: 'Password and confirmation are required'
        });
      }
      req.flash('error_msg', 'Password and confirmation are required');
      return res.redirect(`/auth/reset-password/${token}`);
    }

    const result = await AuthServices.changePasswordWithToken(token, password, confirm);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }

      req.flash('error_msg', result.error);
      return res.redirect(`/auth/reset-password/${token}`);
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    req.flash('success_msg', 'Password changed successfully! You can now login with your new password.');
    return res.redirect('/auth/login');

  } catch (error) {
    console.error('Password change error:', error);

    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }

    req.flash('error_msg', 'Failed to change password. Please try again.');
    return res.redirect(`/auth/reset-password/${token}`);
  }
};

// ==================== LOGOUT ====================
exports.logout = (req, res) => {
  if (req.isAPI) {
    // For API - just return success
    return res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  }
  
  // For web - logout and redirect with flash message
  req.logout((err) => {
    if (err) {
      req.flash('error_msg', 'Logout failed');
      return res.redirect('/handler');
    }
    
    req.flash('success_msg', 'Logged out successfully');
    res.redirect('/auth/login');
  });
};