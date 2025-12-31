const Attendance = require('../models/Attendance');
const adminServices = require('../services/adminServices');


exports.adminDashboard = async (req, res) => {

  try {
    const result = await adminServices.getDashboard(req);

    // handle errors

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }


    res.render('./admin/dashboard', {
      ...result.data
    });
  } catch (err) {
    console.error("Error loading admin dashboard:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load admin dashboard:'
      });
    }

    req.flash('error_msg', 'Failed to load admin dashboard');
    return res.redirect('/');
  }
};


exports.getAllUsers = async (req, res) => {

  try {

    const result = await adminServices.getAllUsersPage(req);
    // handle errors

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }


    res.render('./admin/users',
      {
        ...result.data
      });
  } catch (err) {
    console.error("Error loading admin all users page:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load all users page'
      });
    }

    req.flash('error_msg', 'Failed to load all users page');
    return res.redirect('/admin');
  }

};
exports.findOneUsers = async (req, res) => {

  const userId = req.params.id
  try {
    const result = await adminServices.getUser(userId);
    // handle errors

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    res.render('./admin/user',
      {
        ...result.data
      });

  } catch (err) {

    console.error("Error loading admin user view:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load user view'
      });
    }

    req.flash('error_msg', 'Failed to load user view');
    return res.redirect('/admin');
  }

};
exports.deleteUser = async (req, res) => {
  const userID = req.params.id


  try {

    const result = await adminServices.deleteUser(userID);


    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash('success_msg', result.message);
    return res.redirect('/admin/users')


  } catch (error) {
    console.error("server Error deleting from users:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'server error deleting from user'
      });
    }

    req.flash('error_msg', 'server error deleting from user')
    return res.redirect('/admin');

  }
};



exports.getAllCategories = async (req, res) => {

  try {

    const result = await adminServices.getAllCategoriesPage(req);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }





    res.render('./admin/categories',
      {
        ...result.data
      });

  } catch (err) {

    console.error("Error loading admin categories page:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load all users page'
      });
    }
    req.flash('error_msg', 'error loading categories')
    return res.redirect('/admin')
  }
};
exports.createCategories = async (req, res) => {


  try {

    const result = await adminServices.createCategories(req.body);


    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash('success_msg', result.message);
    res.redirect('/admin/categories')
  } catch (err) {

    console.error("Error creating categories:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'error creating categories'
      });
    }

    req.flash('error_msg', 'error creating categories')
    return res.redirect('/admin');

  }
};
exports.editCategories = async (req, res) => {


  try {

    const result = await adminServices.editCategories(req.body, req.params.id);


    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash('success_msg', result.message);
    return res.redirect('/admin/categories')

  } catch (err) {
    console.error("server Error updating categories:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'server error updating categories'
      });
    }

    req.flash('error_msg', 'server error updating categories')
    return res.redirect('/admin');
  }
};
exports.deleteCategories = async (req, res) => {

  try {

    const result = await adminServices.deleteCategories(req.params.id);


    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash('success_msg', result.message);
    return res.redirect('/admin/categories')

  } catch (err) {
    console.error("server Error deleting from categories:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'server error deleting from categories'
      });
    }

    req.flash('error_msg', 'server error deleting from categories')
    return res.redirect('/admin');

  }
};



// courses

