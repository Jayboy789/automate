import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const LoopNode = memo(({ data, isConnectable, selected }) => {
  // Helper to get loop type display
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
    <div className={`node custom-node loop-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-redo"></i>
          <span>{data.label || 'Loop'}</span>
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