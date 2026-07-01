const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

// GET /events — List all events with optional filters
router.get('/', (req, res) => {
  const user = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;

  const { date, venue_id, activity_id } = req.query;

  // Build query with filters
  let query = `
    SELECT e.*,
      u.name AS creator_name,
      GROUP_CONCAT(DISTINCT v.name) AS venue_names,
      GROUP_CONCAT(DISTINCT a.name) AS activity_names,
      (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS participant_count
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN event_venues ev ON e.id = ev.event_id
    LEFT JOIN venues v ON ev.venue_id = v.id
    LEFT JOIN event_activities ea ON e.id = ea.event_id
    LEFT JOIN activities a ON ea.activity_id = a.id
  `;

  const conditions = [];
  const params = [];

  if (date) {
    conditions.push('e.date = ?');
    params.push(date);
  }

  if (venue_id) {
    conditions.push('ev.venue_id = ?');
    params.push(venue_id);
  }

  if (activity_id) {
    conditions.push('ea.activity_id = ?');
    params.push(activity_id);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY e.id ORDER BY e.date ASC, e.time ASC';

  const events = db.prepare(query).all(...params);

  // Get all venues and activities for filter dropdowns
  const venues = db.prepare('SELECT * FROM venues ORDER BY name').all();
  const activities = db.prepare('SELECT * FROM activities ORDER BY name').all();

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
});

// GET /events/create — Show create event form (admin only)
router.get('/create', requireAdmin, (req, res) => {
  const user = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;

  const venues = db.prepare('SELECT * FROM venues ORDER BY name').all();
  const activities = db.prepare('SELECT * FROM activities ORDER BY name').all();

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
});

// POST /events — Create a new event (admin only)
router.post('/', requireAdmin, (req, res) => {
  const { name, description, date, time } = req.body;
  let { venue_ids, activity_ids } = req.body;

  if (!name || !date || !time) {
    req.flash('error', 'Event name, date, and time are required.');
    return res.redirect('/events/create');
  }

  // Ensure arrays
  if (!venue_ids) venue_ids = [];
  if (!Array.isArray(venue_ids)) venue_ids = [venue_ids];
  if (!activity_ids) activity_ids = [];
  if (!Array.isArray(activity_ids)) activity_ids = [activity_ids];

  try {
    const result = db.prepare(
      'INSERT INTO events (name, description, date, time, created_by) VALUES (?, ?, ?, ?, ?)'
    ).run(name, description || null, date, time, req.session.userId);

    const eventId = result.lastInsertRowid;

    // Insert event-venue links
    const insertVenue = db.prepare('INSERT INTO event_venues (event_id, venue_id) VALUES (?, ?)');
    for (const venueId of venue_ids) {
      insertVenue.run(eventId, venueId);
    }

    // Insert event-activity links
    const insertActivity = db.prepare('INSERT INTO event_activities (event_id, activity_id) VALUES (?, ?)');
    for (const activityId of activity_ids) {
      insertActivity.run(eventId, activityId);
    }

    req.flash('success', 'Event created successfully!');
    res.redirect(`/events/${eventId}`);
  } catch (err) {
    console.error('Error creating event:', err);
    req.flash('error', 'An error occurred while creating the event.');
    res.redirect('/events/create');
  }
});

// GET /events/:id — Show event detail
router.get('/:id', (req, res) => {
  const user = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;

  const event = db.prepare(`
    SELECT e.*, u.name AS creator_name
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.id = ?
  `).get(req.params.id);

  if (!event) {
    req.flash('error', 'Event not found.');
    return res.redirect('/events');
  }

  // Get venues for this event
  const venues = db.prepare(`
    SELECT v.* FROM venues v
    JOIN event_venues ev ON v.id = ev.venue_id
    WHERE ev.event_id = ?
  `).all(req.params.id);

  // Get activities for this event
  const activities = db.prepare(`
    SELECT a.* FROM activities a
    JOIN event_activities ea ON a.id = ea.activity_id
    WHERE ea.event_id = ?
  `).all(req.params.id);

  // Get participants registered for this event
  const participants = db.prepare(`
    SELECT u.id, u.name, u.email, r.registration_date, r.status
    FROM users u
    JOIN registrations r ON u.id = r.participant_id
    WHERE r.event_id = ?
    ORDER BY r.registration_date ASC
  `).all(req.params.id);

  // Check if current user is registered
  let isRegistered = false;
  if (req.session.userId) {
    const registration = db.prepare(
      'SELECT id FROM registrations WHERE participant_id = ? AND event_id = ?'
    ).get(req.session.userId, req.params.id);
    isRegistered = !!registration;
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
});

// GET /events/:id/edit — Show edit event form (admin only)
router.get('/:id/edit', requireAdmin, (req, res) => {
  const user = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

  if (!event) {
    req.flash('error', 'Event not found.');
    return res.redirect('/events');
  }

  const venues = db.prepare('SELECT * FROM venues ORDER BY name').all();
  const activities = db.prepare('SELECT * FROM activities ORDER BY name').all();

  // Get currently selected venue and activity IDs
  const selectedVenues = db.prepare(
    'SELECT venue_id FROM event_venues WHERE event_id = ?'
  ).all(req.params.id).map(row => row.venue_id);

  const selectedActivities = db.prepare(
    'SELECT activity_id FROM event_activities WHERE event_id = ?'
  ).all(req.params.id).map(row => row.activity_id);

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
});

// POST /events/:id — Update event (admin only)
router.post('/:id', requireAdmin, (req, res) => {
  const { name, description, date, time } = req.body;
  let { venue_ids, activity_ids } = req.body;
  const eventId = req.params.id;

  if (!name || !date || !time) {
    req.flash('error', 'Event name, date, and time are required.');
    return res.redirect(`/events/${eventId}/edit`);
  }

  // Ensure arrays
  if (!venue_ids) venue_ids = [];
  if (!Array.isArray(venue_ids)) venue_ids = [venue_ids];
  if (!activity_ids) activity_ids = [];
  if (!Array.isArray(activity_ids)) activity_ids = [activity_ids];

  try {
    // Update the event
    db.prepare(
      'UPDATE events SET name = ?, description = ?, date = ?, time = ? WHERE id = ?'
    ).run(name, description || null, date, time, eventId);

    // Delete old venue and activity links
    db.prepare('DELETE FROM event_venues WHERE event_id = ?').run(eventId);
    db.prepare('DELETE FROM event_activities WHERE event_id = ?').run(eventId);

    // Re-insert venue links
    const insertVenue = db.prepare('INSERT INTO event_venues (event_id, venue_id) VALUES (?, ?)');
    for (const venueId of venue_ids) {
      insertVenue.run(eventId, venueId);
    }

    // Re-insert activity links
    const insertActivity = db.prepare('INSERT INTO event_activities (event_id, activity_id) VALUES (?, ?)');
    for (const activityId of activity_ids) {
      insertActivity.run(eventId, activityId);
    }

    req.flash('success', 'Event updated successfully!');
    res.redirect(`/events/${eventId}`);
  } catch (err) {
    console.error('Error updating event:', err);
    req.flash('error', 'An error occurred while updating the event.');
    res.redirect(`/events/${eventId}/edit`);
  }
});

// POST /events/:id/delete — Delete event (admin only)
router.post('/:id/delete', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    req.flash('success', 'Event deleted successfully.');
    res.redirect('/events');
  } catch (err) {
    console.error('Error deleting event:', err);
    req.flash('error', 'An error occurred while deleting the event.');
    res.redirect('/events');
  }
});

module.exports = router;
