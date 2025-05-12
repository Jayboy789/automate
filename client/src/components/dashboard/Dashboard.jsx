import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWorkflows, getAgents, getExecutions, getScripts } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import AgentStatus from './AgentStatus';
import StatsCards from './StatsCards';
import ExecutionsList from './ExecutionsList';
import '../../styles/dashboard.css';

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

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      console.log("Dashboard: Loading data...");
      
      try {
        // Load data in parallel for better performance
        const [workflows, agentsData, executionsData, scripts] = await Promise.all([
          getWorkflows(),
          getAgents(),
          getExecutions({ limit: 5 }),
          getScripts()
        ]);
        
        console.log("Data loaded:", {
          workflows: workflows?.length || 0,
          agents: agentsData?.length || 0,
          executions: executionsData?.length || 0,
          scripts: scripts?.length || 0
        });
        
        // Set state with fetched data
        setStats({
          workflowCount: workflows?.length || 0,
          scriptCount: scripts?.length || 0,
          agentCount: agentsData?.length || 0,
          onlineAgents: agentsData?.filter(agent => agent.status === 'online').length || 0
        });
        
        setAgents(agentsData || []);
        setRecentExecutions(executionsData || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Could not load all dashboard data. Check server connection.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Socket events for real-time updates
  useEffect(() => {
    if (!on) return;
    
    // Agent status updates
    const unsubAgentStatus = on('agent:status', data => {
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
    
    return () => {
      if (unsubAgentStatus) unsubAgentStatus();
      if (unsubExecutionStatus) unsubExecutionStatus();
    };
  }, [on]);

  // Handle page refresh
  const handleRefresh = () => {
    window.location.reload();
  };
  
  // Handle socket reconnect
  const handleReconnectSocket = () => {
    reconnect();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <i className="fa fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
          Loading dashboard data...
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <div className="error-message">
            <i className="fa fa-exclamation-triangle" style={{ marginRight: '10px' }}></i>
            {error}
          </div>
          <div className="error-actions">
            <button 
              className="btn btn-primary"
              onClick={handleRefresh}
            >
              <i className="fa fa-refresh"></i> Refresh Page
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleReconnectSocket}
            >
              <i className="fa fa-plug"></i> Reconnect Socket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>
      
      {/* Connection Status */}
      {!connected && (
        <div className="alert alert-warning">
          <i className="fa fa-exclamation-triangle"></i>
          Socket connection is not established. Real-time updates unavailable.
          <button 
            className="btn btn-sm btn-secondary ml-2"
            onClick={handleReconnectSocket}
          >
            Reconnect
          </button>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/workflows/new" className="btn btn-primary">
          <i className="fa fa-plus"></i> New Workflow
        </Link>
        <Link to="/scripts/new" className="btn btn-secondary">
          <i className="fa fa-code"></i> New Script
        </Link>
        <Link to="/agents" className="btn btn-secondary">
          <i className="fa fa-robot"></i> Manage Agents
        </Link>
      </div>
      
      {/* Stats Cards */}
      <StatsCards stats={stats} />
      
      {/* Agents Status */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2><i className="fa fa-robot"></i> Agent Status</h2>
          <Link to="/agents" className="view-all">View All <i className="fa fa-arrow-right"></i></Link>
        </div>
        <AgentStatus agents={agents} />
      </section>
      
      {/* Recent Executions */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2><i className="fa fa-history"></i> Recent Executions</h2>
          <Link to="/executions" className="view-all">View All <i className="fa fa-arrow-right"></i></Link>
        </div>
        <ExecutionsList executions={recentExecutions} />
      </section>
    </div>
  );
};

export default Dashboard;