const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'community-events-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use(flash());

// Make user available to all templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId ? {
    id: req.session.userId,
    name: req.session.userName,
    role: req.session.userRole
  } : null;
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const adminRoutes = require('./routes/admin');

app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/', registrationRoutes);
app.use('/admin', adminRoutes);

// Home redirect
app.get('/', (req, res) => {
  res.redirect('/events');
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { title: 'Page Not Found', user: res.locals.currentUser, message: 'The page you are looking for does not exist.', statusCode: 404 });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Server Error', user: res.locals.currentUser, message: 'Something went wrong on our end.', statusCode: 500 });
});

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\nCommunity Event Management System running at http://localhost:${PORT}\n`);
  });
}

module.exports = app;
