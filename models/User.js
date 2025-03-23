const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  return res.status(401).json({ msg: 'Not authorized' });
};

// @route   POST /api/users/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validate inputs
  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Create session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    // Return response
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    return res.status(500).json({ msg: 'Server error during registration' });
  }
});

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate inputs
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ msg: 'Server error during login' });
  }
});

// @route   GET /api/users/logout
// @desc    Logout user / clear session
// @access  Private
router.get('/logout', isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ msg: 'Error logging out' });
    }
    res.clearCookie('connect.sid');
    return res.json({ msg: 'Logged out successfully' });
  });
});

// @route   GET /api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', isAuthenticated, (req, res) => {
  return res.json(req.session.user);
});

module.exports = router;