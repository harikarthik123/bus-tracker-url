const express = require('express');
const router = express.Router();
const Passenger = require('../models/Passenger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Bus = require('../models/Bus');
const Alert = require('../models/Alert');
const Route = require('../models/Route'); // Add Route model

// Passenger login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const passenger = await Passenger.findOne({ phone });
    if (!passenger) return res.status(400).json({ msg: 'Passenger not found' });
    const isMatch = await bcrypt.compare(password, passenger.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: passenger._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, passenger });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Search routes
router.get('/routes', async (req, res) => {
  const { search } = req.query;
  try {
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    const routes = await Route.find(query);
    res.json(routes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all routes
router.get('/all-routes', async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get alerts for passenger
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find({ for: 'passenger' }).sort({ createdAt: -1 }).limit(20);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get passenger profile
router.get('/me', async (req, res) => {
  try {
    const passenger = await Passenger.findById(req.user.id);
    res.json(passenger);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
