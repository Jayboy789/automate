import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

const HttpNode = memo(({ data, isConnectable, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleNodeDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Check if URL is valid
  const isValid = data.url && data.url.trim().length > 0;
  
  return (
    <div 
      className={`node custom-node http-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${!isValid ? 'invalid' : ''}`}
      onDoubleClick={handleNodeDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-globe"></i>
          <span>{data.label || 'HTTP Request'}</span>
          
          <div className="node-actions">
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // HTTP request configuration action
              }}
              title="Edit Request"
            >
              <i className="fa fa-pencil"></i>
            </button>
            
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Test HTTP request action
              }}
              title="Test Request"
            >
              <i className="fa fa-play"></i>
            </button>
          </div>
        </div>
        
        <div className="node-body">
          <div className="node-info method">
            {data.method || 'GET'}
          </div>
          
          <div className="node-info url">
            {data.url 
              ? (data.url.length > 25 ? `${data.url.substring(0, 25)}...` : data.url)
              : 'No URL specified'}
          </div>
          
          {isExpanded && (
            <div className="http-details">
              {data.headers && Object.keys(data.headers).length > 0 && (
                <div className="http-headers">
                  <div className="details-label">Headers:</div>
                  <div className="details-value">
                    {Object.keys(data.headers).map(key => (
                      <div key={key} className="header-item">
                        {key}: {data.headers[key]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {data.responseVariable && (
                <div className="response-variable">
                  <div className="details-label">Store response in:</div>
                  <div className="details-value">{data.responseVariable}</div>
                </div>
              )}
            </div>
          )}
          
          {!isValid && (
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i> Missing URL
            </div>
          )}
          
          {data.executionStatus && (
            <div className={`execution-status ${data.executionStatus}`}>
              {data.executionStatus === 'running' && <i className="fa fa-spinner fa-spin"></i>}
              {data.executionStatus === 'completed' && <i className="fa fa-check"></i>}
              {data.executionStatus === 'failed' && <i className="fa fa-times"></i>}
              <span>{data.executionStatus}</span>
              {data.statusCode && (
                <span className="http-status">{data.statusCode}</span>
              )}
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

export default HttpNode;