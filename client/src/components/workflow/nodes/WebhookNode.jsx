import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

const WebhookNode = memo(({ data, isConnectable, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleNodeDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Check if path is configured
  const isValid = data.path && data.path.trim().length > 0;
  
  // Format webhook URL
  const getWebhookUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/webhooks/${data.path || '[path]'}`;
  };
  
  return (
    <div 
      className={`node custom-node webhook-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${!isValid ? 'invalid' : ''}`}
      onDoubleClick={handleNodeDoubleClick}
    >
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-bolt"></i>
          <span>{data.label || 'Webhook'}</span>
          
          <div className="node-actions">
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Webhook configuration action
              }}
              title="Edit Webhook"
            >
              <i className="fa fa-pencil"></i>
            </button>
            
            {isValid && (
              <button 
                className="node-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  // Copy webhook URL action
                  navigator.clipboard.writeText(getWebhookUrl());
                }}
                title="Copy Webhook URL"
              >
                <i className="fa fa-copy"></i>
              </button>
            )}
          </div>
        </div>
        
        <div className="node-body">
          <div className="node-info">
            {data.path ? (
              <span className="webhook-path">{getWebhookUrl()}</span>
            ) : (
              <span className="empty-path">No path configured</span>
            )}
          </div>
          
          {isExpanded && data.description && (
            <div className="node-description">
              {data.description}
            </div>
          )}
          
          {isExpanded && data.dataVariable && (
            <div className="webhook-variable">
              <div className="details-label">Store data in:</div>
              <div className="details-value">{data.dataVariable}</div>
            </div>
          )}
          
          {!isValid && (
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i> Missing webhook path
            </div>
          )}
          
          {data.executionStatus && (
            <div className={`execution-status ${data.executionStatus}`}>
              {data.executionStatus === 'running' && <i className="fa fa-spinner fa-spin"></i>}
              {data.executionStatus === 'completed' && <i className="fa fa-check"></i>}
              {data.executionStatus === 'failed' && <i className="fa fa-times"></i>}
              <span>{data.executionStatus}</span>
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="main"
        style={{ background: '#10b981' }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default WebhookNode;