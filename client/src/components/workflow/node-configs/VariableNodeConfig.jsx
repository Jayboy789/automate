// src/components/workflow/node-configs/VariableNodeConfig.jsx
import React from 'react';

const VariableNodeConfig = ({ node, onChange }) => {
  const updateNodeData = (updates) => {
    onChange({
      ...node,
      data: {
        ...node.data,
        ...updates
      }
    });
  };
  
  return (
    <div className="node-config variable-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
          placeholder="Variable Node"
        />
      </div>
      
      <div className="form-group">
        <label>Variable Name</label>
        <input
          type="text"
          value={node.data.name || ''}
          onChange={(e) => updateNodeData({ name: e.target.value })}
          placeholder="myVariable"
        />
        <div className="form-help">
          Use camelCase for variable names (e.g., "myVariable")
        </div>
      </div>
      
      <div className="form-group">
        <label>Value</label>
        <textarea
          rows={5}
          value={node.data.value !== undefined ? String(node.data.value) : ''}
          onChange={(e) => updateNodeData({ value: e.target.value })}
          placeholder="Value or expression with {{variables}}"
        />
        <div className="form-help">
          You can use other variables with <code>{'{{'}</code>varName<code>{'}}'}</code> syntax
        </div>
      </div>
      
      <div className="form-group">
        <label>Description</label>
        <textarea
          rows={2}
          value={node.data.description || ''}
          onChange={(e) => updateNodeData({ description: e.target.value })}
          placeholder="Optional description of this variable"
        />
      </div>
    </div>
  );
};

export default VariableNodeConfig;