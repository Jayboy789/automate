import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

const VariableNode = memo(({ data, isConnectable, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleNodeDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Check if variable has name
  const isValid = data.name && data.name.trim().length > 0;
  
  // Format variable value for display
  const formatValue = (value) => {
    if (value === undefined || value === null) {
      return '<not set>';
    }
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).substring(0, 30) + (JSON.stringify(value).length > 30 ? '...' : '');
      } catch (e) {
        return 'Complex object';
      }
    }
    
    return String(value).substring(0, 30) + (String(value).length > 30 ? '...' : '');
  };
  
  return (
    <div 
      className={`node custom-node variable-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${!isValid ? 'invalid' : ''}`}
      onDoubleClick={handleNodeDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-cube"></i>
          <span>{data.label || 'Variable'}</span>
          
          <div className="node-actions">
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Variable configuration action
              }}
              title="Edit Variable"
            >
              <i className="fa fa-pencil"></i>
            </button>
          </div>
        </div>
        
        <div className="node-body">
          {data.name ? (
            <div className="node-info">
              <span className="variable-name">{data.name}</span>
              {data.value !== undefined && (
                <span className="variable-value">
                  = {formatValue(data.value)}
                </span>
              )}
            </div>
          ) : (
            <div className="node-info">No variable defined</div>
          )}
          
          {isExpanded && data.description && (
            <div className="node-description">
              {data.description}
            </div>
          )}
          
          {!isValid && (
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i> Missing variable name
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
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default VariableNode;