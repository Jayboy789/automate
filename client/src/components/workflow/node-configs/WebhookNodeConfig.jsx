// src/components/workflow/node-configs/WebhookNodeConfig.jsx
import React from 'react';

const WebhookNodeConfig = ({ node, onChange }) => {
  const updateNodeData = (updates) => {
    onChange({
      ...node,
      data: {
        ...node.data,
        ...updates
      }
    });
  };
  
  // Format webhook URL for display
  const getWebhookUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/webhooks/${node.data.path || '[path]'}`;
  };
  
  return (
    <div className="node-config webhook-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
          placeholder="Webhook"
        />
      </div>
      
      <div className="form-group">
        <label>Webhook Path</label>
        <input
          type="text"
          value={node.data.path || ''}
          onChange={(e) => updateNodeData({ path: e.target.value })}
          placeholder="my-webhook"
        />
        <div className="form-help">
          This will create a webhook at: {getWebhookUrl()}
        </div>
      </div>
      
      <div className="form-group">
        <label>Description</label>
        <textarea
          rows={2}
          value={node.data.description || ''}
          onChange={(e) => updateNodeData({ description: e.target.value })}
          placeholder="What this webhook does"
        />
      </div>
      
      <div className="form-group">
        <label>Store Webhook Data In Variable</label>
        <input
          type="text"
          value={node.data.dataVariable || ''}
          onChange={(e) => updateNodeData({ dataVariable: e.target.value })}
          placeholder="webhookData"
        />
      </div>
      
      {node.data.path && (
        <div className="form-group">
          <label>Webhook URL</label>
          <div className="webhook-url-display">
            <input
              type="text"
              value={getWebhookUrl()}
              readOnly
            />
            <button
              type="button"
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(getWebhookUrl())}
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookNodeConfig;