import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const HttpNode = memo(({ data, isConnectable, selected }) => {
  return (
    <div className={`node custom-node http-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-globe"></i>
          <span>{data.label || 'HTTP Request'}</span>
        </div>
        
        <div className="node-body">
          <div className="node-info method">
            {data.method || 'GET'}
          </div>
          
          <div className="node-info url">
            {data.url 
              ? (data.url.length > 25 ? `${data.url.substring(0, 25)}...` : data.url)
              : 'No URL specified'}
          </div>
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

export default HttpNode;