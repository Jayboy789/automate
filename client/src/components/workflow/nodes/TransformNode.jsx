import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const TransformNode = memo(({ data, isConnectable, selected }) => {
  return (
    <div className={`node custom-node transform-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-exchange-alt"></i>
          <span>{data.label || 'Transform'}</span>
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