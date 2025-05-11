import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAgent, getJobResults, regenerateAgentKey, deleteAgent } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const AgentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { on } = useSocket();
  
  // Agent state
  const [agent, setAgent] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [newAgentKey, setNewAgentKey] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [copySuccess, setCopySuccess] = useState('');
  
  // Load agent data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch agent and recent jobs
        const [agentData, jobsData] = await Promise.all([
          getAgent(id),
          getJobResults({ agentId: id, limit: 20 })
        ]);
        
        setAgent(agentData);
        setJobs(jobsData);
      } catch (err) {
        console.error('Error fetching agent data:', err);
        setError('Failed to load agent data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Socket events for real-time updates
  useEffect(() => {
    if (!agent) return;
    
    // Agent status updates
    const unsubAgentStatus = on('agent:status', (data) => {
      if (data.agentId === agent.agentId) {
        setAgent(prev => ({
          ...prev,
          status: data.status,
          lastSeen: data.lastSeen
        }));
      }
    });
    
    // Job status updates
    const unsubJobCompleted = on('job:completed', (data) => {
      if (data.agentId === agent.agentId) {
        // Refresh jobs list
        getJobResults({ agentId: id, limit: 20 })
          .then(jobsData => setJobs(jobsData))
          .catch(err => console.error('Error refreshing jobs:', err));
      }
    });
    
    return () => {
      unsubAgentStatus();
      unsubJobCompleted();
    };
  }, [agent, id, on]);
  
  // Regenerate agent key
  const handleRegenerateKey = async () => {
    if (!window.confirm('Are you sure you want to regenerate the agent key? The agent will need to be reconfigured with the new key.')) {
      return;
    }
    
    try {
      const result = await regenerateAgentKey(id);
      setNewAgentKey(result.agent.agentKey);
    } catch (err) {
      console.error('Error regenerating agent key:', err);
      alert('Failed to regenerate agent key. Please try again.');
    }
  };
  
  // Delete agent
  const handleDeleteAgent = async () => {
    if (!window.confirm('Are you sure you want to delete this agent?')) {
      return;
    }
    
    try {
      await deleteAgent(id);
      navigate('/agents');
    } catch (err) {
      console.error('Error deleting agent:', err);
      alert('Failed to delete agent. Please try again.');
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      },
      () => {
        setCopySuccess('Failed to copy!');
      }
    );
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
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
  
  // Render loading state
  if (loading) {
    return <div className="loading">Loading agent data...</div>;
  }
  
  // Render error state
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/agents')}
        >
          Back to Agents
        </button>
      </div>
    );
  }
  
  // Render not found state
  if (!agent) {
    return (
      <div className="not-found">
        <h2>Agent Not Found</h2>
        <p>The agent you are looking for does not exist or has been deleted.</p>
        <Link to="/agents" className="btn btn-primary">
          Back to Agents
        </Link>
      </div>
    );
  }
  
  return (
    <div className="agent-details">
      <div className="page-header">
        <div className="header-title">
          <h1>{agent.name}</h1>
          <span className={`status-badge status-${agent.status.toLowerCase()}`}>
            {agent.status}
          </span>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-danger"
            onClick={handleDeleteAgent}
          >
            <i className="fa fa-trash"></i> Delete Agent
          </button>
          
          <Link to="/agents" className="btn btn-secondary">
            <i className="fa fa-arrow-left"></i> Back to Agents
          </Link>
        </div>
      </div>
      
      {/* New Agent Key Alert */}
      {newAgentKey && (
        <div className="agent-key-alert">
          <div className="alert-header">
            <h3>New Agent Key Generated</h3>
            <button 
              className="close-btn"
              onClick={() => setNewAgentKey(null)}
            >
              &times;
            </button>
          </div>
          
          <div className="alert-content">
            <p>Your agent key has been regenerated. Please copy the new key - it will only be shown once!</p>
            
            <div className="key-container">
              <span className="agent-key">{newAgentKey}</span>
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard(newAgentKey)}
              >
                <i className="fa fa-copy"></i> Copy
              </button>
            </div>
            
            {copySuccess && <div className="copy-message">{copySuccess}</div>}
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Jobs
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="agent-info-grid">
              <div className="info-card">
                <h3>Agent Details</h3>
                <div className="info-item">
                  <span className="info-label">Agent ID:</span>
                  <span className="info-value">{agent.agentId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className={`status-text status-${agent.status.toLowerCase()}`}>
                    {agent.status}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Platform:</span>
                  <span className="info-value">{agent.platform}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Version:</span>
                  <span className="info-value">{agent.version || 'Unknown'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Created:</span>
                  <span className="info-value">{formatDate(agent.createdAt)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Seen:</span>
                  <span className="info-value" title={formatDate(agent.lastSeen)}>
                    {timeAgo(agent.lastSeen)}
                  </span>
                </div>
              </div>
              
              <div className="info-card">
                <h3>System Resources</h3>
                {agent.cpuUsage !== undefined ? (
                  <div className="resource-stats">
                    <div className="resource-item">
                      <div className="resource-header">
                        <span className="resource-label">CPU Usage</span>
                        <span className="resource-value">{Math.round(agent.cpuUsage)}%</span>
                      </div>
                      <div className="resource-bar">
                        <div 
                          className="resource-bar-fill" 
                          style={{ width: `${agent.cpuUsage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="resource-item">
                      <div className="resource-header">
                        <span className="resource-label">Memory Usage</span>
                        <span className="resource-value">{Math.round(agent.memoryUsage)}%</span>
                      </div>
                      <div className="resource-bar">
                        <div 
                          className="resource-bar-fill" 
                          style={{ width: `${agent.memoryUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-resource-data">
                    Resource data not available
                  </div>
                )}
              </div>
              
              <div className="info-card">
                <h3>Recent Activity</h3>
                {jobs.length > 0 ? (
                  <div className="recent-jobs">
                    {jobs.slice(0, 5).map(job => (
                      <div key={job._id} className="recent-job">
                        <div className="job-header">
                          <span className={`job-status job-status-${job.status.toLowerCase()}`}>
                            {job.status}
                          </span>
                          <span className="job-time">{timeAgo(job.createdAt)}</span>
                        </div>
                        <div className="job-script">
                          {job.script.length > 50 
                            ? `${job.script.substring(0, 50)}...` 
                            : job.script}
                        </div>
                      </div>
                    ))}
                    <div className="view-all">
                      <button 
                        className="btn btn-text"
                        onClick={() => setActiveTab('jobs')}
                      >
                        View all jobs
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-jobs">
                    No jobs executed on this agent yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="jobs-tab">
            <h3>Job History</h3>
            
            {jobs.length === 0 ? (
              <div className="empty-state">
                <p>No jobs have been executed on this agent yet.</p>
              </div>
            ) : (
              <div className="jobs-list">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Created</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Script</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => {
                      // Calculate duration
                      let duration = 'N/A';
                      if (job.completedAt && job.startedAt) {
                        const durationMs = new Date(job.completedAt) - new Date(job.startedAt);
                        const durationSecs = Math.round(durationMs / 1000);
                        duration = `${durationSecs} sec`;
                      }
                      
                      return (
                        <tr key={job._id}>
                          <td>{job._id}</td>
                          <td>{formatDate(job.createdAt)}</td>
                          <td>
                            <span className={`status-badge status-${job.status.toLowerCase()}`}>
                              {job.status}
                            </span>
                          </td>
                          <td>{duration}</td>
                          <td>
                            <div className="script-preview">
                              {job.script.length > 50 
                                ? `${job.script.substring(0, 50)}...` 
                                : job.script}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Link 
                                to={`/job/${job._id}`}
                                className="btn-icon"
                                title="View Details"
                              >
                                <i className="fa fa-info-circle"></i>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="settings-cards">
              <div className="settings-card">
                <h3>Agent Security</h3>
                <p>Agent keys are used for secure communication between the agent and server.</p>
                <button 
                  className="btn btn-primary"
                  onClick={handleRegenerateKey}
                >
                  <i className="fa fa-key"></i> Regenerate Agent Key
                </button>
                <div className="warning-note">
                  <strong>Note:</strong> Regenerating the key will require reconfiguring the agent with the new key.
                </div>
              </div>
              
              <div className="settings-card">
                <h3>Agent Deployment</h3>
                <p>Download the agent application for your platform:</p>
                <div className="download-buttons">
                  <a href="/downloads/automate-agent-windows.exe" className="btn btn-secondary">
                    <i className="fab fa-windows"></i> Windows
                  </a>
                  <a href="/downloads/automate-agent-macos.dmg" className="btn btn-secondary">
                    <i className="fab fa-apple"></i> macOS
                  </a>
                  <a href="/downloads/automate-agent-linux.AppImage" className="btn btn-secondary">
                    <i className="fab fa-linux"></i> Linux
                  </a>
                </div>
                <div className="help-note">
                  <a href="/docs/agent-setup" className="link">
                    <i className="fa fa-question-circle"></i> View agent setup instructions
                  </a>
                </div>
              </div>
              
              <div className="settings-card danger-zone">
                <h3>Danger Zone</h3>
                <p>Permanently delete this agent and all related data.</p>
                <button 
                  className="btn btn-danger"
                  onClick={handleDeleteAgent}
                >
                  <i className="fa fa-trash"></i> Delete Agent
                </button>
                <div className="warning-note">
                  <strong>Warning:</strong> This action cannot be undone.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDetails;