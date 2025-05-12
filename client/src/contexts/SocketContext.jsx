import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Enable debugging for socket.io
localStorage.debug = '*'; // Comment this out in production

// Create context
const SocketContext = createContext(null);

// Socket provider component
export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [reconnectTimeout, setReconnectTimeout] = useState(null);

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      console.log('Attempting to connect socket to:', serverUrl);
      
      // Clear any existing reconnect timeout
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      
      // Create socket connection with improved transport settings
      const socketInstance = io(serverUrl, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 5000,
        reconnectionDelayMax: 60000,
        reconnectionAttempts: 5,
        timeout: 20000,
        transports: ['websocket', 'polling'],  // Try WebSocket first, fallback to polling
        upgrade: true,                         // Allow transport upgrade
        rememberUpgrade: true,                 // Remember if WebSocket was successfully connected
        forceNew: true,                        // Force a new connection
        autoConnect: true,                     // Connect automatically
        rejectUnauthorized: false              // Accept self-signed certificates if any
      });
      
      // Socket event handlers
      socketInstance.on('connect', () => {
        console.log('Socket connected with ID:', socketInstance.id);
        setConnected(true);
        setConnectionAttempts(0); // Reset attempts on successful connection
      });
      
      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected. Reason:', reason);
        setConnected(false);
        
        // If server closed the connection, implement custom reconnect logic with backoff
        if (reason === 'io server disconnect' || reason === 'transport error') {
          console.log('Server disconnected the socket or transport error. Using custom reconnect...');
          
          const timeout = Math.min(5000 * Math.pow(2, connectionAttempts), 60000);
          console.log(`Will attempt reconnection in ${timeout/1000} seconds`);
          
          const timeoutId = setTimeout(() => {
            if (connectionAttempts < 5) {
              console.log(`Reconnection attempt ${connectionAttempts + 1}`);
              socketInstance.connect();
              setConnectionAttempts(prev => prev + 1);
            } else {
              console.log('Maximum reconnection attempts reached');
            }
          }, timeout);
          
          setReconnectTimeout(timeoutId);
        }
      });
      
      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        
        // Handle authentication errors specifically
        if (error.message.includes('auth') || error.message.includes('token')) {
          console.log('Authentication error - might need to refresh token');
        }
      });
      
      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      socketInstance.io.on('reconnect_attempt', (attempt) => {
        console.log(`Socket.IO reconnect attempt: ${attempt}`);
      });
      
      socketInstance.io.on('reconnect_error', (error) => {
        console.log('Socket.IO reconnect error:', error);
      });
      
      socketInstance.io.on('reconnect_failed', () => {
        console.log('Socket.IO reconnect failed');
      });
      
      // Set socket instance
      setSocket(socketInstance);
      
      // Cleanup on unmount
      return () => {
        console.log('Cleaning up socket connection');
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        socketInstance.disconnect();
      };
    } else {
      // Disconnect socket when not authenticated
      if (socket) {
        console.log('User not authenticated, disconnecting socket');
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated, connectionAttempts]);

  // Context value
  const value = {
    socket,
    connected,
    // Helper function to emit events
    emit: (event, data, callback) => {
      if (socket && connected) {
        socket.emit(event, data, callback);
      } else {
        console.warn('Cannot emit event, socket not connected:', event);
      }
    },
    // Helper function to subscribe to events
    on: (event, callback) => {
      if (socket) {
        console.log('Subscribing to event:', event);
        socket.on(event, callback);
        
        // Return unsubscribe function
        return () => {
          console.log('Unsubscribing from event:', event);
          socket.off(event, callback);
        };
      }
      
      return () => {};
    },
    // Force reconnection
    reconnect: () => {
      if (socket) {
        console.log('Forcing socket reconnection');
        socket.disconnect().connect();
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook for using socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};

export default SocketContext;