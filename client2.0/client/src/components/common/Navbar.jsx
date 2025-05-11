import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
        <Link to="/">
          <span className="app-logo">AutoMate</span>
        </Link>
      </div>
      
      <div className="navbar-center">
        {/* Global search could go here */}
      </div>
      
      <div className="navbar-right">
        {/* Notifications */}
        <div className="nav-icon">
          <i className="fa fa-bell"></i>
        </div>
        
        {/* User menu */}
        <div className="user-menu">
          <button className="user-button" onClick={toggleUserMenu}>
            <div className="avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="user-name">{user?.name || 'User'}</span>
            <i className={`fa fa-chevron-${showUserMenu ? 'up' : 'down'}`}></i>
          </button>
          
          {showUserMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="user-info">
                  <div className="user-name">{user?.name}</div>
                  <div className="user-email">{user?.email}</div>
                </div>
              </div>
              
              <div className="dropdown-items">
                <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <i className="fa fa-user"></i> Profile
                </Link>
                
                <Link to="/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <i className="fa fa-cog"></i> Settings
                </Link>
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item logout-button" onClick={handleLogout}>
                  <i className="fa fa-sign-out-alt"></i> Log out
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