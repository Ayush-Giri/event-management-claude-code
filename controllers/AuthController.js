const bcrypt = require('bcryptjs');
const User = require('../models/User');

class AuthController {
  static getLogin(req, res) {
    res.render('auth/login', {
      title: 'Log In',
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  }

  static async postLogin(req, res) {
    const { email, password } = req.body;
    
    if (!email || !password) {
      req.flash('error', 'Please enter both email and password.');
      return res.redirect('/auth/login');
    }
  
    try {
      const user = User.findByEmail(email);
  
      if (!user) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/auth/login');
      }
  
      const isMatch = await bcrypt.compare(password, user.password_hash);
  
      if (!isMatch) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/auth/login');
      }
  
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userName = user.name;
  
      req.flash('success', `Welcome back, ${user.name}!`);
      
      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      }
      res.redirect('/events');
    } catch (err) {
      console.error(err);
      req.flash('error', 'An error occurred during login.');
      res.redirect('/auth/login');
    }
  }

  static getRegister(req, res) {
    res.render('auth/register', {
      title: 'Sign Up',
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  }

  static async postRegister(req, res) {
    const { name, email, password, confirmPassword } = req.body;
  
    if (!name || !email || !password || !confirmPassword) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/auth/register');
    }
  
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/auth/register');
    }
  
    try {
      const existingUser = User.findByEmail(email);
      if (existingUser) {
        req.flash('error', 'Email is already registered.');
        return res.redirect('/auth/register');
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      const userId = User.create(name, email, hashedPassword, 'user');
  
      req.session.userId = userId;
      req.session.userRole = 'user';
      req.session.userName = name;
  
      req.flash('success', 'Registration successful! Welcome.');
      res.redirect('/events');
    } catch (err) {
      console.error(err);
      req.flash('error', 'An error occurred during registration.');
      res.redirect('/auth/register');
    }
  }

  static postLogout(req, res) {
    req.session.destroy((err) => {
      if (err) console.error('Session destruction error:', err);
      res.redirect('/');
    });
  }
}

module.exports = AuthController;
