import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, getUser } from '../services/auth';

// Create context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // DEVELOPMENT MODE - Skip real authentication
  // Switch between development mode and real auth by changing this flag
  const DEV_MODE = false;

  useEffect(() => {
    if (DEV_MODE) {
      console.log("=== DEVELOPMENT MODE ENABLED ===");
      console.log("Using simulated authentication instead of real login");
      // Use a simulated user for development
      setUser({
        id: 'dev-user-id',
        name: 'Development User',
        email: 'dev@example.com',
        role: 'admin'
      });
      setLoading(false);
      return;
    }

    // Real authentication code - only runs if DEV_MODE is false
    const checkAuth = async () => {
      console.log("Checking authentication...");
      const token = localStorage.getItem('token');
      console.log("Token from localStorage:", token ? "Found" : "Not found");
      
      if (token) {
        try {
          // Get current user data
          console.log("Getting user data...");
          const userData = await getUser();
          console.log("User data received", userData);
          setUser(userData);
        } catch (err) {
          console.error('Authentication error:', err);
          // Clear invalid token
          localStorage.removeItem('token');
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [DEV_MODE]);

  // Login function
  const handleLogin = async (email, password) => {
    setError(null);
    
    if (DEV_MODE) {
      console.log("DEV MODE: Simulating successful login");
      // Simulate successful login in dev mode
      setUser({
        id: 'dev-user-id',
        name: 'Development User',
        email: email || 'dev@example.com',
        role: 'admin'
      });
      navigate('/');
      return true;
    }
    
    try {
      const { token, user } = await login(email, password);
      
      // Store token
      localStorage.setItem('token', token);
      
      // Set user data
      setUser(user);
      
      // Navigate to dashboard
      navigate('/');
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  // Register function
  const handleRegister = async (name, email, password) => {
    setError(null);
    
    if (DEV_MODE) {
      console.log("DEV MODE: Simulating successful registration");
      // Simulate successful registration in dev mode
      setUser({
        id: 'dev-user-id',
        name: name || 'Development User',
        email: email || 'dev@example.com',
        role: 'admin'
      });
      navigate('/');
      return true;
    }
    
    try {
      const { token, user } = await register(name, email, password);
      
      // Store token
      localStorage.setItem('token', token);
      
      // Set user data
      setUser(user);
      
      // Navigate to dashboard
      navigate('/');
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  // Logout function
  const handleLogout = () => {
    if (DEV_MODE) {
      console.log("DEV MODE: Simulating logout");
      // Even in dev mode, we'll clear the user to simulate logout
      setUser(null);
      navigate('/login');
      return;
    }
    
    // Clear token
    localStorage.removeItem('token');
    
    // Clear user data
    setUser(null);
    
    // Navigate to login
    navigate('/login');
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;