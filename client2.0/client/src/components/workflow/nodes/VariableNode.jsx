import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const VariableNode = memo(({ data, isConnectable, selected }) => {
  return (
    <div className={`node custom-node variable-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-cube"></i>
          <span>{data.label || 'Variable'}</span>
        </div>
        
        <div className="node-body">
          {data.name ? (
            <div className="node-info">
              <span className="variable-name">{data.name}</span>
              {data.value && (
                <span className="variable-value">
                  = {typeof data.value === 'string' && data.value.length > 15
                    ? `${data.value.substring(0, 15)}...`
                    : data.value}
                </span>
              )}
            </div>
          ) : (
            <div className="node-info">No variable defined</div>
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