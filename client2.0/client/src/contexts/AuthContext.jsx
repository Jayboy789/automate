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

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Get current user data
          const userData = await getUser();
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
  }, []);

  // Login function
  const handleLogin = async (email, password) => {
    setError(null);
    
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