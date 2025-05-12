import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/sidebar.css'; // Updated import path

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">AutoMate</h1>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink to="/workflows" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="fas fa-project-diagram"></i>
              <span>Workflows</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink to="/scripts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="fas fa-code"></i>
              <span>Scripts</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink to="/agents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="fas fa-robot"></i>
              <span>Agents</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink to="/executions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="fas fa-history"></i>
              <span>Executions</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink to="/clients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="fas fa-building"></i>
              <span>Clients</span>
            </NavLink>
          </li>

          {isAdmin && (
            <>
              <li className="nav-divider"></li>
              <li className="nav-section">Admin</li>
              
              <li className="nav-item">
                <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="fas fa-users"></i>
                  <span>Users</span>
                </NavLink>
              </li>
              
              <li className="nav-item">
                <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="fas fa-cog"></i>
                  <span>Settings</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <a href="https://github.com/yourusername/automate" target="_blank" rel="noopener noreferrer" className="github-link">
          <i className="fab fa-github"></i>
          <span>GitHub</span>
        </a>
        
        <div className="sidebar-version">v1.0.0</div>
      </div>
    </aside>
  );
};

export default Sidebar;