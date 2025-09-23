require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth'); // Import auth routes
const adminRoutes = require('./routes/admin'); // Import admin routes
const driverRoutes = require('./routes/driver');
const locationRoutes = require('./routes/location');
const passengerRoutes = require('./routes/passenger'); // Import passenger routes

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for mobile apps
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.error(err));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/passenger', passengerRoutes); // Use passenger routes

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bus Tracker API is running...', 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Additional health check for mobile apps
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
