import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWorkflows, getAgents, getExecutions } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import AgentStatus from './AgentStatus';
import StatsCards from './StatsCards';
import ExecutionsList from './ExecutionsList';

const Dashboard = () => {
  const { on, connected, reconnect } = useSocket();
  const [stats, setStats] = useState({
    workflowCount: 0,
    scriptCount: 0,
    agentCount: 0,
    onlineAgents: 0
  });
  const [agents, setAgents] = useState([]);
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiResponses, setApiResponses] = useState({
    workflows: false,
    agents: false,
    executions: false
  });

  // Socket diagnostics
  useEffect(() => {
    console.log("Socket connection status:", connected ? "Connected" : "Disconnected");
    console.log("Server URL:", process.env.REACT_APP_API_URL || 'http://localhost:5000');
  }, [connected]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Track successful API calls
      const responses = {
        workflows: false,
        agents: false,
        executions: false
      };
      
      try {
        console.log("Dashboard: Fetching dashboard data...");
        
        // Attempt to fetch workflows
        try {
          console.log("Fetching workflows...");
          const workflows = await getWorkflows();
          console.log("Workflows fetched:", workflows?.length || 0);
          setStats(prev => ({
            ...prev,
            workflowCount: workflows?.length || 0
          }));
          responses.workflows = true;
        } catch (workflowError) {
          console.error("Failed to load workflows:", workflowError);
        }
        
        // Attempt to fetch agents
        try {
          console.log("Fetching agents...");
          const agentsData = await getAgents();
          console.log("Agents fetched:", agentsData?.length || 0);
          setAgents(agentsData || []);
          setStats(prev => ({
            ...prev,
            agentCount: agentsData?.length || 0,
            onlineAgents: agentsData?.filter(agent => agent.status === 'online')?.length || 0
          }));
          responses.agents = true;
        } catch (agentsError) {
          console.error("Failed to load agents:", agentsError);
        }
        
        // Attempt to fetch executions
        try {
          console.log("Fetching executions...");
          const executionsData = await getExecutions({ limit: 5 });
          console.log("Executions fetched:", executionsData?.length || 0);
          setRecentExecutions(executionsData || []);
          responses.executions = true;
        } catch (executionsError) {
          console.error("Failed to load executions:", executionsError);
        }
        
        // Update API response tracking
        setApiResponses(responses);
        
        // Check if any API calls failed
        if (!responses.workflows && !responses.agents && !responses.executions) {
          setError('Could not load any dashboard data. Check server connection.');
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please check your server connection.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Socket events for real-time updates
  useEffect(() => {
    if (!on) {
      console.log("Dashboard: Socket 'on' function not available");
      return () => {};
    }
    
    console.log("Dashboard: Setting up socket listeners");
    
    // Agent status updates
    const unsubAgentStatus = on('agent:status', data => {
      console.log("Dashboard: Agent status update", data);
      if (!data) return;
      
      setAgents(prevAgents => {
        const updatedAgents = [...prevAgents];
        const index = updatedAgents.findIndex(a => a.agentId === data.agentId);
        
        if (index !== -1) {
          updatedAgents[index] = { 
            ...updatedAgents[index], 
            status: data.status,
            lastSeen: data.lastSeen
          };
        }
        
        // Update online agents count
        const onlineCount = updatedAgents.filter(a => a.status === 'online').length;
        setStats(prevStats => ({
          ...prevStats,
          onlineAgents: onlineCount
        }));
        
        return updatedAgents;
      });
    });
    
    // Execution status updates
    const unsubExecutionStatus = on('execution:status', data => {
      console.log("Dashboard: Execution status update", data);
      if (!data) return;
      
      setRecentExecutions(prevExecutions => {
        const updatedExecutions = [...prevExecutions];
        const index = updatedExecutions.findIndex(e => e._id === data.id);
        
        if (index !== -1) {
          updatedExecutions[index] = { 
            ...updatedExecutions[index], 
            status: data.status,
            completedAt: data.completedAt
          };
        }
        
        return updatedExecutions;
      });
    });
    
    // Return cleanup function
    return () => {
      console.log("Dashboard: Cleaning up socket listeners");
      unsubAgentStatus && unsubAgentStatus();
      unsubExecutionStatus && unsubExecutionStatus();
    };
  }, [on]);

  // Handle retry button click
  const handleRetry = () => {
    window.location.reload();
  };

  // Force socket reconnection
  const handleReconnectSocket = () => {
    if (reconnect) {
      reconnect();
    } else {
      window.location.reload();
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  // Render error state - only if we couldn't get any data
  if (error && !apiResponses.workflows && !apiResponses.agents && !apiResponses.executions) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <div className="error-actions">
          <button 
            className="btn btn-primary"
            onClick={handleRetry}
            style={{ marginRight: '10px' }}
          >
            <i className="fa fa-sync"></i> Refresh Page
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleReconnectSocket}
          >
            <i className="fa fa-plug"></i> Reconnect Socket
          </button>
        </div>
      </div>
    );
  }

  // Render dashboard with data
  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>
      
      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/workflows/new" className="btn btn-primary">
          <i className="fa fa-plus"></i> New Workflow
        </Link>
        <Link to="/scripts/new" className="btn btn-secondary">
          <i className="fa fa-code"></i> New Script
        </Link>
      </div>
      
      {/* Connection Status */}
      {!connected && (
        <div className="alert alert-warning">
          <i className="fa fa-exclamation-triangle"></i>
          Socket connection is not established. Real-time updates unavailable.
          <button 
            className="btn btn-sm btn-outline-secondary ml-2"
            onClick={handleReconnectSocket}
            style={{ marginLeft: '10px' }}
          >
            <i className="fa fa-sync"></i> Reconnect
          </button>
        </div>
      )}
      
      {/* Stats Cards */}
      <StatsCards stats={stats} />
      
      {/* Agents Status */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Agent Status</h2>
          <Link to="/agents" className="view-all">View All</Link>
        </div>
        <AgentStatus agents={agents} />
      </section>
      
      {/* Recent Executions */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Recent Executions</h2>
          <Link to="/executions" className="view-all">View All</Link>
        </div>
        <ExecutionsList executions={recentExecutions} />
      </section>
    </div>
  );
};

export default Dashboard;