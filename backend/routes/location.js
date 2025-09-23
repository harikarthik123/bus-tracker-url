const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Location = require('../models/Location');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

// @route   GET api/location/live
// @desc    Get live locations of all buses (active and last known)
// @access  Private (Admin/Passenger etc.)
router.get('/live', auth, async (req, res) => {
  try {
    // Clean up very old inactive locations (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await Location.deleteMany({ 
      isActive: false, 
      lastActive: { $lt: oneDayAgo } 
    });
    
    // Get all locations (both active and inactive)
    const allLocations = await Location.find().populate({
      path: 'busId',
      select: 'busNumber regNo route',
      populate: {
        path: 'route',
        select: 'name _id'
      }
    }).sort({ lastActive: -1 }); // Sort by most recent activity
    
    allLocations.forEach(loc => {
      if (!loc.busId) {
        console.warn('Location document with ID', loc._id, 'is missing busId.');
      }
    });
    
    console.log('Live locations query result:', allLocations.length, 'locations found');
    res.json(allLocations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/location/bus/:busId
// @desc    Get live location for a specific bus
// @access  Private (Admin/Passenger etc.)
router.get('/bus/:busId', auth, async (req, res) => {
  try {
    const location = await Location.findOne({ busId: req.params.busId }).populate('busId', 'busNumber regNo');

    if (!location) {
      return res.status(404).json({ msg: 'Location not found for this bus' });
    }

    res.json(location);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Helper function to calculate distance between two points (Haversine formula)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // Distance in kilometers
};

// @route   GET api/location/eta/:busId
// @desc    Get estimated time of arrival for a specific bus
// @access  Private (Admin/Passenger etc.)
router.get('/eta/:busId', auth, async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.busId).populate('route');
    if (!bus) {
      return res.status(404).json({ msg: 'Bus not found' });
    }
    if (!bus.route) {
      return res.status(400).json({ msg: 'Bus has no assigned route' });
    }

    const busLocation = await Location.findOne({ busId: req.params.busId });
    if (!busLocation) {
      return res.status(404).json({ msg: 'Live location not available for this bus' });
    }

    const { lat, lng, speed } = busLocation;
    const route = bus.route;
    const stops = route.stops.sort((a, b) => a.order - b.order);

    if (stops.length === 0) {
      return res.status(400).json({ msg: 'Route has no stops defined' });
    }

    let remainingDistance = 0;
    let currentStopIndex = -1;

    // Find the closest upcoming stop
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const distToStop = haversineDistance(lat, lng, stop.latitude, stop.longitude);
      // A simple heuristic: if within 500m, consider it the current or next stop
      if (distToStop < 0.5) { 
        currentStopIndex = i;
        break;
      }
    }

    // If no upcoming stop found within heuristic, or if we are past all stops, assume we are at the beginning of the route for ETA calculation (or no ETA)
    if (currentStopIndex === -1 && stops.length > 0) {
      // Assume the bus is currently heading to the first stop if not near any
      currentStopIndex = 0; 
    } else if (currentStopIndex !== -1 && currentStopIndex < stops.length - 1) {
      // If near a stop, consider the next stop onwards for remaining distance
      currentStopIndex++; 
    }
    
    // Calculate remaining distance from current position to all subsequent stops
    if (currentStopIndex !== -1) {
      if (currentStopIndex < stops.length) {
        // Distance to the first relevant stop
        remainingDistance += haversineDistance(lat, lng, stops[currentStopIndex].latitude, stops[currentStopIndex].longitude);
      }
      for (let i = currentStopIndex; i < stops.length - 1; i++) {
        remainingDistance += haversineDistance(
          stops[i].latitude,
          stops[i].longitude,
          stops[i + 1].latitude,
          stops[i + 1].longitude
        );
      }
    }

    const avgSpeed = speed > 5 ? speed : 20; // Assume minimum average speed for calculation if bus is stopped or very slow
    let etaMinutes = 0;
    if (avgSpeed > 0) {
      etaMinutes = (remainingDistance / avgSpeed) * 60; // ETA in minutes
    }

    res.json({ busId: bus._id, eta: etaMinutes, unit: 'minutes', remainingDistance: remainingDistance.toFixed(2), speed: avgSpeed.toFixed(2) });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
