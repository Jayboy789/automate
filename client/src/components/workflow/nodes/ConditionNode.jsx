import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ConditionNode = memo(({ data, isConnectable, selected }) => {
  return (
    <div className={`node custom-node condition-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-code-branch"></i>
          <span>{data.label || 'Condition'}</span>
        </div>
        
        <div className="node-body">
          <div className="node-info">
            {data.condition ? (
              <span className="condition-expression">{data.condition}</span>
            ) : (
              <span className="empty-condition">No condition set</span>
            )}
          </div>
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