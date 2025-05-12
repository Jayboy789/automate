import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Enable debugging for socket.io for development only
localStorage.debug = 'socket.io-client:*';

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Always connect in development mode for easier testing
    const DEV_MODE = process.env.NODE_ENV === 'development';
    
    if (isAuthenticated || DEV_MODE) {
      const token = localStorage.getItem('token');
      const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      console.log('Attempting to connect socket to:', serverUrl, 'DEV_MODE:', DEV_MODE);
      
      // Clear any existing reconnect timeout
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      
      try {
        // Create socket connection with improved transport settings
        const socketInstance = io(serverUrl, {
          auth: token ? { token } : {},
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: 10,
          timeout: 10000,
          transports: ['websocket', 'polling']
        });
        
        // Socket event handlers
        socketInstance.on('connect', () => {
          console.log('Socket connected successfully with ID:', socketInstance.id);
          setConnected(true);
          setConnectionAttempts(0); // Reset attempts on successful connection
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
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
          }
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error('Error creating socket instance:', error);
      }
    } else {
      // Disconnect socket when not authenticated
      if (socket) {
        console.log('User not authenticated, disconnecting socket');
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated]);

  // Force reconnection if connections keep failing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (connectionAttempts > 0 && !connected && !reconnectTimeout) {
      const timeout = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 30000);
      console.log(`Will attempt reconnection in ${timeout/1000} seconds (attempt ${connectionAttempts})`);
      
      const timeoutId = setTimeout(() => {
        if (!connected) {
          console.log(`Attempting forced reconnection (attempt ${connectionAttempts})`);
          // Recreate the socket by triggering the first useEffect
          setSocket(null);
        }
      }, timeout);
      
      setReconnectTimeout(timeoutId);
      
      return () => {
        clearTimeout(timeoutId);
        setReconnectTimeout(null);
      };
    }
  }, [connectionAttempts, connected]);

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