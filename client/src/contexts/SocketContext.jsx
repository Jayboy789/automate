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

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      
      // Create socket connection
      const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: { token },
        autoConnect: true
      });
      
      // Socket event handlers
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });
      
      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });
      
      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      // Set socket instance
      setSocket(socketInstance);
      
      // Cleanup on unmount
      return () => {
        socketInstance.disconnect();
      };
    } else {
      // Disconnect socket when not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated]);

  // Context value
  const value = {
    socket,
    connected,
    // Helper function to emit events
    emit: (event, data, callback) => {
      if (socket && connected) {
        socket.emit(event, data, callback);
      }
    },
    // Helper function to subscribe to events
    on: (event, callback) => {
      if (socket) {
        socket.on(event, callback);
        
        // Return unsubscribe function
        return () => socket.off(event, callback);
      }
      
      return () => {};
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