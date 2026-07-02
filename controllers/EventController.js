const fs = require('fs');
const path = require('path');
const Event = require('../models/Event');
const Venue = require('../models/Venue');
const Activity = require('../models/Activity');
const Registration = require('../models/Registration');

function deleteFile(filename) {
  if (!filename) return;
  const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);
  fs.unlink(filePath, function() {});
}

class EventController {
  static getIndex(req, res) {
    const user = req.session.userId
      ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
      : null;

    const events = Event.getAllWithFilters(req.query);
    const venues = Venue.getAll();
    const activities = Activity.getAll();

    res.render('events/index', {
      title: 'Events',
      user,
      events,
      venues,
      activities,
      filters: req.query,
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  }

  static getShow(req, res) {
    const user = req.session.userId
      ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
      : null;

    const event = Event.findById(req.params.id);

    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    const venues = Venue.getByEventId(req.params.id);
    const activities = Activity.getByEventId(req.params.id);
    const participants = Registration.getByEvent(req.params.id);

    let isRegistered = false;
    if (req.session.userId) {
      const reg = Registration.getByParticipantAndEvent(req.session.userId, req.params.id);
      isRegistered = !!reg;
    }

    res.render('events/show', {
      title: event.name,
      user,
      event,
      venues,
      activities,
      participants,
      isRegistered,
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  }

  static getCreate(req, res) {
    const user = req.session.userId
      ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
      : null;

    const venues = Venue.getAll();
    const activities = Activity.getAll();

    res.render('events/form', {
      title: 'Create Event',
      user,
      event: null,
      venues,
      activities,
      selectedVenues: [],
      selectedActivities: [],
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  }

  static postCreate(req, res) {
    const { name, description, date, time } = req.body;
    let { venue_ids, activity_ids } = req.body;

    if (!name || !date || !time) {
      req.flash('error', 'Event name, date, and time are required.');
      return res.redirect('/events/create');
    }

    if (!venue_ids) venue_ids = [];
    if (!Array.isArray(venue_ids)) venue_ids = [venue_ids];
    if (!activity_ids) activity_ids = [];
    if (!Array.isArray(activity_ids)) activity_ids = [activity_ids];

    const image = req.file ? req.file.filename : null;

    try {
      const eventId = Event.create(
        name, description, date, time, req.session.userId, venue_ids, activity_ids, image
      );

      req.flash('success', 'Event created successfully!');
      res.redirect(`/events/${eventId}`);
    } catch (err) {
      console.error('Error creating event:', err);
      req.flash('error', 'An error occurred while creating the event.');
      res.redirect('/events/create');
    }
  }

  static getEdit(req, res) {
    const user = req.session.userId
      ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
      : null;

    const event = Event.findById(req.params.id);

    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    const venues = Venue.getAll();
    const activities = Activity.getAll();
    const selectedVenues = Venue.getIdsByEventId(req.params.id);
    const selectedActivities = Activity.getIdsByEventId(req.params.id);

    res.render('events/form', {
      title: 'Edit Event',
      user,
      event,
      venues,
      activities,
      selectedVenues,
      selectedActivities,
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  }

  static postUpdate(req, res) {
    const { name, description, date, time } = req.body;
    let { venue_ids, activity_ids } = req.body;
    const eventId = req.params.id;

    if (!name || !date || !time) {
      req.flash('error', 'Event name, date, and time are required.');
      return res.redirect(`/events/${eventId}/edit`);
    }

    if (!venue_ids) venue_ids = [];
    if (!Array.isArray(venue_ids)) venue_ids = [venue_ids];
    if (!activity_ids) activity_ids = [];
    if (!Array.isArray(activity_ids)) activity_ids = [activity_ids];

    let image = undefined;
    if (req.file) {
      const existingEvent = Event.findById(eventId);
      if (existingEvent && existingEvent.image) {
        deleteFile(existingEvent.image);
      }
      image = req.file.filename;
    }

    try {
      Event.update(eventId, name, description, date, time, venue_ids, activity_ids, image);

      req.flash('success', 'Event updated successfully!');
      res.redirect(`/events/${eventId}`);
    } catch (err) {
      console.error('Error updating event:', err);
      req.flash('error', 'An error occurred while updating the event.');
      res.redirect(`/events/${eventId}/edit`);
    }
  }

  static postDelete(req, res) {
    try {
      const event = Event.findById(req.params.id);
      if (event && event.image) {
        deleteFile(event.image);
      }
      Event.delete(req.params.id);
      req.flash('success', 'Event deleted successfully.');
      res.redirect('/events');
    } catch (err) {
      console.error('Error deleting event:', err);
      req.flash('error', 'An error occurred while deleting the event.');
      res.redirect('/events');
    }
  }

  static postRemoveImage(req, res) {
    try {
      const event = Event.findById(req.params.id);
      if (event && event.image) {
        deleteFile(event.image);
      }
      Event.removeImage(req.params.id);
      req.flash('success', 'Image removed successfully.');
      res.redirect(`/events/${req.params.id}/edit`);
    } catch (err) {
      console.error('Error removing image:', err);
      req.flash('error', 'An error occurred while removing the image.');
      res.redirect(`/events/${req.params.id}/edit`);
    }
  }
}

module.exports = EventController;
