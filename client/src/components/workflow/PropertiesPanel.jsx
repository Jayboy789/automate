import React from 'react';

const PropertiesPanel = ({ node, onUpdate, onClose }) => {
  // This is a placeholder implementation since the file was empty
  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>Node Properties</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="panel-content">
        <div className="form-group">
          <label htmlFor="node-label">Label</label>
          <input
            id="node-label"
            type="text"
            value={node.data?.label || ''}
            onChange={(e) => {
              const updatedNode = {
                ...node,
                data: { ...node.data, label: e.target.value }
              };
              onUpdate(updatedNode);
            }}
          />
        </div>
        
        <div className="form-group">
          <label>Node Type</label>
          <div className="static-field">{node.type}</div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;