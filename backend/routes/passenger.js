const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const Bus = require('../models/Bus');
const Alert = require('../models/Alert');
const Route = require('../models/Route'); // Add Route model

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
router.get('/me', auth, async (req, res) => {
  try {
    const passenger = await User.findById(req.user.id).select('-password');
    res.json(passenger);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
