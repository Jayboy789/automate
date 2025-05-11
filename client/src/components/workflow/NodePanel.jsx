import React from 'react';

const NodePanel = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="node-panel">
      <h3>Workflow Nodes</h3>
      <div className="node-panel-section">
        <h4>Automation</h4>
        <div 
          className="node-item script-node"
          draggable
          onDragStart={(e) => onDragStart(e, 'scriptNode')}
        >
          <i className="fa fa-code"></i> Script
        </div>
        <div 
          className="node-item http-node"
          draggable
          onDragStart={(e) => onDragStart(e, 'httpNode')}
        >
          <i className="fa fa-globe"></i> HTTP Request
        </div>
      </div>

      <div className="node-panel-section">
        <h4>Logic</h4>
        <div 
          className="node-item condition-node"
          draggable
          onDragStart={(e) => onDragStart(e, 'conditionNode')}
        >
          <i className="fa fa-code-branch"></i> Condition
        </div>
        <div 
          className="node-item wait-node"
          draggable
          onDragStart={(e) => onDragStart(e, 'waitNode')}
        >
          <i className="fa fa-clock"></i> Wait
        </div>
        <div 
          className="node-item loop-node"
          draggable
          onDragStart={(e) => onDragStart(e, 'loopNode')}
        >
          <i className="fa fa-redo"></i> Loop
        </div>
      </div>

      <div className="node-panel-section">
        <h4>Data</h4>
        <div 
          className="node-item variable-node"
          draggable
          onDragStart={(e) => onDragStart(e, 'variableNode')}
        >
          <i className="fa fa-cube"></i> Variable
        </div>
        <div 
          className="node-item transform-node"
          draggable
          onDragStart={(e) => onDragStart(e, 'transformNode')}
        >
          <i className="fa fa-exchange-alt"></i> Transform
        </div>
      </div>

      <div className="node-panel-section">
        <h4>Triggers</h4>
        <div 
          className="node-item webhook-node"
          draggable
          onDragStart={(e) => onDragStart(e, 'webhookNode')}
        >
          <i className="fa fa-bolt"></i> Webhook
        </div>
        <div 
          className="node-item schedule-node"
          draggable
          onDragStart={(e) => onDragStart(e, 'scheduleNode')}
        >
          <i className="fa fa-calendar"></i> Schedule
        </div>
      </div>
    </div>
  );
};

export default NodePanel;