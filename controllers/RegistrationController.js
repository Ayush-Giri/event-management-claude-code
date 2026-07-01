const Registration = require('../models/Registration');

class RegistrationController {
  static getMyRegistrations(req, res) {
    const user = { id: req.session.userId, name: req.session.userName, role: req.session.userRole };
    
    try {
      const registrations = Registration.getByParticipant(req.session.userId);
  
      res.render('user/registrations', {
        title: 'My Registrations',
        user,
        registrations,
        messages: {
          error: req.flash('error'),
          success: req.flash('success')
        }
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Could not load your registrations.');
      res.redirect('/events');
    }
  }

  static postRegister(req, res) {
    const eventId = req.params.id;
    const userId = req.session.userId;
  
    try {
      const existing = Registration.getByParticipantAndEvent(userId, eventId);
      
      if (existing) {
        req.flash('error', 'You are already registered for this event.');
        return res.redirect(`/events/${eventId}`);
      }
  
      Registration.register(userId, eventId);
      
      req.flash('success', 'Successfully registered for the event!');
      res.redirect(`/events/${eventId}`);
    } catch (err) {
      console.error(err);
      req.flash('error', 'An error occurred during registration.');
      res.redirect(`/events/${eventId}`);
    }
  }

  static postUnregister(req, res) {
    const eventId = req.params.id;
    const userId = req.session.userId;
  
    try {
      Registration.unregister(userId, eventId);
      req.flash('success', 'You have been unregistered from the event.');
      res.redirect(`/events/${eventId}`);
    } catch (err) {
      console.error(err);
      req.flash('error', 'An error occurred while unregistering.');
      res.redirect(`/events/${eventId}`);
    }
  }
}

module.exports = RegistrationController;
