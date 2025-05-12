import React from 'react';
import { Link } from 'react-router-dom';

const AgentStatus = ({ agents }) => {
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Calculate time ago
  const timeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now - then) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  };

  // If no agents, display message
  if (agents.length === 0) {
    return (
      <div className="empty-state">
        <i className="fa fa-robot empty-icon"></i>
        <h2>No Agents Found</h2>
        <p>Configure an agent to run automations on your systems.</p>
        <Link to="/agents" className="btn btn-primary">
          Set Up Agent
        </Link>
      </div>
    );
  }

  return (
    <div className="agent-status">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Platform</th>
            <th>Status</th>
            <th>Last Seen</th>
            <th>Resources</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.agentId || agent._id}>
              <td>
                <Link to={`/agents/${agent.agentId || agent._id}`} className="agent-name">
                  {agent.name || `Agent-${(agent.agentId || '').substring(0, 8)}`}
                </Link>
                <div className="agent-id" style={{ fontSize: '12px', color: '#6b7280' }}>
                  ID: {(agent.agentId || agent._id || '').substring(0, 12)}...
                </div>
              </td>
              <td>
                <div className="platform-info" style={{ display: 'flex', alignItems: 'center' }}>
                  <i className={`fa fa-${getPlatformIcon(agent.platform)}`} style={{ marginRight: '8px' }}></i>
                  <span>{formatPlatform(agent.platform)}</span>
                  {agent.version && <span className="version" style={{ fontSize: '12px', marginLeft: '5px', opacity: 0.7 }}>v{agent.version}</span>}
                </div>
              </td>
              <td>
                <span className={`status-badge status-${agent.status?.toLowerCase() || 'offline'}`}>
                  {agent.status || 'Offline'}
                </span>
              </td>
              <td title={formatTime(agent.lastSeen)}>
                {timeAgo(agent.lastSeen)}
              </td>
              <td>
                {agent.cpuUsage !== undefined ? (
                  <div className="resource-usage">
                    <div className="usage-item">
                      <span className="usage-label">CPU:</span>
                      <div className="usage-bar">
                        <div 
                          className="usage-bar-fill" 
                          style={{ width: `${agent.cpuUsage}%` }}
                        ></div>
                      </div>
                      <span className="usage-value">{Math.round(agent.cpuUsage)}%</span>
                    </div>
                    <div className="usage-item">
                      <span className="usage-label">MEM:</span>
                      <div className="usage-bar">
                        <div 
                          className="usage-bar-fill" 
                          style={{ width: `${agent.memoryUsage}%` }}
                        ></div>
                      </div>
                      <span className="usage-value">{Math.round(agent.memoryUsage || 0)}%</span>
                    </div>
                  </div>
                ) : (
                  <span style={{ color: '#6b7280', fontSize: '13px', fontStyle: 'italic' }}>No data available</span>
                )}
              </td>
              <td>
                <div className="table-actions">
                  <Link 
                    to={`/agents/${agent.agentId || agent._id}`} 
                    className="btn-table"
                    title="View Details"
                  >
                    <i className="fa fa-info-circle"></i>
                  </Link>
                  
                  <button 
                    className="btn-table"
                    title="Execute Script"
                    onClick={() => alert('Coming soon: Execute script on this agent')}
                  >
                    <i className="fa fa-play"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper function to get platform icon
function getPlatformIcon(platform) {
  if (!platform) return 'server';
  
  const platformStr = platform.toLowerCase();
  if (platformStr.includes('win')) return 'windows';
  if (platformStr.includes('mac') || platformStr.includes('darwin')) return 'apple';
  if (platformStr.includes('linux')) return 'linux';
  return 'server';
}

// Helper function to format platform name
function formatPlatform(platform) {
  if (!platform) return 'Unknown';
  
  const platformStr = platform.toLowerCase();
  if (platformStr.includes('win')) return 'Windows';
  if (platformStr.includes('mac') || platformStr.includes('darwin')) return 'macOS';
  if (platformStr.includes('linux')) return 'Linux';
  if (platformStr.includes('docker')) return 'Docker';
  return platform;
}

export default AgentStatus;