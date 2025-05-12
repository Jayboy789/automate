// middleware/socketAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Direct import

/**
 * Socket.io authentication middleware
 */
const socketAuth = async (socket, next) => {
  try {
    console.log('Socket auth middleware running for socket:', socket.id);
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('Socket auth failed: No token provided');
      return next(new Error('Authentication required - no token provided'));
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production'
      );
      
      // Find user
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        console.log('Socket auth failed: User not found');
        return next(new Error('Authentication failed - user not found'));
      }
      
      // Attach user to socket
      console.log(`Socket ${socket.id} authenticated for user: ${user.name}`);
      socket.user = user;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      return next(new Error('Invalid or expired token'));
    }
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Internal server error during authentication'));
  }
};

module.exports = { socketAuth };