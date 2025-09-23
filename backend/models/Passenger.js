const mongoose = require('mongoose');

const PassengerSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, required: true, unique: true },
  phonePrefix: { type: String, default: '+91' },
  password: { type: String, required: true },
  // ...other fields...
});

module.exports = mongoose.model('Passenger', PassengerSchema);
