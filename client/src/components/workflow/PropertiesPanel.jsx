// src/components/workflow/PropertiesPanel.jsx
import React from 'react';
import ScriptNodeConfig from './node-configs/ScriptNodeConfig';
import ConditionNodeConfig from './node-configs/ConditionNodeConfig';
import WaitNodeConfig from './node-configs/WaitNodeConfig';
import VariableNodeConfig from './node-configs/VariableNodeConfig';
import HttpNodeConfig from './node-configs/HttpNodeConfig';
import WebhookNodeConfig from './node-configs/WebhookNodeConfig';
import ScheduleNodeConfig from './node-configs/ScheduleNodeConfig';
import LoopNodeConfig from './node-configs/LoopNodeConfig';
import TransformNodeConfig from './node-configs/TransformNodeConfig';

const PropertiesPanel = ({ node, onUpdate, onClose }) => {
  if (!node) return null;

  // Render different configuration forms based on node type
  const renderNodeConfig = () => {
    switch(node.type) {
      case 'scriptNode':
        return <ScriptNodeConfig node={node} onChange={onUpdate} />;
      case 'conditionNode':
        return <ConditionNodeConfig node={node} onChange={onUpdate} />;
      case 'waitNode':
        return <WaitNodeConfig node={node} onChange={onUpdate} />;
      case 'variableNode':
        return <VariableNodeConfig node={node} onChange={onUpdate} />;
      case 'httpNode':
        return <HttpNodeConfig node={node} onChange={onUpdate} />;
      case 'webhookNode':
        return <WebhookNodeConfig node={node} onChange={onUpdate} />;
      case 'scheduleNode':
        return <ScheduleNodeConfig node={node} onChange={onUpdate} />;
      case 'loopNode':
        return <LoopNodeConfig node={node} onChange={onUpdate} />;
      case 'transformNode':
        return <TransformNodeConfig node={node} onChange={onUpdate} />;
      default:
        return (
          <div className="default-config">
            <div className="form-group">
              <label>Node Label</label>
              <input
                type="text"
                value={node.data?.label || ''}
                onChange={(e) => onUpdate({
                  ...node,
                  data: { ...node.data, label: e.target.value }
                })}
              />
            </div>
            <div className="form-message">
              Additional configuration not available for this node type.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>Node Properties</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="panel-content">
        {renderNodeConfig()}
      </div>
    </div>
  );
};

export default PropertiesPanel;