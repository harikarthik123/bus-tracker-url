const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: function() { return this.role === 'passenger' || this.role === 'admin'; }
  },
  phone: {
    type: String,
    required: function() { return this.role === 'passenger'; },
    unique: true,
    sparse: true, // Allows null values to not violate unique constraint
  },
  email: {
    type: String,
    required: function() { return this.role !== 'passenger'; },
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required: function() { return this.role !== 'passenger'; }
  },
  role: {
    type: String,
    enum: ['driver', 'passenger', 'admin'],
    required: true,
  },
  driverId: {
    type: String,
    required: function() { return this.role === 'driver'; },
    unique: true,
    sparse: true,
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: false,
    default: null
  },
  avatarUrl: {
    type: String,
    required: false,
    default: null,
  },
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
