const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const twilio = require('twilio');

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// @route   POST api/auth/register-passenger
// @desc    Register new passenger
// @access  Public
router.post('/register-passenger', async (req, res) => {
  const { name, phone } = req.body;

  try {
    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      phone,
      role: 'passenger',
    });

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login-passenger
// @desc    Login passenger with phone number
// @access  Public
router.post('/login-passenger', async (req, res) => {
  const { phone } = req.body;
  console.log('Received phone number:', phone); // Add this line

  try {
    const user = await User.findOne({ phone, role: 'passenger' });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid phone number' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/create-admin
// @desc    Create an admin user (temporary for development)
// @access  Public (should be restricted in production)
router.post('/create-admin', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Admin user with this email already exists' });
    }

    user = new User({
      name,
      email,
      password,
      role: 'admin',
    });

    await user.save();

    res.status(201).json({ msg: 'Admin user created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, phone, password, role } = req.body;

  try {
    let user;
    if (role === 'passenger') {
      user = await User.findOne({ phone, role: 'passenger' });
    } else {
      user = await User.findOne({ email, role });
    }

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    if (role !== 'passenger') {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }
    }
    // For passenger, phone number is enough for now, OTP verification to be added later

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
