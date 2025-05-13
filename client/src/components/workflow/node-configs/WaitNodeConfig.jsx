// src/components/workflow/node-configs/WaitNodeConfig.jsx
import React from 'react';

const WaitNodeConfig = ({ node, onChange }) => {
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
    <div className="node-config wait-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
          placeholder="Wait Node"
        />
      </div>
      
      <div className="form-group">
        <label>Wait Duration (seconds)</label>
        <input
          type="number"
          min="1"
          value={node.data.waitTime || 5}
          onChange={(e) => updateNodeData({ waitTime: parseInt(e.target.value) || 5 })}
        />
      </div>
      
      <div className="form-group">
        <label>Description</label>
        <textarea
          rows={2}
          value={node.data.description || ''}
          onChange={(e) => updateNodeData({ description: e.target.value })}
          placeholder="Optional description of this wait step"
        />
      </div>
    </div>
  );
};

export default WaitNodeConfig;