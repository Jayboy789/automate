import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Create context
const SocketContext = createContext(null);

// Socket provider component
export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Initialize socket connection when authenticated
  useEffect(() => {
    console.log('SocketProvider initializing, auth status:', isAuthenticated);
    
    // Hardcoded server URL for development
    const serverUrl = 'http://localhost:5000';
    console.log('Connecting to socket server at:', serverUrl);
    
    // Create socket with simplified configuration
    const socketInstance = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      timeout: 10000,
      auth: { token: 'dev-token' }  // Development token
    });
    
    // Socket event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected with ID:', socketInstance.id);
      setConnected(true);
      setConnectionAttempts(0);
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected. Reason:', reason);
      setConnected(false);
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setConnectionAttempts(prev => prev + 1);
    });
    
    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Set socket instance
    setSocket(socketInstance);
    
    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [isAuthenticated]);

  // Context value
  const value = {
    socket,
    connected,
    // Helper function to emit events
    emit: (event, data, callback) => {
      if (socket && connected) {
        socket.emit(event, data, callback);
        console.log('Socket event emitted:', event, data);
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
      console.warn('Cannot subscribe, socket not initialized');
      return () => {}; // Return empty function if no socket
    },
    // Force reconnection
    reconnect: () => {
      if (socket) {
        console.log('Forcing socket reconnection');
        socket.disconnect().connect();
      } else {
        console.warn('Cannot reconnect, socket not initialized');
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