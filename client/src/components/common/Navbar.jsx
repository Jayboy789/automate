import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-link">
          <span className="brand-logo">AutoMate</span>
        </Link>
      </div>
      
      <div className="navbar-center">
        <div className="search-container">
          <i className="fas fa-search search-icon"></i>
          <input 
            type="text" 
            placeholder="Search..." 
            className="search-input"
          />
        </div>
      </div>
      
      <div className="navbar-right">
        {/* Notifications */}
        <div className="nav-icon-wrapper">
          <button className="nav-icon-button">
            <i className="fas fa-bell"></i>
            <span className="notification-badge">3</span>
          </button>
        </div>
        
        {/* User menu */}
        <div className="user-menu-container">
          <button className="user-menu-button" onClick={toggleUserMenu}>
            <div className="avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="user-name">{user?.name || 'User'}</span>
            <i className={`fas fa-chevron-${showUserMenu ? 'up' : 'down'} dropdown-arrow`}></i>
          </button>
          
          {showUserMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="user-info">
                  <div className="user-name-full">{user?.name || 'User'}</div>
                  <div className="user-email">{user?.email || 'user@example.com'}</div>
                </div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-items">
                <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <i className="fas fa-user"></i> Profile
                </Link>
                
                <Link to="/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <i className="fas fa-cog"></i> Settings
                </Link>
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item logout-button" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;