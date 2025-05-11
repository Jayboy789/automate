import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ScriptNode = memo(({ data, isConnectable, selected }) => {
  return (
    <div className={`node custom-node script-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-code"></i>
          <span>{data.label || 'Script'}</span>
        </div>
        
        <div className="node-body">
          {data.scriptId ? (
            <div className="node-info">From library: {data.scriptName}</div>
          ) : (
            <div className="node-info">Language: {data.language || 'PowerShell'}</div>
          )}
          
          {data.assignedAgent && (
            <div className="node-info">Agent: {data.agentName || data.assignedAgent}</div>
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

export default ScriptNode;