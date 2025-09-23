const mongoose = require('mongoose');

const BusSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
  },
  regNo: {
    type: String,
    required: true,
    unique: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Driver can be assigned later
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    default: null, // Route can be assigned later
  },
  
  // Add other bus-related fields as needed
});

module.exports = mongoose.model('Bus', BusSchema);
