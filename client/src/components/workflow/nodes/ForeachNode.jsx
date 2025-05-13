// client/src/components/workflow/nodes/ForeachNode.jsx
import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useWorkflowVariables } from '../../../contexts/WorkflowVariablesContext';

const ForeachNode = memo(({ data, isConnectable, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getAllVariables } = useWorkflowVariables();
  
  const handleNodeDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Get array variables for displaying in the node
  const arrayVariables = getAllVariables()
    .filter(v => Array.isArray(v.value) || typeof v.value === 'object')
    .map(v => v.fullPath);
  
  const hasValidCollection = data.collectionVariable && arrayVariables.includes(data.collectionVariable);
  const hasValidItemVar = data.itemVariable && data.itemVariable.trim() !== '';
  const hasValidIndexVar = !data.indexVariable || (data.indexVariable && data.indexVariable.trim() !== '');
  
  // Check if node is valid
  const isValid = hasValidCollection && hasValidItemVar && hasValidIndexVar;
  
  return (
    <div 
      className={`node custom-node foreach-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${!isValid ? 'invalid' : ''}`}
      onDoubleClick={handleNodeDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-list"></i>
          <span>{data.label || 'For Each'}</span>
          
          <div className="node-actions">
            <button 
              className="node-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Configuration action
              }}
              title="Edit Configuration"
            >
              <i className="fa fa-pencil"></i>
            </button>
          </div>
        </div>
        
        <div className="node-body">
          {hasValidCollection ? (
            <div className="node-info">
              <span>Collection: </span>
              <span className="variable-reference">{data.collectionVariable}</span>
            </div>
          ) : (
            <div className="node-info empty-info">
              No collection specified
            </div>
          )}
          
          {hasValidItemVar && (
            <div className="node-info">
              <span>Item variable: </span>
              <span className="variable-reference">{data.itemVariable}</span>
            </div>
          )}
          
          {data.indexVariable && (
            <div className="node-info">
              <span>Index variable: </span>
              <span className="variable-reference">{data.indexVariable}</span>
            </div>
          )}
          
          {isExpanded && (
            <>
              {data.description && (
                <div className="node-description">
                  {data.description}
                </div>
              )}
              
              {hasValidCollection && arrayVariables.length > 0 && (
                <div className="collection-preview">
                  <div className="preview-label">Collection Type:</div>
                  <div className="preview-value">
                    {getAllVariables().find(v => v.fullPath === data.collectionVariable)?.type || 'unknown'}
                  </div>
                </div>
              )}
            </>
          )}
          
          {!isValid && (
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i> Incomplete configuration
            </div>
          )}
          
          {data.executionStatus && (
            <div className={`execution-status ${data.executionStatus}`}>
              {data.executionStatus === 'running' && (
                <>
                  <i className="fa fa-spinner fa-spin"></i>
                  <span>Iterating</span>
                  {data.currentIndex !== undefined && (
                    <span className="iteration">Item: {data.currentIndex}</span>
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
        id="forEach"
        style={{ background: '#10b981' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="complete"
        style={{ top: '30%', background: '#3b82f6' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="error"
        style={{ top: '70%', background: '#ef4444' }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default ForeachNode;