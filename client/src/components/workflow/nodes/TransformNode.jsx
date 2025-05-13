import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

const TransformNode = memo(({ data, isConnectable, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleNodeDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Check if transform is configured
  const isValid = data.inputVariable && data.outputVariable && data.transformFunction;
  
  return (
    <div 
      className={`node custom-node transform-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${!isValid ? 'invalid' : ''}`}
      onDoubleClick={handleNodeDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-exchange-alt"></i>
          <span>{data.label || 'Transform'}</span>
          
          <div className="node-actions">
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Transform configuration action
              }}
              title="Edit Transform"
            >
              <i className="fa fa-pencil"></i>
            </button>
          </div>
        </div>
        
        <div className="node-body">
          {data.inputVariable && data.outputVariable ? (
            <div className="node-info">
              <div className="transform-mapping">
                <span className="var-name">{data.inputVariable}</span>
                <span className="arrow">→</span>
                <span className="var-name">{data.outputVariable}</span>
              </div>
            </div>
          ) : (
            <div className="node-info">
              Transform not configured
            </div>
          )}
          
          {isExpanded && data.transformFunction && (
            <div className="function-preview">
              <div className="details-label">Transform Function:</div>
              <pre>{data.transformFunction.substring(0, 100)}...</pre>
            </div>
          )}
          
          {!isValid && (
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i> Incomplete transform configuration
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

export default TransformNode;