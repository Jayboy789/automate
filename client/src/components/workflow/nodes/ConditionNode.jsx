import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

const ConditionNode = memo(({ data, isConnectable, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleNodeDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Check if condition is configured
  const isValid = data.condition && data.condition.trim().length > 0;
  
  return (
    <div 
      className={`node custom-node condition-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${!isValid ? 'invalid' : ''}`}
      onDoubleClick={handleNodeDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-code-branch"></i>
          <span>{data.label || 'Condition'}</span>
          
          <div className="node-actions">
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Condition editing action
              }}
              title="Edit Condition"
            >
              <i className="fa fa-pencil"></i>
            </button>
          </div>
        </div>
        
        <div className="node-body">
          <div className="node-info">
            {data.condition ? (
              <span className="condition-expression">{data.condition}</span>
            ) : (
              <span className="empty-condition">No condition set</span>
            )}
          </div>
          
          {isExpanded && data.description && (
            <div className="node-description">
              {data.description}
            </div>
          )}
          
          {!isValid && (
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i> Missing condition
            </div>
          )}
          
          {data.executionStatus && (
            <div className={`execution-status ${data.executionStatus}`}>
              {data.executionStatus === 'running' && <i className="fa fa-spinner fa-spin"></i>}
              {data.executionStatus === 'completed' && <i className="fa fa-check"></i>}
              {data.executionStatus === 'failed' && <i className="fa fa-times"></i>}
              <span>{data.executionStatus}</span>
              {data.result !== undefined && (
                <span className="condition-result">Result: {data.result ? 'True' : 'False'}</span>
              )}
            </div>
          )}
          
          {isExpanded && (
            <div className="path-indicators">
              <div className="path-indicator true-path">True →</div>
              <div className="path-indicator false-path">False →</div>
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ background: '#10b981', left: '25%' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ background: '#ef4444', left: '75%' }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default ConditionNode;