exports.createClass = async (req, res) => {
  const createdBy = req.user.id
  const { courseId } = req.body
  try {

    const result = await adminServices.createClass(req.body, createdBy);


    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash('success_msg', result.message);
    return res.redirect(`/admin/course/class/${courseId}`)

  } catch (error) {

    console.error("server error on create class: ", error);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'server error on create class'
      });
    }

    req.flash('error_msg', 'server error on create class: ')
    return res.redirect(`/admin/course/class/${courseId}`)


  }
};
exports.getClassSession = async (req, res) => {
  const id = req.params.id
  const backUrl = `admin/course/class/${req.params.course}`

  try {

    const result = await adminServices.getCourseClassSessions(id);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }



    res.render('./admin/class', {
      ...result.data,
      backUrl,
      courseId: req.params.course,
    })

  } catch (err) {

    console.error("Error loading admin class session detail page:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load class session detail page'
      });
    }
    req.flash('error_msg', 'error loading class session detail')
    return res.redirect('/admin')
  }
};
exports.updateClassSessionById = async (req, res) => {
  const { courseId } = req.body
  const id = req.params.id


  try {

    const result = await adminServices.updateClassSessionById(req.body, id);

    if (!result.success) {

      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }

      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);

    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
      });
    }

    req.flash(`"success_msg", "${result.message}"`)
    return res.redirect(`/admin/class/${id}/${courseId}`)

  } catch (err) {
    console.error("Error admin updating class session:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to updating class session'
      });
    }
    req.flash('error_msg', 'error updating class session')
    return res.redirect('/admin')
  }
};
exports.toggleClasssVisibility = async (req, res) => {
  const classId = req.params.classId
  const visible = req.params.status
  const { courseId } = req.body
  try {
    const result = await adminServices.toggleClasssVisibility(classId, visible);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash("success_msg", `${result.message}`);

    return res.redirect(`/admin/class/${classId}/${courseId}`);

  } catch (err) {
    console.error("Error admin toggling session visibilty:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'Failed to toggle visisbilty'
      });
    }
    req.flash('error_msg', 'error toggling session visibilty')
    return res.redirect('/admin')

  }
};
exports.deleteClass = async (req, res) => {
  const classID = req.params.id
  const courseId = req.body.courseId

  try {
    const result = await adminServices.deleteClass(classID);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash("success_msg", `${result.message}`);

    return res.redirect(`/admin/course/class/${courseId}`)
  } catch (error) {
    console.error("Error admin  class schedule delete:", error);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: ' class schedule delete error'
      });
    }
    req.flash('error_msg', `${error.message}`)
    return res.redirect('/admin')

  }
};

exports.completeClass = async (req, res) => {
  const classID = req.params.classId
  const { courseId } = req.body
  const status = true


  try {

    const result = await adminServices.completeClass(classID, status);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash("success_msg", `${result.message}`);
    return res.redirect(`/admin/class/${classID}/${courseId}`);
  } catch (error) {
    console.error("Error admin toggling session completion:", error);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'Failed to toggle completion'
      });
    }
    req.flash('error_msg', 'error toggling session completion')
    return res.redirect('/admin')

  }
};
// class session
exports.grantAccess = async (req, res) => {

  try {
    const { classId, userId } = req.params;
    const { granted, courseId } = req.body
    let grant
    if (granted == "on") {
      grant = true
    } else {
      grant = false
    }


    const result = await adminServices.grantAccess(classId, userId, grant);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
      });
    }


    req.flash("success_msg", `${result.message}`);
    return res.redirect(`/admin/class/${classId}/${courseId}/`);


  } catch (err) {

    console.error("Error admin granting access:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to grant access'
      });
    }
    req.flash('error_msg', 'error granting access')
    return res.redirect('/admin')
  }
}

exports.findByJoinCode = async (req, res) => {
  const code = req.params.code

  try {
    const result = await adminServices.findByJoinCode(code);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }

    return res.render('./admin/classes', {
      ...result.data
    })

  } catch (err) {
    console.error("Error admin finsing class by join code:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to ge class by join code'
      });
    }
    req.flash('error_msg', 'error finsing class by join code')
    return res.redirect('/admin')
  }

};




exports.getAllProgram = async (req, res) => {


  try {

    const result = await adminServices.getAllCourse();
    // handle errors

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }


    res.render('./admin/courses',
      {
        ...result.data
      });
  } catch (err) {
    console.error("Error loading admin all courses page:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load all courses page'
      });
    }

    req.flash('error_msg', 'Failed to load all courses page');
    return res.redirect('/admin');
  }

};

exports.getOneProgram = async (req, res) => {

  try {

    const result = await adminServices.getOneCourse(req);


    // handle errors

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        data: result.data
      });
    }


    res.render('./admin/course', {
      user: req.user,
      ...result.data
    });

  } catch (error) {
    res.redirect('/admin/error')
    console.log("error on create class: " + error);


  }
};


