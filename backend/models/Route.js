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
  // GeoJSON shape for high-resolution route geometry (LineString or MultiLineString)
  shape: {
    type: {
      type: String,
      enum: ['LineString', 'MultiLineString'],
    },
    coordinates: {
      // LineString: [ [lng, lat], ... ]
      // MultiLineString: [ [ [lng, lat], ... ], ... ]
      type: Array,
      default: undefined,
    },
  },
  shapeSource: {
    type: String, // 'geojson' | 'gpx'
  },
  // Add other route-related fields as needed
});

// Geospatial index for fast queries on the route shape
RouteSchema.index({ shape: '2dsphere' });

module.exports = mongoose.model('Route', RouteSchema);
