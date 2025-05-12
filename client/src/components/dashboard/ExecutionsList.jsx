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
  if (!executions || executions.length === 0) {
    return (
      <div className="empty-state">
        <i className="fa fa-history empty-icon"></i>
        <h2>No Executions Yet</h2>
        <p>Run a workflow to see the execution history here.</p>
        <Link to="/workflows" className="btn btn-primary">
          Go to Workflows
        </Link>
      </div>
    );
  }

  return (
    <div className="executions-list" style={{ padding: '0 20px 20px' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '500' }}>
                    {execution.workflowName || 'Unknown Workflow'}
                  </span>
                  {execution.clientName && (
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Client: {execution.clientName}
                    </span>
                  )}
                </div>
              </td>
              <td>{formatTime(execution.startedAt)}</td>
              <td>{formatDuration(execution.duration)}</td>
              <td>
                <span className={`status-badge status-${execution.status?.toLowerCase() || 'pending'}`}>
                  {execution.status || 'Pending'}
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