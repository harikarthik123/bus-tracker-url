const mongoose = require('mongoose');

const StopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
});

const RouteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  stops: [StopSchema], 
  duration: {
    type: String, // e.g., "30 minutes", "1 hour 15 minutes"
  },
  routeCoordinates: [
    {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
  ],
  // Add other route-related fields as needed
});

module.exports = mongoose.model('Route', RouteSchema);
