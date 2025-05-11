import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  // DEBUG: Temporarily bypass authentication for development
  console.log("ProtectedRoute - Auth state:", { isAuthenticated, loading, user });
  
  // For development, just return the children without checking auth
  return children;
  
  // When ready for real authentication, uncomment this code:
  /*
  // Show loading screen while checking authentication
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to dashboard if admin-only route accessed by non-admin
  if (adminOnly && user?.role !== 'admin') {
    console.log("Not admin, redirecting to dashboard");
    return <Navigate to="/" replace />;
  }
  
  // Render children if authenticated and authorized
  console.log("Authorized, rendering children");
  return children;
  */
};

export default ProtectedRoute;