const UserService = require('../services/userServices');

// ==================== DASHBOARD ====================
exports.getDashboard = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await UserService.getDashboard(userId);

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

    res.render('./student/dashboard', {
      user: req.user,
      ...result.data,
      messages: req.flash()
    });

  } catch (err) {
    console.error('Dashboard controller error:', err);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Something went wrong'
      });
    }
    
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/handler');
  }
};

// ==================== CATEGORY COURSES ====================
exports.getCategoryCourses = async (req, res) => {
  const userId = req.user.id;
  const categoryId = req.params.id;

  try {
    const result = await UserService.getCategoryCourses(userId, categoryId);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }
      req.flash('error_msg', result.error);
      return res.redirect('/user');
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    res.render('./student/cat-details', {
      user: req.user,
      ...result.data,
      messages: req.flash()
    });

  } catch (err) {
    console.error('Category courses controller error:', err);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load category courses'
      });
    }
    
    req.flash('error_msg', 'Failed to load category courses');
    res.redirect('/user');
  }
};

// ==================== PROFILE ====================
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await UserService.getProfile(userId);

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

    res.render('./student/profile', {
      user: req.user,
      ...result.data,
      messages: req.flash()
    });

  } catch (err) {
    console.error('Profile controller error:', err);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load profile'
      });
    }
    
    req.flash('error_msg', 'Failed to load profile');
    res.redirect('/handler');
  }
};

// ==================== COURSES ====================
exports.getCourses = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await UserService.getCourses(userId);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }
      req.flash('error_msg', result.error);
      return res.redirect('/');
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    res.render('./student/my-courses', {
      user: req.user,
      ...result.data,
      messages: req.flash()
    });

  } catch (err) {
    console.error('Courses controller error:', err);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load courses'
      });
    }
    
    req.flash('error_msg', 'Failed to load your courses');
    res.redirect('/');
  }
};

// ==================== COURSE DETAILS ====================
exports.getCourseDetails = async (req, res) => {
  const userId = req.user.id;
  const courseId = req.params.id;

  try {
    const result = await UserService.getCourseDetails(userId, courseId);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }
      req.flash('error_msg', result.error);
      return res.redirect('/user/my-courses');
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    res.render('./student/courses-details', {
      user: req.user,
      ...result.data,
      messages: req.flash()
    });

  } catch (err) {
    console.error('Course details controller error:', err);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load course details'
      });
    }
    
    req.flash('error_msg', 'Failed to load course details');
    res.redirect('/user/my-courses');
  }
};

// ==================== FREE COURSES ====================
exports.getFreeCourses = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await UserService.getFreeCourses(userId);

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

    res.render('./student/free-courses', {
      user: req.user,
      ...result.data,
      customerToPay: 70000,
      messages: req.flash()
    });

  } catch (err) {
    console.error('Free courses controller error:', err);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Something went wrong'
      });
    }
    
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/handler');
  }
};

// ==================== EDIT PROFILE ====================
exports.editProfile = async (req, res) => {
  const userId = req.user.id;
  const { fullName, bio, phone } = req.body;

  try {
    const result = await UserService.editProfile(userId, { fullName, bio, phone });

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }
      req.flash('error_msg', result.error);
      return res.redirect('/user/profile');
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    if (result.data.message.includes('successfully')) {
      req.flash('success_msg', result.data.message);
    } else {
      req.flash('error_msg', result.data.message);
    }

    return res.redirect('/user/profile');

  } catch (err) {
    console.error('Edit profile controller error:', err);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
    
    req.flash('error_msg', 'Failed to update profile');
    return res.redirect('/user/profile');
  }
};

// ==================== COURSE SCHEDULE ====================
exports.getCourseSchedule = async (req, res) => {
  const userId = req.user.id;
  const { categoryId, id: courseId } = req.params;

  try {
    const result = await UserService.getCourseSchedule(userId, categoryId, courseId);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }
      req.flash('error_msg', result.error);
      return res.redirect('/user/my-courses');
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    res.render('./student/classes', {
      user: { ...req.user, referrer_id: result.data.referrerId },
      ...result.data,
      messages: req.flash()
    });

  } catch (err) {
    console.error('Course schedule controller error:', err);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load course schedule'
      });
    }
    
    req.flash('error_msg', 'Failed to load course schedule');
    res.redirect('/user/my-courses');
  }
};

// ==================== CLASS DETAILS ====================
exports.getClassDetails = async (req, res) => {
  const userId = req.user.id;
  const { categoryId, courseId, id: classId } = req.params;

  try {
    const result = await UserService.getClassDetails(userId, classId, categoryId, courseId);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }
      req.flash('error_msg', result.error);
      return res.redirect(`/user/category/${categoryId}/courses/${courseId}`);
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    res.render('./student/class', {
      user: req.user,
      ...result.data,
      messages: req.flash()
    });

  } catch (err) {
    console.error('Class details controller error:', err);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load class details'
      });
    }
    
    req.flash('error_msg', 'Failed to load class details');
    res.redirect(`/user/category/${categoryId}/courses/${courseId}`);
  }
};

// ==================== STUDENT CLASS RECORD ====================
exports.studentClassRecord = async (req, res) => {
  const userId = req.user.id;
  const courseId = req.params.id;

  try {
    const result = await UserService.getStudentClassRecord(userId, courseId);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }
      req.flash('error_msg', result.error);
      return res.redirect('/user/my-courses');
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    res.render('./student/classes', {
      user: req.user,
      ...result.data,
      messages: req.flash()
    });

  } catch (err) {
    console.error('Student class record controller error:', err);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load class record'
      });
    }
    
    req.flash('error_msg', 'Failed to load class record');
    res.redirect('/user/my-courses');
  }
};

// ==================== ENROLLMENT ====================
exports.enrollInCourse = async (req, res) => {
  const userId = req.user.id;
  const courseId = req.params.id;
  const { email } = req.body;

  try {
    const result = await UserService.enrollInCourse(userId, courseId, email);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }

      if (result.alreadyEnrolled) {
        req.flash('warning_msg', result.error);
      } else {
        req.flash('error_msg', result.error);
      }
      
      return res.redirect('/user/my-courses');
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    if (result.data.isFree) {
      req.flash('success_msg', result.data.message);
      return res.redirect('/user/my-courses');
    }

    // Redirect to Paystack for payment
    return res.redirect(result.data.paymentData.authorization_url);

  } catch (err) {
    console.error('Enrollment controller error:', err);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to enroll in course'
      });
    }
    
    req.flash('error_msg', 'Failed to enroll in course. Please try again.');
    res.redirect('/user/my-courses');
  }
};

// ==================== PAYMENT VERIFICATION ====================
exports.courseVerify = async (req, res) => {
  const { reference } = req.query;

  try {
    const result = await UserService.verifyCoursePayment(reference);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }
      req.flash('error_msg', result.error);
      return res.redirect('/user');
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    req.flash('success_msg', result.data.message);
    return res.redirect('/user/my-courses');

  } catch (err) {
    console.error('Payment verification controller error:', err);
    
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Payment verification failed'
      });
    }
    
    req.flash('error_msg', 'Payment verification failed');
    return res.redirect('/user');
  }
};