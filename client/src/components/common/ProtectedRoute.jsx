const ProtectedRoute = ({ children, adminOnly = false }) => {
  // DEBUG: Temporarily bypass authentication for development
  console.log("ProtectedRoute - Auth state bypassed for development");
  
  // For development, just return the children without checking auth
  return children;
};

export default ProtectedRoute;