const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Location = require('../models/Location');
const AlertModel = require('../models/Alert');

// @route   GET api/driver/me
// @desc    Get current driver's profile (assigned bus and route)
// @access  Private (Driver only)
router.get('/me', auth, async (req, res) => {
  try {
    const driver = await User.findById(req.user.id).select('-password').populate({
      path: 'busId',
      model: 'Bus',
      populate: {
        path: 'route',
        model: 'Route',
      },
    });

    if (!driver) {
      return res.status(404).json({ msg: 'Driver not found' });
    }

    res.json(driver);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/driver/location
// @desc    Update driver's live location
// @access  Private (Driver only)
router.post('/location', auth, async (req, res) => {
  const { lat, lng, speed } = req.body;

  try {
    const driver = await User.findById(req.user.id);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ msg: 'Driver not found' });
    }
    if (!driver.busId) {
      return res.status(400).json({ msg: 'Driver not assigned to a bus' });
    }

    let location = await Location.findOne({ busId: driver.busId });

    if (location) {
      // Update existing location
      location.lat = lat;
      location.lng = lng;
      location.speed = speed || 0;
      location.timestamp = Date.now();
      location.isActive = true; // Mark as active when updating
      location.lastActive = Date.now();
      await location.save();
    } else {
      // Create new location entry
      location = new Location({
        busId: driver.busId,
        lat,
        lng,
        speed: speed || 0,
        isActive: true, // Mark as active when creating
        lastActive: Date.now()
      });
      await location.save();
    }

    res.json({ msg: 'Location updated successfully', location });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/driver/location
// @desc    Mark driver's location as inactive (used when driver logs out)
// @access  Private (Driver only)
router.delete('/location', auth, async (req, res) => {
  try {
    const driver = await User.findById(req.user.id);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ msg: 'Driver not found' });
    }
    if (!driver.busId) {
      return res.status(400).json({ msg: 'Driver not assigned to a bus' });
    }

    // Mark location as inactive instead of deleting
    await Location.updateOne(
      { busId: driver.busId },
      { 
        isActive: false,
        lastActive: new Date()
      }
    );
    console.log(`Location marked as inactive for driver ${driver.name} (bus ${driver.busId})`);
    
    res.json({ msg: 'Location marked as inactive successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/driver/alerts
// @desc    Get alerts relevant to the driver's assigned bus/route or global alerts
// @access  Private (Driver only)
router.get('/alerts', auth, async (req, res) => {
  try {
    const driver = await User.findById(req.user.id);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ msg: 'Driver not found' });
    }

    const query = [
      { routeId: null, busId: null }, // Global alerts
    ];

    if (driver.busId) {
      query.push({ busId: driver.busId }); // Alerts specific to the driver's bus
      const bus = await Bus.findById(driver.busId);
      if (bus && bus.route) {
        query.push({ routeId: bus.route }); // Alerts specific to the bus's route
      }
    }

    const alerts = await AlertModel.find({ $or: query }).sort({ createdAt: -1 });
    res.json(alerts);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 