import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

const WaitNode = memo(({ data, isConnectable, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleNodeDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Check if wait time is valid
  const isValid = !isNaN(data.waitTime) && data.waitTime > 0;
  
  // Format wait time for display
  const formatWaitTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '5 seconds';
    
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      let result = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      if (remainingSeconds > 0) {
        result += ` ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
      }
      return result;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    let result = `${hours} hour${hours !== 1 ? 's' : ''}`;
    if (remainingMinutes > 0) {
      result += ` ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
    return result;
  };
  
  return (
    <div 
      className={`node custom-node wait-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${!isValid ? 'invalid' : ''}`}
      onDoubleClick={handleNodeDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-clock"></i>
          <span>{data.label || 'Wait'}</span>
          
          <div className="node-actions">
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Wait time configuration action
              }}
              title="Edit Wait Time"
            >
              <i className="fa fa-pencil"></i>
            </button>
          </div>
        </div>
        
        <div className="node-body">
          <div className="node-info">
            <span>Wait for {formatWaitTime(data.waitTime)}</span>
          </div>
          
          {isExpanded && data.description && (
            <div className="node-description">
              {data.description}
            </div>
          )}
          
          {!isValid && (
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i> Invalid wait time
            </div>
          )}
          
          {data.executionStatus && (
            <div className={`execution-status ${data.executionStatus}`}>
              {data.executionStatus === 'running' && (
                <>
                  <i className="fa fa-spinner fa-spin"></i>
                  <span>Waiting</span>
                  {data.remainingTime !== undefined && (
                    <span className="remaining-time">{formatWaitTime(data.remainingTime)} left</span>
                  )}
                </>
              )}
              {data.executionStatus === 'completed' && <i className="fa fa-check"></i>}
              {data.executionStatus === 'failed' && <i className="fa fa-times"></i>}
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

export default WaitNode;