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
        <p>No agents have been created yet.</p>
        <Link to="/agents" className="btn btn-primary">
          Create Agent
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
            <tr key={agent.agentId}>
              <td>
                <Link to={`/agents/${agent.agentId}`}>
                  {agent.name}
                </Link>
              </td>
              <td>
                {agent.platform}
                {agent.version && ` (${agent.version})`}
              </td>
              <td>
                <span className={`status-badge status-${agent.status.toLowerCase()}`}>
                  {agent.status}
                </span>
              </td>
              <td title={formatTime(agent.lastSeen)}>
                {timeAgo(agent.lastSeen)}
              </td>
              <td>
                {agent.cpuUsage && (
                  <div className="resource-usage">
                    <div className="cpu-usage">
                      CPU: {agent.cpuUsage.toFixed(1)}%
                    </div>
                    <div className="memory-usage">
                      Memory: {agent.memoryUsage.toFixed(1)}%
                    </div>
                  </div>
                )}
              </td>
              <td>
                <div className="table-actions">
                  <Link to={`/agents/${agent.agentId}`} className="btn-table">
                    <i className="fa fa-info-circle"></i>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgentStatus;