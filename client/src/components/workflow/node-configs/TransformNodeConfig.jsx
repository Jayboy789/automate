// src/components/workflow/node-configs/TransformNodeConfig.jsx
import React from 'react';

const TransformNodeConfig = ({ node, onChange }) => {
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
    <div className="node-config transform-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
          placeholder="Transform"
        />
      </div>
      
      <div className="form-group">
        <label>Input Variable</label>
        <input
          type="text"
          value={node.data.inputVariable || ''}
          onChange={(e) => updateNodeData({ inputVariable: e.target.value })}
          placeholder="inputData"
        />
        <div className="form-help">
          Source variable to transform
        </div>
      </div>
      
      <div className="form-group">
        <label>Output Variable</label>
        <input
          type="text"
          value={node.data.outputVariable || ''}
          onChange={(e) => updateNodeData({ outputVariable: e.target.value })}
          placeholder="transformedData"
        />
        <div className="form-help">
          Destination variable for transformed data
        </div>
      </div>
      
      <div className="form-group">
        <label>Transform Function (JavaScript)</label>
        <textarea
          rows={10}
          value={node.data.transformFunction || ''}
          onChange={(e) => updateNodeData({ transformFunction: e.target.value })}
          placeholder={`// Input data is available as 'input'\n// Return the transformed output\nreturn input.map(item => ({\n  id: item.id,\n  name: item.name.toUpperCase()\n}));`}
        />
        <div className="form-help">
          JavaScript function to transform the input variable
        </div>
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

export default TransformNodeConfig;