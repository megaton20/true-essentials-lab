const Teacher = require('../models/Teacher');

class TeacherController {



  static async assign(req, res) {   
    try {
      const existing = await Teacher.findTeacher(req.body.teacher_id)
      
      if (!existing) {
         req.flash('warning_msg', 'Teacher no Exist');
        return   res.redirect(`/admin`);
      }

     const added =  await Teacher.assign(req.body);
     
        if (added) {
          req.flash('success_msg', 'Teacher assigned successfully');
        }else{
          req.flash('error_msg', 'Teacher already assigned');
        }
      res.redirect(`/admin/courses/details/${req.body.course_id}`);
    } catch (err) {
      console.error(err);
      req.flash('error', 'Failed to assign teacher');
      res.redirect('/admin');
    }
  }

  static async store(req, res) {
    
    try {
      const existing = await Teacher.findTeacher(req.body.user_id)
      
      if (existing) {
         req.flash('warning_msg', 'Teacher Exist');
        return   res.redirect(`/admin/users/${req.body.user_id}`);
      }

     const added =  await Teacher.create(req.body);

        if (added) {
          req.flash('success_msg', 'Teacher created successfully');
        }else{
          req.flash('error_msg', 'Teacher creating failed');
        }
      res.redirect(`/admin/users/${req.body.user_id}`);
    } catch (err) {
      console.error(err);
      req.flash('error', 'Failed to create teacher');
      res.redirect('/admin');
    }
  }

  static async update(req, res) {
    try {
      await Teacher.update(req.params.id, req.body);
      req.flash('success', 'Teacher updated successfully');
      res.redirect('/admin/teachers');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Failed to update teacher');
      res.redirect(`/admin/teachers/${req.params.id}/edit`);
    }
  }

  static async destroy(req, res) {
    try {
      await Teacher.delete(req.params.id);
      req.flash('success', 'Teacher deleted successfully');
      res.redirect('/admin/teachers');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Failed to delete teacher');
      res.redirect('/admin/teachers');
    }
  }
}

module.exports = TeacherController;
