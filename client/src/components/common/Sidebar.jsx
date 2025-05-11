import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="fa fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink to="/workflows" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="fa fa-project-diagram"></i>
              <span>Workflows</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink to="/scripts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="fa fa-code"></i>
              <span>Scripts</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink to="/agents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="fa fa-robot"></i>
              <span>Agents</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink to="/executions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="fa fa-history"></i>
              <span>Executions</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink to="/clients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="fa fa-building"></i>
              <span>Clients</span>
            </NavLink>
          </li>

          {isAdmin && (
            <>
              <li className="nav-divider"></li>
              <li className="nav-section">Admin</li>
              
              <li className="nav-item">
                <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="fa fa-users"></i>
                  <span>Users</span>
                </NavLink>
              </li>
              
              <li className="nav-item">
                <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="fa fa-cog"></i>
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