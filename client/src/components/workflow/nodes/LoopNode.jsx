import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

const LoopNode = memo(({ data, isConnectable, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleNodeDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Check if loop is configured
  const isLoopConfigured = () => {
    if (!data.loopType) return false;
    
    if (data.loopType === 'collection' && data.collectionVariable) return true;
    if (data.loopType === 'count' && data.start !== undefined && data.end !== undefined) return true;
    if (data.loopType === 'while' && data.whileCondition) return true;
    
    return false;
  };
  
  const isValid = isLoopConfigured();
  
  // Helper to get loop display
  const getLoopDisplay = () => {
    if (!data.loopType) return 'Loop not configured';
    
    if (data.loopType === 'collection' && data.collectionVariable) {
      return `For each in ${data.collectionVariable}`;
    } else if (data.loopType === 'count' && data.start !== undefined && data.end !== undefined) {
      return `Count from ${data.start} to ${data.end}`;
    } else if (data.loopType === 'while' && data.whileCondition) {
      return `While ${data.whileCondition}`;
    }
    
    return 'Loop not fully configured';
  };
  
  return (
    <div 
      className={`node custom-node loop-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${!isValid ? 'invalid' : ''}`}
      onDoubleClick={handleNodeDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-redo"></i>
          <span>{data.label || 'Loop'}</span>
          
          <div className="node-actions">
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Loop configuration action
              }}
              title="Edit Loop"
            >
              <i className="fa fa-pencil"></i>
            </button>
          </div>
        </div>
        
        <div className="node-body">
          <div className="node-info">
            {getLoopDisplay()}
          </div>
          
          {data.maxIterations && (
            <div className="node-info">
              Max: {data.maxIterations} iterations
            </div>
          )}
          
          {isExpanded && data.loopType === 'collection' && data.itemVariable && (
            <div className="loop-details">
              <div className="details-label">Item variable:</div>
              <div className="details-value">{data.itemVariable}</div>
            </div>
          )}
          
          {isExpanded && data.loopType === 'count' && data.counterVariable && (
            <div className="loop-details">
              <div className="details-label">Counter variable:</div>
              <div className="details-value">{data.counterVariable}</div>
            </div>
          )}
          
          {!isValid && (
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i> Loop configuration incomplete
            </div>
          )}
          
          {data.executionStatus && (
            <div className={`execution-status ${data.executionStatus}`}>
              {data.executionStatus === 'running' && (
                <>
                  <i className="fa fa-spinner fa-spin"></i>
                  <span>Running</span>
                  {data.currentIteration !== undefined && (
                    <span className="iteration">Iteration: {data.currentIteration}</span>
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
        id="body"
        style={{ left: '30%', background: '#10b981' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="exit"
        style={{ left: '70%', background: '#ef4444' }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default LoopNode;