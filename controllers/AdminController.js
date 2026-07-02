const fs = require('fs');
const path = require('path');
const Event = require('../models/Event');
const Venue = require('../models/Venue');
const Activity = require('../models/Activity');
const User = require('../models/User');

function deleteFile(filename) {
  if (!filename) return;
  const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);
  fs.unlink(filePath, function() {});
}

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

    const image = req.file ? req.file.filename : null;

    try {
      Venue.create(name, address, capacity, image);
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

    let image = undefined;
    if (req.file) {
      const existingVenue = Venue.findById(req.params.id);
      if (existingVenue && existingVenue.image) {
        deleteFile(existingVenue.image);
      }
      image = req.file.filename;
    }

    try {
      Venue.update(req.params.id, name, address, capacity, image);
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
      const venue = Venue.findById(req.params.id);
      if (venue && venue.image) {
        deleteFile(venue.image);
      }
      Venue.delete(req.params.id);
      req.flash('success', 'Venue deleted successfully.');
      res.redirect('/admin/venues');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error deleting venue. It might be linked to existing events.');
      res.redirect('/admin/venues');
    }
  }

  static postRemoveVenueImage(req, res) {
    try {
      const venue = Venue.findById(req.params.id);
      if (venue && venue.image) {
        deleteFile(venue.image);
      }
      Venue.removeImage(req.params.id);
      req.flash('success', 'Venue image removed.');
      res.redirect('/admin/venues');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error removing image.');
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

    const image = req.file ? req.file.filename : null;

    try {
      Activity.create(name, description, image);
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

    let image = undefined;
    if (req.file) {
      const existingActivity = Activity.findById(req.params.id);
      if (existingActivity && existingActivity.image) {
        deleteFile(existingActivity.image);
      }
      image = req.file.filename;
    }

    try {
      Activity.update(req.params.id, name, description, image);
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
      const activity = Activity.findById(req.params.id);
      if (activity && activity.image) {
        deleteFile(activity.image);
      }
      Activity.delete(req.params.id);
      req.flash('success', 'Activity deleted successfully.');
      res.redirect('/admin/activities');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error deleting activity. It might be linked to existing events.');
      res.redirect('/admin/activities');
    }
  }

  static postRemoveActivityImage(req, res) {
    try {
      const activity = Activity.findById(req.params.id);
      if (activity && activity.image) {
        deleteFile(activity.image);
      }
      Activity.removeImage(req.params.id);
      req.flash('success', 'Activity image removed.');
      res.redirect('/admin/activities');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error removing image.');
      res.redirect('/admin/activities');
    }
  }
}

module.exports = AdminController;
