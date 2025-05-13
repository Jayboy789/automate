// client/src/components/workflow/nodes/StringNode.jsx
import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useWorkflowVariables } from '../../../contexts/WorkflowVariablesContext';

const StringNode = memo(({ data, isConnectable, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getAllVariables } = useWorkflowVariables();
  
  const handleNodeDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Get operation description based on type
  const getOperationDescription = () => {
    const { operation, input1, input2, outputVariable } = data;
    
    switch (operation) {
      case 'concat':
        return `Concatenates strings: ${input1 || '?'} + ${input2 || '?'} → ${outputVariable || '?'}`;
      case 'substring':
        return `Extracts substring from ${input1 || '?'} → ${outputVariable || '?'}`;
      case 'replace':
        return `Replaces text in ${input1 || '?'} → ${outputVariable || '?'}`;
      case 'toLower':
        return `Converts ${input1 || '?'} to lowercase → ${outputVariable || '?'}`;
      case 'toUpper':
        return `Converts ${input1 || '?'} to uppercase → ${outputVariable || '?'}`;
      case 'trim':
        return `Trims whitespace from ${input1 || '?'} → ${outputVariable || '?'}`;
      case 'split':
        return `Splits ${input1 || '?'} into array → ${outputVariable || '?'}`;
      case 'length':
        return `Gets length of ${input1 || '?'} → ${outputVariable || '?'}`;
      default:
        return 'No operation selected';
    }
  };
  
  // Check if node configuration is valid
  const isValid = data.operation && data.input1 && data.outputVariable;
  
  // Check if operation requires a second input
  const needsSecondInput = ['concat', 'replace', 'split'].includes(data.operation);
  const isFullyConfigured = isValid && (!needsSecondInput || (needsSecondInput && data.input2));
  
  return (
    <div 
      className={`node custom-node string-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${!isValid ? 'invalid' : ''}`}
      onDoubleClick={handleNodeDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <div className="node-content">
        <div className="node-header">
          <i className="fa fa-font"></i>
          <span>{data.label || 'String Operations'}</span>
          
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
          <div className="node-info">
            <span className="operation-name">
              {data.operation ? data.operation.charAt(0).toUpperCase() + data.operation.slice(1) : 'No operation'}
            </span>
          </div>
          
          <div className="node-info operation-desc">
            {getOperationDescription()}
          </div>
          
          {isExpanded && (
            <div className="operation-details">
              <div className="input-mapping">
                <div className="input-label">Input:</div>
                <div className="input-value">{data.input1 || 'Not set'}</div>
              </div>
              
              {needsSecondInput && (
                <div className="input-mapping">
                  <div className="input-label">
                    {data.operation === 'concat' ? 'Second String:' : 
                     data.operation === 'replace' ? 'Replace Pattern:' : 
                     data.operation === 'split' ? 'Delimiter:' : 'Second Input:'}
                  </div>
                  <div className="input-value">{data.input2 || 'Not set'}</div>
                </div>
              )}
              
              {data.operation === 'substring' && (
                <>
                  <div className="input-mapping">
                    <div className="input-label">Start Index:</div>
                    <div className="input-value">{data.startIndex || '0'}</div>
                  </div>
                  <div className="input-mapping">
                    <div className="input-label">End Index:</div>
                    <div className="input-value">{data.endIndex || 'End'}</div>
                  </div>
                </>
              )}
              
              <div className="input-mapping">
                <div className="input-label">Output:</div>
                <div className="input-value">{data.outputVariable || 'Not set'}</div>
              </div>
            </div>
          )}
          
          {!isValid && (
            <div className="validation-error">
              <i className="fa fa-exclamation-triangle"></i> Incomplete configuration
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

export default StringNode;