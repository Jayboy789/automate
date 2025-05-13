import React from 'react';

const ConditionNodeConfig = ({ node, onChange }) => {
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
    <div className="node-config condition-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
          placeholder="Condition Node"
        />
      </div>
      
      <div className="form-group">
        <label>Condition Expression</label>
        <textarea
          rows={5}
          value={node.data.condition || ''}
          onChange={(e) => updateNodeData({ condition: e.target.value })}
          placeholder={`Example: ${'{{'}count${'}}'} > 10 or ${'{{'}status${'}}'} === 'completed'`}
        />
        <div className="form-help">
          Use variables with double curly braces: <code>{'{{'}</code>variableName<code>{'}}'}</code>
        </div>
      </div>
      
      <div className="form-group">
        <label>Description</label>
        <textarea
          rows={2}
          value={node.data.description || ''}
          onChange={(e) => updateNodeData({ description: e.target.value })}
          placeholder="Optional description of this condition"
        />
      </div>
      
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

export default ConditionNodeConfig;