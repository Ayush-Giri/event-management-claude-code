const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireLogin } = require('../middleware/auth');

// POST /events/:id/register — Register for an event
router.post('/events/:id/register', requireLogin, (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.userId;

  try {
    db.prepare(
      'INSERT INTO registrations (participant_id, event_id, status) VALUES (?, ?, ?)'
    ).run(userId, eventId, 'confirmed');

    req.flash('success', 'You have been registered for this event!');
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      req.flash('error', 'You are already registered for this event.');
    } else {
      console.error('Registration error:', err);
      req.flash('error', 'An error occurred during registration.');
    }
  }

  res.redirect(`/events/${eventId}`);
});

// POST /events/:id/unregister — Unregister from an event
router.post('/events/:id/unregister', requireLogin, (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.userId;

  try {
    db.prepare(
      'DELETE FROM registrations WHERE participant_id = ? AND event_id = ?'
    ).run(userId, eventId);

    req.flash('success', 'You have been unregistered from this event.');
  } catch (err) {
    console.error('Unregistration error:', err);
    req.flash('error', 'An error occurred while cancelling your registration.');
  }

  res.redirect(`/events/${eventId}`);
});

// GET /my-registrations — View current user's registrations
router.get('/my-registrations', requireLogin, (req, res) => {
  const user = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;

  const registrations = db.prepare(`
    SELECT r.id, r.registration_date, r.status,
      e.id AS event_id, e.name AS event_name, e.date AS event_date, e.time AS event_time,
      e.description AS event_description,
      GROUP_CONCAT(DISTINCT v.name) AS venue_names
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    LEFT JOIN event_venues ev ON e.id = ev.event_id
    LEFT JOIN venues v ON ev.venue_id = v.id
    WHERE r.participant_id = ?
    GROUP BY r.id
    ORDER BY e.date ASC, e.time ASC
  `).all(req.session.userId);

  res.render('user/registrations', {
    title: 'My Registrations',
    user,
    registrations,
    messages: {
      error: req.flash('error'),
      success: req.flash('success')
    }
  });
});

module.exports = router;
