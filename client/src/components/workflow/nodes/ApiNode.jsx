// client/src/components/workflow/nodes/ApiNode.jsx
import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

const ApiNode = memo(({ data, isConnectable, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleNodeDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Get a display name for the API based on configuration
  const getApiDisplayName = () => {
    if (data.apiName) return data.apiName;
    if (data.endpoint) {
      const url = new URL(data.endpoint);
      return url.hostname;
    }
    return 'API Connection';
  };
  
  // Determine if the node is properly configured
  const isEndpointValid = data.endpoint && data.endpoint.startsWith('http');
  const isMethodValid = data.method && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(data.method);
  const isOutputValid = data.responseVariable && data.responseVariable.trim() !== '';
  
  const isValid = isEndpointValid && isMethodValid && isOutputValid;
  
  // Format headers for display
  const formatHeaders = () => {
    if (!data.headers) return null;
    
    try {
      const headers = typeof data.headers === 'string' 
        ? JSON.parse(data.headers) 
        : data.headers;
      
      return Object.entries(headers).map(([key, value]) => (
        <div key={key} className="header-item">
          <strong>{key}:</strong> {value}
        </div>
      ));
    } catch (error) {
      return <div className="header-item error">Invalid headers format</div>;
    }
  };
  
  return (
    <div 
      className={`node custom-node api-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${!isValid ? 'invalid' : ''}`}
      onDoubleClick={handleNodeDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-plug"></i>
          <span>{data.label || 'API Call'}</span>
          
          <div className="node-actions">
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // API configuration action
              }}
              title="Edit Configuration"
            >
              <i className="fa fa-pencil"></i>
            </button>
            
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Test API action
              }}
              title="Test API Call"
            >
              <i className="fa fa-play"></i>
            </button>
          </div>
        </div>
        
        <div className="node-body">
          <div className="node-info">
            <span className="api-name">{getApiDisplayName()}</span>
          </div>
          
          <div className="node-info">
            {isMethodValid && (
              <span className={`method-badge method-${data.method}`}>
                {data.method}
              </span>
            )}
            {isEndpointValid && (
              <span className="endpoint-url">
                {data.endpoint.length > 30 
                  ? `${data.endpoint.substring(0, 30)}...` 
                  : data.endpoint}
              </span>
            )}
          </div>
          
          {isExpanded && (
            <div className="api-details">
              {data.description && (
                <div className="api-description">
                  {data.description}
                </div>
              )}
              
              {data.headers && (
                <div className="headers-section">
                  <div className="section-title">Headers:</div>
                  <div className="headers-list">
                    {formatHeaders()}
                  </div>
                </div>
              )}
              
              {data.bodyType && data.body && (
                <div className="body-section">
                  <div className="section-title">Body ({data.bodyType}):</div>
                  <div className="body-preview">
                    {typeof data.body === 'object' 
                      ? JSON.stringify(data.body).substring(0, 100) + (JSON.stringify(data.body).length > 100 ? '...' : '')
                      : (data.body.substring(0, 100) + (data.body.length > 100 ? '...' : ''))}
                  </div>
                </div>
              )}
              
              {data.authentication && (
                <div className="auth-section">
                  <div className="section-title">Authentication:</div>
                  <div className="auth-type">
                    {data.authentication.type || 'None'} 
                    {data.authentication.type === 'bearer' && ' Token'}
                    {data.authentication.type === 'basic' && ' Auth'}
                    {data.authentication.type === 'apiKey' && (
                      <span> ({data.authentication.location || 'header'}: {data.authentication.name || 'apiKey'})</span>
                    )}
                  </div>
                </div>
              )}
              
              {data.responseVariable && (
                <div className="response-section">
                  <div className="section-title">Response stored in:</div>
                  <div className="variable-reference">{data.responseVariable}</div>
                </div>
              )}
            </div>
          )}
          
          {!isValid && (
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i> Incomplete configuration
            </div>
          )}
          
          {data.executionStatus && (
            <div className={`execution-status ${data.executionStatus}`}>
              {data.executionStatus === 'running' && <i className="fa fa-spinner fa-spin"></i>}
              {data.executionStatus === 'completed' && (
                <>
                  <i className="fa fa-check"></i>
                  <span>Completed</span>
                  {data.statusCode && (
                    <span className="status-code">{data.statusCode}</span>
                  )}
                </>
              )}
              {data.executionStatus === 'failed' && <i className="fa fa-times"></i>}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        style={{ background: '#10b981' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="error"
        style={{ top: '50%', background: '#ef4444' }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default ApiNode;