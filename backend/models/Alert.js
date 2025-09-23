const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  for: {
    type: String,
    enum: ['passenger', 'driver'],
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
  },
  alertType: {
    type: String,
    enum: ['general', 'caution'],
    default: 'general',
  },
  routeName: {
    type: String,
  },
  busNumber: {
    type: String,
  },
  reason: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Alert', AlertSchema);
