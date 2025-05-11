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
        // Fetch data in parallel
        const [workflows, agents, executions] = await Promise.all([
          getWorkflows(),
          getAgents(),
          getExecutions({ limit: 5 })
        ]);
        
        // Set agents
        setAgents(agents);
        
        // Set recent executions
        setRecentExecutions(executions);
        
        // Calculate stats
        setStats({
          workflowCount: workflows.length,
          scriptCount: 0, // TODO: Fetch script count
          agentCount: agents.length,
          onlineAgents: agents.filter(agent => agent.status === 'online').length
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Socket events for real-time updates
  useEffect(() => {
    // Agent status updates
    const unsubAgentStatus = on('agent:status', data => {
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
      unsubAgentStatus();
      unsubExecutionStatus();
    };
  }, [on]);

  // Render loading state
  if (isLoading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  // Render error state
  if (error) {
    return <div className="error-message">{error}</div>;
  }

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