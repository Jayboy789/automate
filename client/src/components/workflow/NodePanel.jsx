// client/src/components/workflow/NodePanel.jsx
import React, { useState } from 'react';

const NodePanel = () => {
  const [expandedCategory, setExpandedCategory] = useState('all');

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? 'all' : category);
  };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Check if a category should be expanded
  const isCategoryExpanded = (category) => {
    return expandedCategory === 'all' || expandedCategory === category;
  };

  return (
    <div className="node-panel">
      <h3>Workflow Nodes</h3>
      
      {/* Triggers */}
      <div className="node-panel-category">
        <div 
          className="category-header"
          onClick={() => toggleCategory('triggers')}
        >
          <i className={`fa fa-chevron-${isCategoryExpanded('triggers') ? 'down' : 'right'}`}></i>
          <span>Triggers</span>
        </div>
        
        {isCategoryExpanded('triggers') && (
          <div className="node-panel-section">
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
            <div 
              className="node-item event-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'eventNode')}
            >
              <i className="fa fa-bell"></i> Event Trigger
            </div>
            <div 
              className="node-item email-trigger-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'emailTriggerNode')}
            >
              <i className="fa fa-envelope"></i> Email Trigger
            </div>
            <div 
              className="node-item form-submit-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'formSubmitNode')}
            >
              <i className="fa fa-wpforms"></i> Form Submission
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="node-panel-category">
        <div 
          className="category-header"
          onClick={() => toggleCategory('actions')}
        >
          <i className={`fa fa-chevron-${isCategoryExpanded('actions') ? 'down' : 'right'}`}></i>
          <span>Actions</span>
        </div>
        
        {isCategoryExpanded('actions') && (
          <div className="node-panel-section">
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
            <div 
              className="node-item email-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'emailNode')}
            >
              <i className="fa fa-envelope"></i> Send Email
            </div>
            <div 
              className="node-item database-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'databaseNode')}
            >
              <i className="fa fa-database"></i> Database
            </div>
            <div 
              className="node-item api-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'apiNode')}
            >
              <i className="fa fa-plug"></i> API Call
            </div>
            <div 
              className="node-item notification-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'notificationNode')}
            >
              <i className="fa fa-bell"></i> Notification
            </div>
            <div 
              className="node-item file-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'fileNode')}
            >
              <i className="fa fa-file"></i> File Operations
            </div>
          </div>
        )}
      </div>
      
      {/* Logic */}
      <div className="node-panel-category">
        <div 
          className="category-header"
          onClick={() => toggleCategory('logic')}
        >
          <i className={`fa fa-chevron-${isCategoryExpanded('logic') ? 'down' : 'right'}`}></i>
          <span>Logic</span>
        </div>
        
        {isCategoryExpanded('logic') && (
          <div className="node-panel-section">
            <div 
              className="node-item condition-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'conditionNode')}
            >
              <i className="fa fa-code-branch"></i> Condition
            </div>
            <div 
              className="node-item switch-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'switchNode')}
            >
              <i className="fa fa-random"></i> Switch
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
            <div 
              className="node-item foreach-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'foreachNode')}
            >
              <i className="fa fa-list"></i> For Each
            </div>
            <div 
              className="node-item parallel-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'parallelNode')}
            >
              <i className="fa fa-columns"></i> Parallel
            </div>
            <div 
              className="node-item scope-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'scopeNode')}
            >
              <i className="fa fa-layer-group"></i> Scope
            </div>
          </div>
        )}
      </div>
      
      {/* Data */}
      <div className="node-panel-category">
        <div 
          className="category-header"
          onClick={() => toggleCategory('data')}
        >
          <i className={`fa fa-chevron-${isCategoryExpanded('data') ? 'down' : 'right'}`}></i>
          <span>Data</span>
        </div>
        
        {isCategoryExpanded('data') && (
          <div className="node-panel-section">
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
            <div 
              className="node-item array-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'arrayNode')}
            >
              <i className="fa fa-list-ol"></i> Array Operations
            </div>
            <div 
              className="node-item object-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'objectNode')}
            >
              <i className="fa fa-cubes"></i> Object Operations
            </div>
            <div 
              className="node-item string-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'stringNode')}
            >
              <i className="fa fa-font"></i> String Operations
            </div>
            <div 
              className="node-item math-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'mathNode')}
            >
              <i className="fa fa-calculator"></i> Math Operations
            </div>
            <div 
              className="node-item date-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'dateNode')}
            >
              <i className="fa fa-calendar-alt"></i> Date Operations
            </div>
          </div>
        )}
      </div>
      
      {/* Integrations */}
      <div className="node-panel-category">
        <div 
          className="category-header"
          onClick={() => toggleCategory('integrations')}
        >
          <i className={`fa fa-chevron-${isCategoryExpanded('integrations') ? 'down' : 'right'}`}></i>
          <span>Integrations</span>
        </div>
        
        {isCategoryExpanded('integrations') && (
          <div className="node-panel-section">
            <div 
              className="node-item slack-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'slackNode')}
            >
              <i className="fab fa-slack"></i> Slack
            </div>
            <div 
              className="node-item teams-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'teamsNode')}
            >
              <i className="fab fa-microsoft"></i> Teams
            </div>
            <div 
              className="node-item sharepoint-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'sharepointNode')}
            >
              <i className="fab fa-microsoft"></i> SharePoint
            </div>
            <div 
              className="node-item google-drive-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'googleDriveNode')}
            >
              <i className="fab fa-google-drive"></i> Google Drive
            </div>
            <div 
              className="node-item salesforce-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'salesforceNode')}
            >
              <i className="fa fa-cloud"></i> Salesforce
            </div>
            <div 
              className="node-item jira-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'jiraNode')}
            >
              <i className="fab fa-jira"></i> Jira
            </div>
            <div 
              className="node-item zendesk-node"
              draggable
              onDragStart={(e) => onDragStart(e, 'zendeskNode')}
            >
              <i className="fa fa-ticket-alt"></i> Zendesk
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodePanel;