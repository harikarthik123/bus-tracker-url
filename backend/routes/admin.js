const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route'); // Added Route model
const AlertModel = require('../models/Alert');
const auth = require('../middleware/auth'); // We will create this middleware later for protected routes

// @route   GET api/admin/drivers
// @desc    Get all drivers
// @access  Private (Admin only)
router.get('/drivers', auth, async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).select('-password');
    res.json(drivers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/admin/drivers
// @desc    Add new driver
// @access  Private (Admin only)
router.post('/drivers', auth, async (req, res) => {
  const { name, email, password, driverId, busId } = req.body;

  try {
    let driver = await User.findOne({ $or: [{ email }, { driverId }] });
    if (driver) {
      return res.status(400).json({ msg: 'Driver with this email or driverId already exists' });
    }

    let resolvedBusId = null;
    if (busId) {
      try {
        // If it's a valid ObjectId, use as-is; else try resolving by busNumber
        if (mongoose.Types.ObjectId.isValid(busId)) {
          resolvedBusId = busId;
        } else {
          const busByNumber = await Bus.findOne({ busNumber: busId });
          if (!busByNumber) {
            return res.status(400).json({ msg: 'Invalid bus reference. Provide a valid Bus ObjectId or existing busNumber.' });
          }
          resolvedBusId = busByNumber._id;
        }
      } catch (resolveErr) {
        return res.status(400).json({ msg: 'Invalid bus reference.' });
      }
    }

    driver = new User({
      name,
      email,
      password,
      role: 'driver',
      driverId,
      busId: resolvedBusId,
    });

    await driver.save();
    res.status(201).json({ msg: 'Driver created successfully', driver });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/drivers/:id
// @desc    Update driver
// @access  Private (Admin only)
router.put('/drivers/:id', auth, async (req, res) => {
  const { name, email, password, driverId, busId } = req.body;

  try {
    let driver = await User.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ msg: 'Driver not found' });
    }

    // Check unique email and driverId
    if (email && email !== driver.email) {
      const existingDriver = await User.findOne({ email });
      if (existingDriver) {
        return res.status(400).json({ msg: 'Email already in use by another driver' });
      }
    }
    if (driverId && driverId !== driver.driverId) {
      const existingDriverId = await User.findOne({ driverId });
      if (existingDriverId) {
        return res.status(400).json({ msg: 'driverId already in use by another driver' });
      }
    }

    driver.name = name || driver.name;
    driver.email = email || driver.email;
    if (typeof driverId !== 'undefined') {
      driver.driverId = driverId || driver.driverId;
    }

    if (typeof busId !== 'undefined') {
      if (!busId) {
        driver.busId = null;
      } else if (mongoose.Types.ObjectId.isValid(busId)) {
        driver.busId = busId;
      } else {
        const busByNumber = await Bus.findOne({ busNumber: busId });
        if (!busByNumber) {
          return res.status(400).json({ msg: 'Invalid bus reference. Provide a valid Bus ObjectId or existing busNumber.' });
        }
        driver.busId = busByNumber._id;
      }
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      driver.password = await bcrypt.hash(password, salt);
    }

    await driver.save();
    res.json({ msg: 'Driver updated successfully', driver });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/admin/drivers/:id
// @desc    Delete driver
// @access  Private (Admin only)
router.delete('/drivers/:id', auth, async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ msg: 'Driver not found' });
    }

    await driver.deleteOne();
    res.json({ msg: 'Driver removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

// @route   GET api/admin/buses
// @desc    Get all buses
// @access  Private (Admin only)
router.get('/buses', auth, async (req, res) => {
  try {
    const buses = await Bus.find().populate('driver', 'name driverId').populate('route', 'name');
    res.json(buses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/admin/buses
// @desc    Add new bus
// @access  Private (Admin only)
router.post('/buses', auth, async (req, res) => {
  const { busNumber, regNo, capacity, driver, route } = req.body;

  try {
    if (!regNo) {
      return res.status(400).json({ msg: 'regNo is required' });
    }

    let existingByReg = await Bus.findOne({ regNo });
    if (existingByReg) {
      return res.status(400).json({ msg: 'Bus with this regNo already exists' });
    }

    const bus = new Bus({
      busNumber,
      regNo,
      capacity,
      driver: driver || null,
      route: route || null,
    });

    await bus.save();
    res.status(201).json({ msg: 'Bus created successfully', bus });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/buses/:id
// @desc    Update bus
// @access  Private (Admin only)
router.put('/buses/:id', auth, async (req, res) => {
  const { busNumber, regNo, capacity, driver, route } = req.body;

  try {
    let bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ msg: 'Bus not found' });
    }

    // Enforce unique regNo
    if (regNo && regNo !== bus.regNo) {
      const existingByReg = await Bus.findOne({ regNo });
      if (existingByReg) {
        return res.status(400).json({ msg: 'regNo already in use by another bus' });
      }
    }

    bus.busNumber = busNumber || bus.busNumber;
    if (typeof regNo !== 'undefined') {
      bus.regNo = regNo || bus.regNo;
    }
    bus.capacity = capacity || bus.capacity;
    bus.driver = driver || null;
    bus.route = route || null;

    await bus.save();
    res.json({ msg: 'Bus updated successfully', bus });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/admin/buses/:id
// @desc    Delete bus
// @access  Private (Admin only)
router.delete('/buses/:id', auth, async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ msg: 'Bus not found' });
    }

    await bus.deleteOne();
    res.json({ msg: 'Bus removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/routes
// @desc    Get all routes
// @access  Private (Admin only)
router.get('/routes', auth, async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/admin/routes
// @desc    Add new route
// @access  Private (Admin only)
router.post('/routes', auth, async (req, res) => {
  const { name, stops, duration, routeCoordinates } = req.body;

  try {
    let route = await Route.findOne({ name });
    if (route) {
      return res.status(400).json({ msg: 'Route with this name already exists' });
    }

    route = new Route({
      name,
      stops: stops || [],
      duration,
      routeCoordinates: routeCoordinates || [],
    });

    await route.save();
    res.status(201).json({ msg: 'Route created successfully', route });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/routes/:id
// @desc    Update route
// @access  Private (Admin only)
router.put('/routes/:id', auth, async (req, res) => {
  const { name, stops, duration, routeCoordinates } = req.body;

  try {
    let route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ msg: 'Route not found' });
    }

    // Check if name is being changed to an existing one
    if (name && name !== route.name) {
      const existingRoute = await Route.findOne({ name });
      if (existingRoute) {
        return res.status(400).json({ msg: 'Route name already in use by another route' });
      }
    }

    route.name = name || route.name;
    route.stops = stops || route.stops;
    route.duration = duration || route.duration;
    route.routeCoordinates = routeCoordinates || route.routeCoordinates;

    await route.save();
    res.json({ msg: 'Route updated successfully', route });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/admin/routes/:id
// @desc    Delete route
// @access  Private (Admin only)
router.delete('/routes/:id', auth, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({ msg: 'Route not found' });
    }

    await route.deleteOne();
    res.json({ msg: 'Route removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Alerts
// @route   GET api/admin/alerts
// @desc    List alerts
// @access  Private (Admin only)
router.get('/alerts', auth, async (req, res) => {
  try {
    const alerts = await AlertModel.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/admin/alerts
// @desc    Create alert (global, by routeId, or by bus)
// @access  Private (Admin only)
router.post('/alerts', auth, async (req, res) => {
  const { 
    message, 
    routeId, 
    busId, 
    busNumber, 
    regNo, 
    alertType = 'general',
    routeName,
    reason 
  } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ msg: 'message is required' });
    }

    // For caution alerts, validate required fields
    if (alertType === 'caution') {
      if (!routeName || !busNumber || !reason) {
        return res.status(400).json({ 
          msg: 'Route name, bus number, and reason are required for caution alerts' 
        });
      }
    }

    let resolvedBusId = null;
    if (busId || busNumber || regNo) {
      if (busId && mongoose.Types.ObjectId.isValid(busId)) {
        resolvedBusId = busId;
      } else {
        const query = {};
        if (busNumber) query.busNumber = busNumber;
        if (regNo) query.regNo = regNo;
        const bus = await Bus.findOne(query);
        if (!bus) {
          return res.status(400).json({ msg: 'Bus not found for provided reference' });
        }
        resolvedBusId = bus._id;
      }
    }

    const alertData = {
      message,
      routeId: routeId || null,
      busId: resolvedBusId,
      alertType,
      for: 'passenger', // Default to passenger alerts from admin panel
    };

    // Add caution-specific fields
    if (alertType === 'caution') {
      alertData.routeName = routeName;
      alertData.busNumber = busNumber;
      alertData.reason = reason;
    }

    const alert = new AlertModel(alertData);
    await alert.save();
    res.status(201).json({ msg: 'Alert created', alert });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/admin/alerts/:id
// @desc    Delete specific alert
// @access  Private (Admin only)
router.delete('/alerts/:id', auth, async (req, res) => {
  try {
    const alert = await AlertModel.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ msg: 'Alert not found' });
    }

    await alert.deleteOne();
    res.json({ msg: 'Alert deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/admin/alerts/bus/:busId
// @desc    Delete all alerts for a specific bus
// @access  Private (Admin only)
router.delete('/alerts/bus/:busId', auth, async (req, res) => {
  try {
    const { busId } = req.params;
    
    // Validate busId
    if (!mongoose.Types.ObjectId.isValid(busId)) {
      return res.status(400).json({ msg: 'Invalid bus ID' });
    }

    // Check if bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ msg: 'Bus not found' });
    }

    // Delete all alerts for this bus
    const result = await AlertModel.deleteMany({ busId });
    res.json({ 
      msg: `Deleted ${result.deletedCount} alerts for bus ${bus.busNumber}`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/admin/alerts/route/:routeId
// @desc    Delete all alerts for a specific route
// @access  Private (Admin only)
router.delete('/alerts/route/:routeId', auth, async (req, res) => {
  try {
    const { routeId } = req.params;
    
    // Validate routeId
    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ msg: 'Invalid route ID' });
    }

    // Check if route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ msg: 'Route not found' });
    }

    // Delete all alerts for this route
    const result = await AlertModel.deleteMany({ routeId });
    res.json({ 
      msg: `Deleted ${result.deletedCount} alerts for route ${route.name}`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/admin/alerts/global
// @desc    Delete all global alerts (alerts not tied to specific bus or route)
// @access  Private (Admin only)
router.delete('/alerts/global', auth, async (req, res) => {
  try {
    // Delete all global alerts (where both routeId and busId are null)
    const result = await AlertModel.deleteMany({ 
      routeId: null, 
      busId: null 
    });
    res.json({ 
      msg: `Deleted ${result.deletedCount} global alerts`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
