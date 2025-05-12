// server.js - Main application entry point with improved error handling and logging
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

// Apply middleware with more permissive CORS
console.log("Applying middleware...");
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

// Development mode fallback data
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

// Add these fallback routes in development mode
if (process.env.NODE_ENV === 'development') {
  console.log("Setting up development fallback routes");
  
  // These routes will work even if MongoDB is not connected
  app.get('/api/workflows', (req, res) => {
    console.log("Serving fallback workflows data");
    res.json(developmentFallbackData.workflows);
  });
  
  app.get('/api/agents', (req, res) => {
    console.log("Serving fallback agents data");
    res.json(developmentFallbackData.agents);
  });
  
  app.get('/api/executions', (req, res) => {
    console.log("Serving fallback executions data");
    res.json(developmentFallbackData.executions);
  });
  
  app.get('/api/clients', (req, res) => {
    console.log("Serving fallback clients data");
    res.json(developmentFallbackData.clients);
  });
  
  app.get('/api/scripts', (req, res) => {
    console.log("Serving fallback scripts data");
    res.json(developmentFallbackData.scripts);
  });
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes); // Skip auth for development
app.use('/api/scripts', scriptRoutes); // Skip auth for development
app.use('/api/workflows', workflowRoutes); // Skip auth for development
app.use('/api/agents', agentRoutes); // Skip auth for development
app.use('/api/job', jobRoutes); // Skip auth for development
app.use('/api/executions', executionRoutes); // Skip auth for development

// Basic route to test server
app.get('/', (req, res) => {
  res.send('AutoMate API is running');
});

// Set up Socket.io with simplified configuration
try {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins in development
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });
  console.log("Socket.io server created");

  // Make io available in routes
  app.set('io', io);

  // Skip auth middleware in development mode
  console.log("Development mode: Socket.IO authentication disabled");

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Add simulated user
    socket.user = { _id: 'dev-user-id', name: 'Development User' };
    socket.join(`user:dev-user-id`);
    
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
      // Just log in development mode
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

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("Connection string:", process.env.MONGODB_URI || 'mongodb://localhost:27017/automate');
    
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/automate', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    // Create default admin in development mode
    if (process.env.NODE_ENV === 'development') {
      await createDefaultAdmin();
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Server will continue without MongoDB connection');
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

// Connect to DB and start server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Error in connectDB:", err);
  // Start server even if DB connection fails
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} without MongoDB connection`);
  });
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