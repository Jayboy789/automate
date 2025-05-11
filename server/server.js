// server.js - Main application entry point with detailed logging
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

console.log("Starting server initialization...");

// Create Express app
const app = express();
const server = http.createServer(app);
console.log("Express app and HTTP server created");

// Apply middleware
console.log("Applying middleware...");
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
console.log("Middleware applied");

// Import the authentication middleware
const { authenticateToken } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const scriptRoutes = require('./routes/scripts');
const workflowRoutes = require('./routes/workflows');
const agentRoutes = require('./routes/agents');
const jobRoutes = require('./routes/jobs');
const executionRoutes = require('./routes/executions');

// API routes - now that both app and authenticateToken are defined
app.use('/api/auth', authRoutes);
app.use('/api/clients', authenticateToken, clientRoutes);
app.use('/api/scripts', authenticateToken, scriptRoutes);
app.use('/api/workflows', authenticateToken, workflowRoutes);
app.use('/api/agents', agentRoutes); // Some endpoints require authentication, handled in the route
app.use('/api/job', jobRoutes); // Some endpoints require authentication, handled in the route
app.use('/api/executions', authenticateToken, executionRoutes);

// Basic route to test server
app.get('/', (req, res) => {
  res.send('AutoMate API is running');
});

// Set up Socket.io
try {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  console.log("Socket.io server created");

  // Make io available in routes
  app.set('io', io);

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
} catch (error) {
  console.error("Error setting up Socket.io:", error);
}

console.log("Setting up Connect DB function...");
// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("Connection string:", process.env.MONGODB_URI || 'mongodb://localhost:27017/automate');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/automate', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Check if admin user exists and create if not
    console.log("Checking for admin user...");
    await createDefaultAdmin();
    
    // Start server after successful DB connection
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Don't exit the process in development mode to allow for reconnection
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      // In development, start the server anyway
      console.log("Starting server without MongoDB in development mode");
      const PORT = process.env.PORT || 5000;
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT} without MongoDB connection`);
      });
    }
  }
};

// Create default admin user if none exists
const createDefaultAdmin = async () => {
  try {
    console.log("Creating admin user if needed...");
    const User = require('./models/User');
    
    // Check if any user exists
    const userCount = await User.countDocuments();
    console.log(`User count: ${userCount}`);
    
    if (userCount === 0) {
      // Create admin user
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password', // Will be hashed by pre-save hook
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Default admin user created. Email: admin@example.com, Password: password');
    }
  } catch (error) {
    console.error('Error checking/creating admin user:', error);
  }
};

// IMPORTANT: Call the connectDB function
console.log("Calling connectDB function...");
connectDB().catch(err => {
  console.error("Error in connectDB:", err);
});

// Display startup message
console.log("Server initialization complete - waiting for MongoDB connection or fallback startup");

// Handle process shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

// Export for testing
module.exports = { app, server };