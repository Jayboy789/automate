import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const { login, isAuthenticated, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is already authenticated, redirecting to dashboard");
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    // Clear previous errors
    setError(null);
    
    // Show loading state
    setLoading(true);
    
    try {
      console.log("Attempting login with:", { email });
      
      // Call the login function from AuthContext
      const success = await login(email, password);
      
      console.log("Login result:", success);
      
      if (success) {
        console.log("Login successful, redirecting to dashboard");
        // The navigate should happen in the login function in AuthContext,
        // but we can add an extra navigation here just to be sure
        navigate('/', { replace: true });
      } else {
        // This will typically be handled by the AuthContext error state,
        // but we can also set a local error
        setError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  // If the user is already authenticated, don't render the login page
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>AutoMate</h1>
        </div>
        
        <h2 className="auth-title">Log in to your account</h2>
        
        {/* Display errors from auth context or local state */}
        {(authError || error) && (
          <div className="auth-error">
            {authError || error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-footer">
            <div className="remember-me">
              <label>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
            </div>
            
            <Link to="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
          
          {/* Add a helper message for testing */}
          <div className="helper-message" style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Default credentials: admin@example.com / password
          </div>
        </form>
        
        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;