const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const db = require('../db/database');

// GET /auth/login
router.get('/login', (req, res) => {
  const user = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;

  res.render('auth/login', {
    title: 'Login',
    user,
    messages: {
      error: req.flash('error'),
      success: req.flash('success')
    }
  });
});

// GET /auth/register
router.get('/register', (req, res) => {
  res.render('auth/register', {
    title: 'Create Account',
    user: null,
    messages: {
      error: req.flash('error'),
      success: req.flash('success')
    }
  });
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'Please provide both email and password.');
    return res.redirect('/auth/login');
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    req.flash('error', 'Invalid email or password.');
    return res.redirect('/auth/login');
  }

  const isMatch = bcryptjs.compareSync(password, user.password_hash);

  if (!isMatch) {
    req.flash('error', 'Invalid email or password.');
    return res.redirect('/auth/login');
  }

  // Set session data
  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.userRole = user.role;
  req.session.userEmail = user.email;

  res.redirect('/events');
});

// POST /auth/register
router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    req.flash('error', 'Name, email, and password are required.');
    return res.redirect('/auth/register');
  }

  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters long.');
    return res.redirect('/auth/register');
  }

  // Check email uniqueness
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

  if (existingUser) {
    req.flash('error', 'An account with this email already exists.');
    return res.redirect('/auth/register');
  }

  // Hash password and insert user
  const passwordHash = bcryptjs.hashSync(password, 10);

  try {
    db.prepare(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, phone || null, passwordHash, 'user');

    req.flash('success', 'Account created successfully! Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', 'An error occurred during registration. Please try again.');
    res.redirect('/auth/register');
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;
