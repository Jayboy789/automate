import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWorkflows, getAgents, getExecutions } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import AgentStatus from './AgentStatus';
import StatsCards from './StatsCards';
import ExecutionsList from './ExecutionsList';

const Dashboard = () => {
  const { on } = useSocket();
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
      
      try {
        console.log("Dashboard: Fetching dashboard data...");
        
        // Use Promise.allSettled to continue even if some requests fail
        const results = await Promise.allSettled([
          getWorkflows(),
          getAgents(),
          getExecutions({ limit: 5 })
        ]);
        
        console.log("Dashboard: Data fetch results:", results);
        
        // Process workflows
        if (results[0].status === 'fulfilled') {
          const workflows = results[0].value;
          setStats(prev => ({
            ...prev,
            workflowCount: workflows.length
          }));
        } else {
          console.error("Failed to load workflows:", results[0].reason);
        }
        
        // Process agents
        if (results[1].status === 'fulfilled') {
          const agentsData = results[1].value;
          setAgents(agentsData);
          setStats(prev => ({
            ...prev,
            agentCount: agentsData.length,
            onlineAgents: agentsData.filter(agent => agent.status === 'online').length
          }));
        } else {
          console.error("Failed to load agents:", results[1].reason);
        }
        
        // Process executions
        if (results[2].status === 'fulfilled') {
          const executionsData = results[2].value;
          setRecentExecutions(executionsData);
        } else {
          console.error("Failed to load executions:", results[2].reason);
        }
        
        // If all requests failed, set error
        if (results.every(result => result.status === 'rejected')) {
          setError('Failed to load dashboard data. Check your server connection.');
        }
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Socket events for real-time updates
  useEffect(() => {
    // Only set up listeners if socket is available
    if (!on) {
      console.log("Dashboard: Socket not available");
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
        setStats(prevStats => ({
          ...prevStats,
          onlineAgents: updatedAgents.filter(a => a.status === 'online').length
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
    
    return () => {
      if (unsubAgentStatus) unsubAgentStatus();
      if (unsubExecutionStatus) unsubExecutionStatus();
    };
  }, [on]);

  // Render loading state
  if (isLoading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  // Render error state
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          <i className="fas fa-sync"></i> Retry
        </button>
      </div>
    );
  }

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