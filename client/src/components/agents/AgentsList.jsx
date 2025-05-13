import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAgents, createAgent, deleteAgent, regenerateAgentKey } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const AgentsList = () => {
  const { on } = useSocket();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [newAgent, setNewAgent] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  
  // Load agents
  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getAgents();
        setAgents(data);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to load agents. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAgents();
  }, []);
  
  // Socket events for real-time updates
  useEffect(() => {
    // Listen for agent status updates
    const unsubscribe = on('agent:status', (data) => {
      if (!data || !data.agentId) return;
      
      setAgents(prev => {
        return prev.map(agent => {
          if (agent.agentId === data.agentId) {
            return {
              ...agent,
              status: data.status,
              lastSeen: data.lastSeen
            };
          }
          return agent;
        });
      });
    });
    
    return unsubscribe;
  }, [on]);
  
  // Create agent
  const handleCreateAgent = async () => {
    setCreatingAgent(true);
    setError(null);
    
    try {
      const result = await createAgent();
      
      // Validate the result structure before using it
      if (!result || !result.agent || !result.agent.agentId) {
        throw new Error('Invalid response from server. Missing agent data.');
      }
      
      // Add to list
      setAgents(prevAgents => [result.agent, ...prevAgents]);
      
      // Store for display
      setNewAgent({
        agentId: result.agent.agentId,
        agentKey: result.agent.agentKey,
        name: result.agent.name || `Agent-${result.agent.agentId.substring(0, 8)}`
      });
    } catch (err) {
      console.error('Error creating agent:', err);
      setError('Failed to create agent. Please try again.');
    } finally {
      setCreatingAgent(false);
    }
  };
  
  // Delete agent
  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) {
      return;
    }
    
    try {
      await deleteAgent(agentId);
      
      // Remove from list
      setAgents(agents.filter(agent => agent.agentId !== agentId));
    } catch (err) {
      console.error('Error deleting agent:', err);
      alert('Failed to delete agent. Please try again.');
    }
  };
  
  // Regenerate agent key
  const handleRegenerateKey = async (agentId) => {
    if (!window.confirm('Are you sure you want to regenerate the agent key? The agent will need to be reconfigured with the new key.')) {
      return;
    }
    
    try {
      const result = await regenerateAgentKey(agentId);
      
      // Store for display
      setNewAgent({
        agentId: result.agent.agentId,
        agentKey: result.agent.agentKey,
        name: agents.find(a => a.agentId === agentId)?.name || 'Agent'
      });
    } catch (err) {
      console.error('Error regenerating agent key:', err);
      alert('Failed to regenerate agent key. Please try again.');
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
  
  // Render loading state
  if (loading) {
    return <div className="loading">Loading agents...</div>;
  }

  return (
    <div className="agents-page">
      <div className="page-header">
        <h1>Agents</h1>
        <button 
          className="btn btn-primary" 
          onClick={handleCreateAgent}
          disabled={creatingAgent}
        >
          <i className="fa fa-plus"></i> New Agent
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {/* New Agent Info */}
      {newAgent && (
        <div className="new-agent-box">
          <div className="new-agent-header">
            <h3>New Agent Created</h3>
            <button 
              className="close-btn"
              onClick={() => setNewAgent(null)}
            >
              &times;
            </button>
          </div>
          
          <div className="new-agent-content">
            <p>Your new agent has been created. Please copy the agent ID and key - the key will only be shown once!</p>
            
            <div className="agent-credentials">
              <div className="credential-item">
                <div className="credential-label">Agent Name:</div>
                <div className="credential-value">{newAgent.name}</div>
              </div>
              
              <div className="credential-item">
                <div className="credential-label">Agent ID:</div>
                <div className="credential-value">
                  {newAgent.agentId}
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(newAgent.agentId)}
                  >
                    <i className="fa fa-copy"></i>
                  </button>
                </div>
              </div>
              
              <div className="credential-item">
                <div className="credential-label">Agent Key:</div>
                <div className="credential-value">
                  {newAgent.agentKey}
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(newAgent.agentKey)}
                  >
                    <i className="fa fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
            
            {copySuccess && <div className="copy-message">{copySuccess}</div>}
            
            <div className="agent-download">
              <p>Download the agent application:</p>
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
            </div>
          </div>
        </div>
      )}
      
      {agents.length === 0 ? (
        <div className="empty-state">
          <i className="fa fa-robot empty-icon"></i>
          <h2>No agents yet</h2>
          <p>Create your first agent to get started</p>
          <button 
            className="btn btn-primary"
            onClick={handleCreateAgent}
            disabled={creatingAgent}
          >
            Create Agent
          </button>
        </div>
      ) : (
        <div className="agents-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th>Resource Usage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.agentId}>
                  <td>
                    <Link to={`/agents/${agent.agentId}`} className="agent-name">
                      {agent.name}
                    </Link>
                    <div className="agent-id">
                      ID: {agent.agentId}
                    </div>
                  </td>
                  <td>
                    <div className="platform-info">
                      <i className={`fab fa-${agent.platform === 'windows' ? 'windows' : agent.platform === 'darwin' ? 'apple' : agent.platform === 'linux' ? 'linux' : 'server'}`}></i>
                      <span>{agent.platform}</span>
                      {agent.version && <span className="version">v{agent.version}</span>}
                    </div>
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
                    {agent.cpuUsage !== undefined && (
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
                          <span className="usage-label">Memory:</span>
                          <div className="usage-bar">
                            <div 
                              className="usage-bar-fill" 
                              style={{ width: `${agent.memoryUsage}%` }}
                            ></div>
                          </div>
                          <span className="usage-value">{Math.round(agent.memoryUsage)}%</span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/agents/${agent.agentId}`}
                        className="btn-icon"
                        title="View Details"
                      >
                        <i className="fa fa-info-circle"></i>
                      </Link>
                      
                      <button 
                        className="btn-icon"
                        title="Regenerate Key"
                        onClick={() => handleRegenerateKey(agent.agentId)}
                      >
                        <i className="fa fa-key"></i>
                      </button>
                      
                      <button 
                        className="btn-icon btn-icon-danger"
                        title="Delete Agent"
                        onClick={() => handleDeleteAgent(agent.agentId)}
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AgentsList;