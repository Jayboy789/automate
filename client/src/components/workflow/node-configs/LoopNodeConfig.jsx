// src/components/workflow/node-configs/LoopNodeConfig.jsx
import React from 'react';

const LoopNodeConfig = ({ node, onChange }) => {
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
    <div className="node-config loop-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
          placeholder="Loop"
        />
      </div>
      
      <div className="form-group">
        <label>Loop Type</label>
        <select
          value={node.data.loopType || 'collection'}
          onChange={(e) => updateNodeData({ loopType: e.target.value })}
        >
          <option value="collection">Collection</option>
          <option value="count">Count</option>
          <option value="while">While Condition</option>
        </select>
      </div>
      
      {node.data.loopType === 'collection' && (
        <>
          <div className="form-group">
            <label>Collection Variable</label>
            <input
              type="text"
              value={node.data.collectionVariable || ''}
              onChange={(e) => updateNodeData({ collectionVariable: e.target.value })}
              placeholder="myCollection"
            />
            <div className="form-help">
              Variable containing the collection to iterate over
            </div>
          </div>
          <div className="form-group">
            <label>Item Variable</label>
            <input
              type="text"
              value={node.data.itemVariable || ''}
              onChange={(e) => updateNodeData({ itemVariable: e.target.value })}
              placeholder="item"
            />
            <div className="form-help">
              Variable name for each item in the collection
            </div>
          </div>
        </>
      )}
      
      {node.data.loopType === 'count' && (
        <>
          <div className="form-group">
            <label>Start</label>
            <input
              type="number"
              value={node.data.start !== undefined ? node.data.start : 0}
              onChange={(e) => updateNodeData({ start: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label>End</label>
            <input
              type="number"
              value={node.data.end !== undefined ? node.data.end : 10}
              onChange={(e) => updateNodeData({ end: parseInt(e.target.value) || 10 })}
            />
          </div>
          <div className="form-group">
            <label>Counter Variable</label>
            <input
              type="text"
              value={node.data.counterVariable || ''}
              onChange={(e) => updateNodeData({ counterVariable: e.target.value })}
              placeholder="i"
            />
            <div className="form-help">
              Variable name for the counter value
            </div>
          </div>
        </>
      )}
      
      {node.data.loopType === 'while' && (
        <div className="form-group">
          <label>While Condition</label>
          <textarea
            rows={3}
            value={node.data.whileCondition || ''}
            onChange={(e) => updateNodeData({ whileCondition: e.target.value })}
            placeholder={`${'{{'}variable${'}}'}' < 10`}
          />
          <div className="form-help">
            Condition to evaluate before each iteration
          </div>
        </div>
      )}
      
      <div className="form-group">
        <label>Max Iterations</label>
        <input
          type="number"
          min="1"
          value={node.data.maxIterations || 100}
          onChange={(e) => updateNodeData({ maxIterations: parseInt(e.target.value) || 100 })}
        />
        <div className="form-help">
          Safety limit to prevent infinite loops
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

export default LoopNodeConfig;