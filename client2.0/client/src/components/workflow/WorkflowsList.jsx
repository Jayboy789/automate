import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getWorkflows, executeWorkflow, deleteWorkflow, cloneWorkflow } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const WorkflowsList = () => {
  const navigate = useNavigate();
  const { on } = useSocket();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [executingId, setExecutingId] = useState(null);
  
  // Load workflows
  useEffect(() => {
    const fetchWorkflows = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getWorkflows();
        setWorkflows(data);
      } catch (err) {
        console.error('Error fetching workflows:', err);
        setError('Failed to load workflows. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkflows();
  }, []);
  
  // Socket events for real-time updates
  useEffect(() => {
    // Listen for workflow execution status updates
    const unsubscribe = on('execution:status', (data) => {
      // You could add more sophisticated handling here
      // For now we'll just clear the executing state
      if (data && executingId) {
        setExecutingId(null);
      }
    });
    
    return unsubscribe;
  }, [on, executingId]);
  
  // Execute workflow
  const handleExecute = async (id) => {
    setExecutingId(id);
    
    try {
      const result = await executeWorkflow(id);
      
      // Navigate to execution details
      navigate(`/executions/${result.execution.id}`);
    } catch (err) {
      console.error('Error executing workflow:', err);
      alert('Failed to execute workflow. Please try again.');
    } finally {
      setExecutingId(null);
    }
  };
  
  // Delete workflow
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) {
      return;
    }
    
    try {
      await deleteWorkflow(id);
      
      // Remove from list
      setWorkflows(workflows.filter(workflow => workflow._id !== id));
    } catch (err) {
      console.error('Error deleting workflow:', err);
      alert('Failed to delete workflow. Please try again.');
    }
  };
  
  // Clone workflow
  const handleClone = async (id) => {
    try {
      const result = await cloneWorkflow(id);
      
      // Add to list
      setWorkflows([result, ...workflows]);
    } catch (err) {
      console.error('Error cloning workflow:', err);
      alert('Failed to clone workflow. Please try again.');
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Render loading state
  if (loading) {
    return <div className="loading">Loading workflows...</div>;
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
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="workflows-page">
      <div className="page-header">
        <h1>Workflows</h1>
        <Link to="/workflows/new" className="btn btn-primary">
          <i className="fa fa-plus"></i> New Workflow
        </Link>
      </div>
      
      {workflows.length === 0 ? (
        <div className="empty-state">
          <i className="fa fa-project-diagram empty-icon"></i>
          <h2>No workflows yet</h2>
          <p>Create your first workflow to get started</p>
          <Link to="/workflows/new" className="btn btn-primary">
            Create Workflow
          </Link>
        </div>
      ) : (
        <div className="workflows-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Client</th>
                <th>Created By</th>
                <th>Last Modified</th>
                <th>Last Executed</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow) => (
                <tr key={workflow._id}>
                  <td>
                    <Link to={`/workflows/${workflow._id}`} className="workflow-name">
                      {workflow.name || 'Untitled Workflow'}
                    </Link>
                    {workflow.description && (
                      <div className="workflow-description">
                        {workflow.description.length > 50 
                          ? `${workflow.description.substring(0, 50)}...` 
                          : workflow.description}
                      </div>
                    )}
                  </td>
                  <td>
                    {workflow.clientId ? (
                      <span className="client-badge">
                        {workflow.clientId.name || 'Unknown Client'}
                      </span>
                    ) : (
                      <span className="no-client">No Client</span>
                    )}
                  </td>
                  <td>{workflow.createdBy?.name || 'Unknown'}</td>
                  <td>{formatDate(workflow.updatedAt)}</td>
                  <td>{formatDate(workflow.lastExecuted)}</td>
                  <td>
                    <span className={`status-badge ${workflow.isActive ? 'status-online' : 'status-offline'}`}>
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/workflows/${workflow._id}`}
                        className="btn-icon"
                        title="Edit"
                      >
                        <i className="fa fa-edit"></i>
                      </Link>
                      
                      <button 
                        className="btn-icon"
                        title="Execute"
                        onClick={() => handleExecute(workflow._id)}
                        disabled={executingId === workflow._id}
                      >
                        {executingId === workflow._id ? (
                          <i className="fa fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fa fa-play"></i>
                        )}
                      </button>
                      
                      <button 
                        className="btn-icon"
                        title="Clone"
                        onClick={() => handleClone(workflow._id)}
                      >
                        <i className="fa fa-copy"></i>
                      </button>
                      
                      <button 
                        className="btn-icon btn-icon-danger"
                        title="Delete"
                        onClick={() => handleDelete(workflow._id)}
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

export default WorkflowsList;