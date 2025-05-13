// client/src/components/workflow/node-configs/StringNodeConfig.jsx
import React from 'react';
import { useWorkflowVariables } from '../../../contexts/WorkflowVariablesContext';

const StringNodeConfig = ({ node, onChange }) => {
  const { getAllVariables } = useWorkflowVariables();
  
  // Available string operations
  const stringOperations = [
    { value: 'concat', label: 'Concatenate Strings' },
    { value: 'substring', label: 'Extract Substring' },
    { value: 'replace', label: 'Replace Text' },
    { value: 'toLower', label: 'Convert to Lowercase' },
    { value: 'toUpper', label: 'Convert to Uppercase' },
    { value: 'trim', label: 'Trim Whitespace' },
    { value: 'split', label: 'Split to Array' },
    { value: 'length', label: 'Get String Length' }
  ];
  
  // Get variables that could be used as inputs
  const availableVariables = getAllVariables().map(v => ({
    value: v.fullPath,
    label: `${v.fullPath} (${v.type})`,
    type: v.type
  }));
  
  // Update node data
  const updateNodeData = (updates) => {
    onChange({
      ...node,
      data: {
        ...node.data,
        ...updates
      }
    });
  };
  
  // Check if operation requires a second input
  const needsSecondInput = ['concat', 'replace', 'split'].includes(node.data.operation);
  
  // Check if operation needs substring indices
  const needsSubstringIndices = node.data.operation === 'substring';
  
  return (
    <div className="node-config string-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
          placeholder="String Operations"
        />
      </div>
      
      <div className="form-group">
        <label>Operation</label>
        <select
          value={node.data.operation || ''}
          onChange={(e) => updateNodeData({ operation: e.target.value })}
        >
          <option value="">-- Select Operation --</option>
          {stringOperations.map(op => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label>
          {node.data.operation === 'concat' ? 'First String' : 
           node.data.operation === 'replace' ? 'Original String' : 
           node.data.operation === 'substring' ? 'Source String' : 
           'Input String'}
        </label>
        <div className="input-with-options">
          <select
            value={node.data.input1 || ''}
            onChange={(e) => updateNodeData({ input1: e.target.value })}
          >
            <option value="">-- Select Variable --</option>
            {availableVariables.map(v => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
          <div className="or-divider">OR</div>
          <input
            type="text"
            value={node.data.input1Text || ''}
            onChange={(e) => updateNodeData({ 
              input1: e.target.value,
              input1Text: e.target.value
            })}
            placeholder="Enter literal text"
          />
        </div>
      </div>
      
      {needsSecondInput && (
        <div className="form-group">
          <label>
            {node.data.operation === 'concat' ? 'Second String' : 
             node.data.operation === 'replace' ? 'Text to Find' : 
             node.data.operation === 'split' ? 'Delimiter' : 
             'Second Input'}
          </label>
          <div className="input-with-options">
            <select
              value={node.data.input2 || ''}
              onChange={(e) => updateNodeData({ input2: e.target.value })}
            >
              <option value="">-- Select Variable --</option>
              {availableVariables.map(v => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <div className="or-divider">OR</div>
            <input
              type="text"
              value={node.data.input2Text || ''}
              onChange={(e) => updateNodeData({ 
                input2: e.target.value,
                input2Text: e.target.value
              })}
              placeholder="Enter literal text"
            />
          </div>
        </div>
      )}
      
      {node.data.operation === 'replace' && (
        <div className="form-group">
          <label>Replacement Text</label>
          <div className="input-with-options">
            <select
              value={node.data.replacementText || ''}
              onChange={(e) => updateNodeData({ replacementText: e.target.value })}
            >
              <option value="">-- Select Variable --</option>
              {availableVariables.map(v => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <div className="or-divider">OR</div>
            <input
              type="text"
              value={node.data.replacementTextDirect || ''}
              onChange={(e) => updateNodeData({ 
                replacementText: e.target.value,
                replacementTextDirect: e.target.value
              })}
              placeholder="Enter replacement text"
            />
          </div>
        </div>
      )}
      
      {needsSubstringIndices && (
        <>
          <div className="form-group">
            <label>Start Index</label>
            <input
              type="number"
              min="0"
              value={node.data.startIndex || 0}
              onChange={(e) => updateNodeData({ startIndex: parseInt(e.target.value) || 0 })}
            />
          </div>
          
          <div className="form-group">
            <label>End Index (Optional)</label>
            <input
              type="number"
              min="0"
              value={node.data.endIndex || ''}
              onChange={(e) => updateNodeData({ endIndex: e.target.value ? parseInt(e.target.value) : '' })}
              placeholder="Leave empty for end of string"
            />
          </div>
        </>
      )}
      
      <div className="form-group">
        <label>Output Variable Name</label>
        <input
          type="text"
          value={node.data.outputVariable || ''}
          onChange={(e) => updateNodeData({ outputVariable: e.target.value })}
          placeholder="result"
        />
        <div className="form-help">
          A new variable with this name will be created to store the result
        </div>
      </div>
      
      {node.data.operation === 'split' && (
        <div className="form-info">
          <i className="fa fa-info-circle"></i> The result will be an array
        </div>
      )}
      
      {node.data.operation === 'length' && (
        <div className="form-info">
          <i className="fa fa-info-circle"></i> The result will be a number
        </div>
      )}
      
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={node.data.continueOnError || false}
            onChange={(e) => updateNodeData({ continueOnError: e.target.checked })}
          />
          Continue workflow on error
        </label>
      </div>
    </div>
  );
};

export default StringNodeConfig;