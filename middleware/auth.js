function requireLogin(req, res, next) {
  if (!req.session.userId) {
    req.flash('error', 'Please log in to access this page.');
    return res.redirect('/auth/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    req.flash('error', 'Please log in to access this page.');
    return res.redirect('/auth/login');
  }
  if (req.session.userRole !== 'admin') {
    req.flash('error', 'Access denied. Admin privileges required.');
    return res.redirect('/events');
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
