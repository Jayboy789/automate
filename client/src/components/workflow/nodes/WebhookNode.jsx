import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const WebhookNode = memo(({ data, isConnectable, selected }) => {
  return (
    <div className={`node custom-node webhook-node ${selected ? 'selected' : ''}`}>
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-bolt"></i>
          <span>{data.label || 'Webhook'}</span>
        </div>
        
        <div className="node-body">
          <div className="node-info">
            {data.path ? (
              <span className="webhook-path">/api/webhooks/{data.path}</span>
            ) : (
              <span className="empty-path">No path configured</span>
            )}
          </div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="main"
        style={{ background: '#10b981' }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default WebhookNode;