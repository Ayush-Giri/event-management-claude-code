const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

// =====================
// Dashboard
// =====================

// GET /admin — Admin dashboard
router.get('/', requireAdmin, (req, res) => {
  const user = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;

  const eventCount = db.prepare('SELECT COUNT(*) AS count FROM events').get().count;
  const participantCount = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'user'").get().count;
  const venueCount = db.prepare('SELECT COUNT(*) AS count FROM venues').get().count;
  const activityCount = db.prepare('SELECT COUNT(*) AS count FROM activities').get().count;

  const recentEvents = db.prepare(`
    SELECT e.*, u.name AS creator_name
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    ORDER BY e.created_at DESC
    LIMIT 5
  `).all();

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    user,
    stats: {
      eventCount,
      participantCount,
      venueCount,
      activityCount
    },
    recentEvents,
    messages: {
      error: req.flash('error'),
      success: req.flash('success')
    }
  });
});

// =====================
// Participants Management
// =====================

// GET /admin/participants — List all non-admin users
router.get('/participants', requireAdmin, (req, res) => {
  const user = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;

  const participants = db.prepare(
    "SELECT * FROM users WHERE role = 'user' ORDER BY name ASC"
  ).all();

  res.render('admin/participants', {
    title: 'Manage Participants',
    user,
    participants,
    messages: {
      error: req.flash('error'),
      success: req.flash('success')
    }
  });
});

// POST /admin/participants — Create new participant
router.post('/participants', requireAdmin, (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    req.flash('error', 'Name, email, and password are required.');
    return res.redirect('/admin/participants');
  }

  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters long.');
    return res.redirect('/admin/participants');
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    req.flash('error', 'A user with this email already exists.');
    return res.redirect('/admin/participants');
  }

  try {
    const passwordHash = bcryptjs.hashSync(password, 10);
    db.prepare(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, phone || null, passwordHash, 'user');

    req.flash('success', 'Participant created successfully.');
  } catch (err) {
    console.error('Error creating participant:', err);
    req.flash('error', 'An error occurred while creating the participant.');
  }

  res.redirect('/admin/participants');
});

// POST /admin/participants/:id — Update participant
router.post('/participants/:id', requireAdmin, (req, res) => {
  const { name, email, phone } = req.body;
  const participantId = req.params.id;

  if (!name || !email) {
    req.flash('error', 'Name and email are required.');
    return res.redirect('/admin/participants');
  }

  try {
    // Check if email is taken by another user
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, participantId);
    if (existing) {
      req.flash('error', 'This email is already in use by another user.');
      return res.redirect('/admin/participants');
    }

    db.prepare(
      'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?'
    ).run(name, email, phone || null, participantId);

    req.flash('success', 'Participant updated successfully.');
  } catch (err) {
    console.error('Error updating participant:', err);
    req.flash('error', 'An error occurred while updating the participant.');
  }

  res.redirect('/admin/participants');
});

// POST /admin/participants/:id/delete — Delete participant
router.post('/participants/:id/delete', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    req.flash('success', 'Participant deleted successfully.');
  } catch (err) {
    console.error('Error deleting participant:', err);
    req.flash('error', 'An error occurred while deleting the participant.');
  }

  res.redirect('/admin/participants');
});

// =====================
// Venues Management
// =====================

// GET /admin/venues — List all venues
router.get('/venues', requireAdmin, (req, res) => {
  const user = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;

  const venues = db.prepare('SELECT * FROM venues ORDER BY name ASC').all();

  res.render('admin/venues', {
    title: 'Manage Venues',
    user,
    venues,
    messages: {
      error: req.flash('error'),
      success: req.flash('success')
    }
  });
});

// POST /admin/venues — Create venue
router.post('/venues', requireAdmin, (req, res) => {
  const { name, address, capacity } = req.body;

  if (!name || !address) {
    req.flash('error', 'Venue name and address are required.');
    return res.redirect('/admin/venues');
  }

  try {
    db.prepare(
      'INSERT INTO venues (name, address, capacity) VALUES (?, ?, ?)'
    ).run(name, address, parseInt(capacity) || 0);

    req.flash('success', 'Venue created successfully.');
  } catch (err) {
    console.error('Error creating venue:', err);
    req.flash('error', 'An error occurred while creating the venue.');
  }

  res.redirect('/admin/venues');
});

// POST /admin/venues/:id — Update venue
router.post('/venues/:id', requireAdmin, (req, res) => {
  const { name, address, capacity } = req.body;
  const venueId = req.params.id;

  if (!name || !address) {
    req.flash('error', 'Venue name and address are required.');
    return res.redirect('/admin/venues');
  }

  try {
    db.prepare(
      'UPDATE venues SET name = ?, address = ?, capacity = ? WHERE id = ?'
    ).run(name, address, parseInt(capacity) || 0, venueId);

    req.flash('success', 'Venue updated successfully.');
  } catch (err) {
    console.error('Error updating venue:', err);
    req.flash('error', 'An error occurred while updating the venue.');
  }

  res.redirect('/admin/venues');
});

// POST /admin/venues/:id/delete — Delete venue
router.post('/venues/:id/delete', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM venues WHERE id = ?').run(req.params.id);
    req.flash('success', 'Venue deleted successfully.');
  } catch (err) {
    console.error('Error deleting venue:', err);
    req.flash('error', 'An error occurred while deleting the venue.');
  }

  res.redirect('/admin/venues');
});

// =====================
// Activities Management
// =====================

// GET /admin/activities — List all activities
router.get('/activities', requireAdmin, (req, res) => {
  const user = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;

  const activities = db.prepare('SELECT * FROM activities ORDER BY name ASC').all();

  res.render('admin/activities', {
    title: 'Manage Activities',
    user,
    activities,
    messages: {
      error: req.flash('error'),
      success: req.flash('success')
    }
  });
});

// POST /admin/activities — Create activity
router.post('/activities', requireAdmin, (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    req.flash('error', 'Activity name is required.');
    return res.redirect('/admin/activities');
  }

  try {
    db.prepare(
      'INSERT INTO activities (name, description) VALUES (?, ?)'
    ).run(name, description || null);

    req.flash('success', 'Activity created successfully.');
  } catch (err) {
    console.error('Error creating activity:', err);
    req.flash('error', 'An error occurred while creating the activity.');
  }

  res.redirect('/admin/activities');
});

// POST /admin/activities/:id — Update activity
router.post('/activities/:id', requireAdmin, (req, res) => {
  const { name, description } = req.body;
  const activityId = req.params.id;

  if (!name) {
    req.flash('error', 'Activity name is required.');
    return res.redirect('/admin/activities');
  }

  try {
    db.prepare(
      'UPDATE activities SET name = ?, description = ? WHERE id = ?'
    ).run(name, description || null, activityId);

    req.flash('success', 'Activity updated successfully.');
  } catch (err) {
    console.error('Error updating activity:', err);
    req.flash('error', 'An error occurred while updating the activity.');
  }

  res.redirect('/admin/activities');
});

// POST /admin/activities/:id/delete — Delete activity
router.post('/activities/:id/delete', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
    req.flash('success', 'Activity deleted successfully.');
  } catch (err) {
    console.error('Error deleting activity:', err);
    req.flash('error', 'An error occurred while deleting the activity.');
  }

  res.redirect('/admin/activities');
});

module.exports = router;
