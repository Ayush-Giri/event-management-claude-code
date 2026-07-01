const Event = require('../models/Event');
const Venue = require('../models/Venue');
const Activity = require('../models/Activity');
const User = require('../models/User');

class AdminController {
  static getDashboard(req, res) {
    const user = { id: req.session.userId, name: req.session.userName, role: req.session.userRole };
  
    const stats = {
      eventCount: Event.getStats(),
      participantCount: User.getStats(),
      venueCount: Venue.getStats(),
      activityCount: Activity.getStats()
    };
  
    const recentEvents = Event.getAllWithFilters({});
  
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user,
      stats,
      recentEvents,
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  }

  static getParticipants(req, res) {
    const user = { id: req.session.userId, name: req.session.userName, role: req.session.userRole };
    const participants = User.getAll();
    
    res.render('admin/participants', {
      title: 'Manage Participants',
      user,
      participants,
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  }

  static async postParticipant(req, res) {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !password) {
      req.flash('error', 'Name, email, and password are required.');
      return res.redirect('/admin/participants');
    }
  
    try {
      const existingUser = User.findByEmail(email);
      if (existingUser) {
        req.flash('error', 'Email is already registered.');
        return res.redirect('/admin/participants');
      }
  
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      User.create(name, email, hashedPassword, 'user');
  
      req.flash('success', 'Participant created successfully.');
      res.redirect('/admin/participants');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error creating participant.');
      res.redirect('/admin/participants');
    }
  }

  static getVenues(req, res) {
    const user = { id: req.session.userId, name: req.session.userName, role: req.session.userRole };
    const venues = Venue.getAll();
    
    res.render('admin/venues', {
      title: 'Manage Venues',
      user,
      venues,
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  }

  static postVenue(req, res) {
    const { name, address, capacity } = req.body;
  
    if (!name) {
      req.flash('error', 'Venue name is required.');
      return res.redirect('/admin/venues');
    }
  
    try {
      Venue.create(name, address, capacity);
      req.flash('success', 'Venue added successfully.');
      res.redirect('/admin/venues');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error adding venue.');
      res.redirect('/admin/venues');
    }
  }

  static postUpdateVenue(req, res) {
    const { name, address, capacity } = req.body;
    
    try {
      Venue.update(req.params.id, name, address, capacity);
      req.flash('success', 'Venue updated successfully.');
      res.redirect('/admin/venues');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error updating venue.');
      res.redirect('/admin/venues');
    }
  }

  static postDeleteVenue(req, res) {
    try {
      Venue.delete(req.params.id);
      req.flash('success', 'Venue deleted successfully.');
      res.redirect('/admin/venues');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error deleting venue. It might be linked to existing events.');
      res.redirect('/admin/venues');
    }
  }

  static getActivities(req, res) {
    const user = { id: req.session.userId, name: req.session.userName, role: req.session.userRole };
    const activities = Activity.getAll();
    
    res.render('admin/activities', {
      title: 'Manage Activities',
      user,
      activities,
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  }

  static postActivity(req, res) {
    const { name, description } = req.body;
  
    if (!name) {
      req.flash('error', 'Activity name is required.');
      return res.redirect('/admin/activities');
    }
  
    try {
      Activity.create(name, description);
      req.flash('success', 'Activity added successfully.');
      res.redirect('/admin/activities');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error adding activity.');
      res.redirect('/admin/activities');
    }
  }

  static postUpdateActivity(req, res) {
    const { name, description } = req.body;
    
    try {
      Activity.update(req.params.id, name, description);
      req.flash('success', 'Activity updated successfully.');
      res.redirect('/admin/activities');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error updating activity.');
      res.redirect('/admin/activities');
    }
  }

  static postDeleteActivity(req, res) {
    try {
      Activity.delete(req.params.id);
      req.flash('success', 'Activity deleted successfully.');
      res.redirect('/admin/activities');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error deleting activity. It might be linked to existing events.');
      res.redirect('/admin/activities');
    }
  }
}

module.exports = AdminController;
