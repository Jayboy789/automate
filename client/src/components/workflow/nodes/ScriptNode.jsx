import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

const ScriptNode = memo(({ data, isConnectable, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleNodeDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Check if script has required data
  const isValid = data.scriptId || data.script;
  
  return (
    <div 
      className={`node custom-node script-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${!isValid ? 'invalid' : ''}`}
      onDoubleClick={handleNodeDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-code"></i>
          <span>{data.label || 'Script'}</span>
          
          <div className="node-actions">
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Script editing action
              }}
              title="Edit Script"
            >
              <i className="fa fa-pencil"></i>
            </button>
          </div>
        </div>
        
        <div className="node-body">
          {data.scriptId ? (
            <div className="node-info">From library: {data.scriptName || data.scriptId}</div>
          ) : (
            <div className="node-info">Language: {data.language || 'PowerShell'}</div>
          )}
          
          {data.assignedAgent && (
            <div className="node-info">Agent: {data.agentName || data.assignedAgent}</div>
          )}
          
          {isExpanded && data.script && (
            <div className="script-preview">
              <pre>{data.script.substring(0, 150)}{data.script.length > 150 ? '...' : ''}</pre>
            </div>
          )}
          
          {!isValid && (
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i> Missing script configuration
            </div>
          )}
          
          {data.executionStatus && (
            <div className={`execution-status ${data.executionStatus}`}>
              {data.executionStatus === 'running' && <i className="fa fa-spinner fa-spin"></i>}
              {data.executionStatus === 'completed' && <i className="fa fa-check"></i>}
              {data.executionStatus === 'failed' && <i className="fa fa-times"></i>}
              <span>{data.executionStatus}</span>
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

export default ScriptNode;