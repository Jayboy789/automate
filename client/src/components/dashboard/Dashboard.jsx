import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWorkflows, getAgents, getExecutions } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import AgentStatus from './AgentStatus';
import StatsCards from './StatsCards';
import ExecutionsList from './ExecutionsList';

const Dashboard = () => {
  const { on, connected } = useSocket();
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
  const [loadingTimeoutExceeded, setLoadingTimeoutExceeded] = useState(false);

  // Set a loading timeout
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("Dashboard loading timeout exceeded");
        setLoadingTimeoutExceeded(true);
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(loadingTimeout);
  }, [isLoading]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      // This flag tracks if at least one data source loaded successfully
      let dataSuccess = false;
      
      try {
        console.log("Dashboard: Fetching dashboard data...");
        
        // Try workflows first
        try {
          console.log("Fetching workflows...");
          const workflows = await getWorkflows();
          console.log("Workflows fetched:", workflows.length);
          setStats(prev => ({
            ...prev,
            workflowCount: workflows.length
          }));
          dataSuccess = true;
        } catch (workflowError) {
          console.error("Failed to load workflows:", workflowError);
        }
        
        // Try agents
        try {
          console.log("Fetching agents...");
          const agentsData = await getAgents();
          console.log("Agents fetched:", agentsData.length);
          setAgents(agentsData);
          setStats(prev => ({
            ...prev,
            agentCount: agentsData.length,
            onlineAgents: agentsData.filter(agent => agent.status === 'online').length
          }));
          dataSuccess = true;
        } catch (agentsError) {
          console.error("Failed to load agents:", agentsError);
        }
        
        // Try executions
        try {
          console.log("Fetching executions...");
          const executionsData = await getExecutions({ limit: 5 });
          console.log("Executions fetched:", executionsData.length);
          setRecentExecutions(executionsData);
          dataSuccess = true;
        } catch (executionsError) {
          console.error("Failed to load executions:", executionsError);
        }
        
        // If none of the data sources loaded, set error
        if (!dataSuccess) {
          console.error("No data sources loaded successfully");
          setError('Failed to load dashboard data. Please check your server connection.');
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
      return;
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
        } else {
          // If we receive an update for an execution not in our list,
          // refresh the executions list
          getExecutions({ limit: 5 })
            .then(executions => setRecentExecutions(executions))
            .catch(err => console.error("Error fetching executions after update:", err));
        }
        
        return updatedExecutions;
      });
    });
    
    // Return cleanup function
    return () => {
      console.log("Dashboard: Cleaning up socket listeners");
      if (unsubAgentStatus) unsubAgentStatus();
      if (unsubExecutionStatus) unsubExecutionStatus();
    };
  }, [on]);

  // Show socket connection status in error message if needed
  useEffect(() => {
    if (loadingTimeoutExceeded && !connected) {
      setError(prev => {
        if (prev) {
          return `${prev} Socket connection is not established.`;
        }
        return 'Socket connection is not established. Data updates may not be available.';
      });
    }
  }, [loadingTimeoutExceeded, connected]);

  // Handle retry button click
  const handleRetry = () => {
    window.location.reload();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading dashboard data...</div>
        {loadingTimeoutExceeded && (
          <div>
            <p>Loading is taking longer than expected. You can:</p>
            <button 
              className="btn btn-primary"
              onClick={handleRetry}
            >
              <i className="fas fa-sync"></i> Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          className="btn btn-primary"
          onClick={handleRetry}
        >
          <i className="fas fa-sync"></i> Retry
        </button>
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
          <i className="fas fa-plus"></i> New Workflow
        </Link>
        <Link to="/scripts/new" className="btn btn-secondary">
          <i className="fas fa-code"></i> New Script
        </Link>
      </div>
      
      {/* Connection Status */}
      {!connected && (
        <div className="alert alert-warning">
          <i className="fas fa-exclamation-triangle"></i>
          Socket connection is not established. Real-time updates unavailable.
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
        {agents.length > 0 ? (
          <AgentStatus agents={agents} />
        ) : (
          <div className="empty-state">
            <p>No agents found. <Link to="/agents">Add an agent</Link> to get started.</p>
          </div>
        )}
      </section>
      
      {/* Recent Executions */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Recent Executions</h2>
          <Link to="/executions" className="view-all">View All</Link>
        </div>
        {recentExecutions.length > 0 ? (
          <ExecutionsList executions={recentExecutions} />
        ) : (
          <div className="empty-state">
            <p>No executions found. Run a workflow to see results here.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;