import React from 'react';
import { Link } from 'react-router-dom';

const ExecutionsList = ({ executions }) => {
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    
    if (seconds < 60) {
      return `${seconds.toFixed(1)} sec`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  // If no executions, display message
  if (executions.length === 0) {
    return (
      <div className="empty-state">
        <p>No workflow executions yet.</p>
        <Link to="/workflows" className="btn btn-primary">
          Execute a Workflow
        </Link>
      </div>
    );
  }

  return (
    <div className="executions-list">
      <table className="data-table">
        <thead>
          <tr>
            <th>Workflow</th>
            <th>Started</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {executions.map((execution) => (
            <tr key={execution._id}>
              <td>
                <div className="workflow-info">
                  <span className="workflow-name">
                    {execution.workflowName || 'Unknown Workflow'}
                  </span>
                  {execution.clientName && (
                    <span className="client-name">
                      {execution.clientName}
                    </span>
                  )}
                </div>
              </td>
              <td>{formatTime(execution.startedAt)}</td>
              <td>{formatDuration(execution.duration)}</td>
              <td>
                <span className={`status-badge status-${execution.status.toLowerCase()}`}>
                  {execution.status}
                </span>
              </td>
              <td>
                <div className="table-actions">
                  <Link 
                    to={`/executions/${execution._id}`} 
                    className="btn-table"
                    title="View Details"
                  >
                    <i className="fa fa-info-circle"></i>
                  </Link>
                  
                  {execution.status === 'completed' && (
                    <Link 
                      to={`/executions/${execution._id}/rerun`}
                      className="btn-table"
                      title="Rerun Workflow"
                    >
                      <i className="fa fa-redo"></i>
                    </Link>
                  )}
                  
                  {(execution.status === 'running' || execution.status === 'pending') && (
                    <button 
                      className="btn-table btn-danger"
                      title="Cancel Execution"
                    >
                      <i className="fa fa-times"></i>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExecutionsList;