import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const WaitNode = memo(({ data, isConnectable, selected }) => {
  return (
    <div className={`node custom-node wait-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-clock"></i>
          <span>{data.label || 'Wait'}</span>
        </div>
        
        <div className="node-body">
          <div className="node-info">
            {data.waitTime ? (
              <span>Wait for {data.waitTime} seconds</span>
            ) : (
              <span>Wait for 5 seconds</span>
            )}
          </div>
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