exports.createProgram = async (req, res) => {
  const teacherId = req.user.id

  try {
    const result = await adminServices.createProgram(req.body, teacherId);


    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash('success_msg', result.message);
    return res.redirect('/admin/courses')

  } catch (error) {
    console.error("server Error creating Program:", error);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'server error creating Program'
      });
    }

    req.flash('error_msg', 'server error creating Program')
    return res.redirect('/admin');


  }



};

exports.editProgram = async (req, res) => {
  const teacherId = req.user.id

  try {
    const result = await adminServices.editProgram(req.params.id, req.body, teacherId);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash('success_msg', result.message);
    return res.redirect(`/admin/courses/details/${req.params.id}`)


  } catch (error) {
    console.error("server error on create class: ", error);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'server error on create class'
      });
    }

    req.flash('error_msg', 'server error on create class: ')
    return res.redirect(`/admin/courses`)

  }
};
exports.getProgramSchedule = async (req, res) => {


  try {
    const result = await adminServices.getCourseSchedule(req.params.id);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    return res.render('./admin/classes', {
      ...result.data,
      user: req.user,
      courseId: req.params.id
    });

  } catch (error) {

    console.error("server error on class schedule:  ", error);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'server error on class schedule'
      });
    }

    req.flash('error_msg', 'server error on class schedule:  ')
    return res.redirect(`/admin/courses`)


  }
};

exports.deleteProgram = async (req, res) => {
  const courseID = req.params.id


  try {
    const result = await adminServices.deleteCourse(courseID);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash('success_msg', result.message);
    return res.redirect('/admin/courses')

  } catch (error) {
    console.error("server Error deleting from program: ", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'server error deleting from program'
      });
    }

    req.flash('error_msg', 'server error deleting from program')
    return res.redirect('/admin');

  }
};

exports.openProgramAction = async (req, res) => {
  const courseId = req.params.courseId
  const { currentStatus } = req.body

  let newState = false

  if (currentStatus === "false" || currentStatus === false) {
    newState = true;
  }


  try {

    const result = await adminServices.toggleProgramOpen(courseId, newState);

    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect(`/admin`);
    }

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash("success_msg", `${result.message}`);

    return res.redirect(`/admin/courses/details/${courseId}`);
  } catch (error) {
    console.error("Error admin toggling program visibilty:", err);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'Failed to toggle program visisbilty'
      });
    }
    req.flash('error_msg', 'error toggling program visibilty')
    return res.redirect('/admin')

  }
};

// attendance sectionb under construction




// todo under construction
exports.getVisibleLink = async (req, res) => {
  try {
    const stats = await adminServices.getVisibleLink(joinCode);
  } catch (error) {

  }
};

exports.getAttendanceForSession = async (req, res) => {
  const attendance = await Attendance.getAttendanceForSession(req.params.id);
  console.log(attendance);
  const result = await adminServices.toggleClasssVisibility(classId, visible);

  if (!result.success) {
    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }
    req.flash('error_msg', result.message);
    return res.redirect(`/admin`);
  }

  if (req.isAPI) {
    return res.json({
      success: true,
      message: result.message
    });
  }
}


exports.createCourseVideo = async (req, res) => {

  const courseId = req.params.id
  const thumbnailPath = req.files['thumbnail'][0].path;
  const videoFiles = req.files['videos'];

  try {

    const result = await adminServices.createProgramVideo(req.body, courseId, thumbnailPath, videoFiles);


    if (!result.success) {
      if (req.isAPI) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      req.flash('error_msg', result.message);
      return res.redirect('/admin/courses');
    }

    // no error

    if (req.isAPI) {
      return res.json({
        success: true,
        message: result.message
      });
    }

    req.flash('success_msg', result.message);
    return res.redirect('/admin/courses');

  } catch (error) {

    console.error("server error on program video add: ", error);


    if (req.isAPI) {
      return res.status(500).json({
        success: false,
        message: 'server error on program video add'
      });
    }

    req.flash('error_msg', 'server error on program video add: ')
    return res.redirect('/admin/courses');

  }
};

















