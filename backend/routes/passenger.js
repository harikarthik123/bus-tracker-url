const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
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

// Update passenger profile (name, phone, avatar base64)
router.put('/me', auth, async (req, res) => {
  try {
    const { name, phone, avatarBase64 } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof phone === 'string' && phone.trim()) user.phone = phone.trim();

    // Handle avatar upload if provided as base64 (data URI or raw base64)
    if (avatarBase64 && typeof avatarBase64 === 'string') {
      const matches = avatarBase64.match(/^data:(.*?);base64,(.*)$/);
      const base64Data = matches ? matches[2] : avatarBase64;
      const ext = matches && matches[1] && matches[1].includes('png') ? 'png' : 'jpg';

      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

      const filename = `avatar_${user._id}_${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      user.avatarUrl = `/uploads/${filename}`;
    }

    await user.save();
    const sanitized = user.toObject();
    delete sanitized.password;
    return res.json(sanitized);
  } catch (err) {
    console.error('Profile update error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
