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
const { socketAuth } = require('./middleware/socketAuth');

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

// Development mode fallback data if MongoDB isn't available
const developmentFallbackData = {
  users: [
    { _id: 'dev-user-id', name: 'Development User', email: 'dev@example.com', role: 'admin' }
  ],
  workflows: [],
  scripts: [],
  agents: [],
  executions: [],
  clients: []
};

// Add these fallback routes if in development mode
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      // MongoDB not connected, use fallback data
      if (req.path === '/api/workflows') {
        return res.json(developmentFallbackData.workflows);
      } else if (req.path === '/api/agents') {
        return res.json(developmentFallbackData.agents);
      } else if (req.path === '/api/executions') {
        return res.json(developmentFallbackData.executions);
      } else if (req.path === '/api/clients') {
        return res.json(developmentFallbackData.clients);
      } else if (req.path === '/api/scripts') {
        return res.json(developmentFallbackData.scripts);
      }
    }
    next();
  });
}

// Set up Socket.io
try {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    pingTimeout: 60000,            // Increase ping timeout to 60 seconds
    connectTimeout: 45000,         // Increase connection timeout to 45 seconds
    transports: ['websocket', 'polling'],  // Use WebSocket with polling fallback
    allowUpgrades: true,           // Allow transport upgrades
    perMessageDeflate: true,       // Enable per-message deflate
    httpCompression: true,         // Enable HTTP compression
    wsEngine: 'ws'                 // Use the 'ws' WebSocket engine
  });
  console.log("Socket.io server created");

  // Make io available in routes
  app.set('io', io);

  // Apply authentication middleware to Socket.IO
  io.use((socket, next) => {
    console.log(`New socket connection attempt: ${socket.id}`);
    next();
  });
  
  // Only apply auth middleware if not in development
  if (process.env.NODE_ENV !== 'development') {
    io.use(socketAuth);
  } else {
    console.log("Development mode: Socket.IO authentication disabled");
  }

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Add user-specific room for targeted messages
    if (socket.user) {
      socket.join(`user:${socket.user._id}`);
      console.log(`User ${socket.user.name} joined room: user:${socket.user._id}`);
    }
    
    // Handle agent connection
    socket.on('agent:connect', (agentId) => {
      if (agentId) {
        socket.join(`agent:${agentId}`);
        console.log(`Agent ${agentId} joined room: agent:${agentId}`);
      }
    });
    
    // Handle job result
    socket.on('job:result', async (data) => {
      console.log(`Received job result for ${data.jobId}:`, data.success ? 'SUCCESS' : 'FAILURE');
      // Job result handling will be done in the job handler
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}. Reason: ${reason}`);
    });
    
    // Set up other socket event handlers
    socket.on('error', (error) => {
      console.error(`Socket ${socket.id} error:`, error);
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
      serverSelectionTimeoutMS: 10000,  // Timeout after 10 seconds
      socketTimeoutMS: 45000,           // Close sockets after 45 seconds of inactivity
      family: 4,                        // Use IPv4, skip trying IPv6
      maxPoolSize: 10,                  // Maximum number of sockets
      minPoolSize: 2                    // Minimum number of sockets
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
    // Start server even if MongoDB connection fails
    const PORT = process.env.PORT || 5000;
    console.log(`Starting server on port ${PORT} without MongoDB connection`);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} without MongoDB connection`);
    });
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

// Call the connectDB function
console.log("Calling connectDB function...");
connectDB().catch(err => {
  console.error("Error in connectDB:", err);
});

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