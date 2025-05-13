// client/src/components/workflow/node-configs/ForeachNodeConfig.jsx
import React from 'react';
import { useWorkflowVariables } from '../../../contexts/WorkflowVariablesContext';

const ForeachNodeConfig = ({ node, onChange }) => {
  const { getAllVariables } = useWorkflowVariables();
  
  // Get available collection variables (arrays or objects)
  const collectionVariables = getAllVariables()
    .filter(v => Array.isArray(v.value) || typeof v.value === 'object')
    .map(v => v.fullPath);
  
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
    <div className="node-config foreach-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
          placeholder="For Each"
        />
      </div>
      
      <div className="form-group">
        <label>Collection Variable</label>
        <select
          value={node.data.collectionVariable || ''}
          onChange={(e) => updateNodeData({ collectionVariable: e.target.value })}
        >
          <option value="">-- Select Collection --</option>
          {collectionVariables.map(varPath => (
            <option key={varPath} value={varPath}>
              {varPath}
            </option>
          ))}
        </select>
        {collectionVariables.length === 0 && (
          <div className="form-help form-warning">
            No collection variables found. Create an array or object variable first.
          </div>
        )}
        {node.data.collectionVariable && collectionVariables.includes(node.data.collectionVariable) && (
          <div className="form-help">
            Type: {getAllVariables().find(v => v.fullPath === node.data.collectionVariable)?.type}
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label>Item Variable Name</label>
        <input
          type="text"
          value={node.data.itemVariable || ''}
          onChange={(e) => updateNodeData({ itemVariable: e.target.value })}
          placeholder="currentItem"
        />
        <div className="form-help">
          This variable will contain the current item in each iteration
        </div>
      </div>
      
      <div className="form-group">
        <label>Index Variable Name (Optional)</label>
        <input
          type="text"
          value={node.data.indexVariable || ''}
          onChange={(e) => updateNodeData({ indexVariable: e.target.value })}
          placeholder="index"
        />
        <div className="form-help">
          This variable will contain the current index (0, 1, 2...)
        </div>
      </div>
      
      <div className="form-group">
        <label>Description (Optional)</label>
        <textarea
          rows={2}
          value={node.data.description || ''}
          onChange={(e) => updateNodeData({ description: e.target.value })}
          placeholder="Optional description of this loop"
        />
      </div>
      
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={node.data.parallelExecution || false}
            onChange={(e) => updateNodeData({ parallelExecution: e.target.checked })}
          />
          Parallel Execution (run iterations simultaneously)
        </label>
      </div>
      
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={node.data.continueOnError || false}
            onChange={(e) => updateNodeData({ continueOnError: e.target.checked })}
          />
          Continue on Error (if an iteration fails)
        </label>
      </div>
      
      <div className="form-info">
        <p>
          <i className="fa fa-info-circle"></i> Flow Connections:
        </p>
        <ul className="connection-info">
          <li><strong>Bottom:</strong> Connect to the node that should execute for each item</li>
          <li><strong>Right (top):</strong> Connect to the node that should execute when all iterations complete</li>
          <li><strong>Right (bottom):</strong> Connect to the node that should execute on error</li>
        </ul>
      </div>
    </div>
  );
};

export default ForeachNodeConfig;