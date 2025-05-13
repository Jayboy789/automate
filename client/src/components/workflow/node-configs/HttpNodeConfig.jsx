// src/components/workflow/node-configs/HttpNodeConfig.jsx
import React, { useState } from 'react';

const HttpNodeConfig = ({ node, onChange }) => {
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  
  const updateNodeData = (updates) => {
    onChange({
      ...node,
      data: {
        ...node.data,
        ...updates
      }
    });
  };
  
  const addHeader = () => {
    if (!headerKey.trim()) return;
    
    const currentHeaders = node.data.headers || {};
    updateNodeData({
      headers: {
        ...currentHeaders,
        [headerKey]: headerValue
      }
    });
    
    setHeaderKey('');
    setHeaderValue('');
  };
  
  const removeHeader = (key) => {
    const currentHeaders = { ...node.data.headers };
    delete currentHeaders[key];
    updateNodeData({ headers: currentHeaders });
  };
  
  return (
    <div className="node-config http-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
          placeholder="HTTP Request"
        />
      </div>
      
      <div className="form-group">
        <label>HTTP Method</label>
        <select
          value={node.data.method || 'GET'}
          onChange={(e) => updateNodeData({ method: e.target.value })}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>URL</label>
        <input
          type="text"
          value={node.data.url || ''}
          onChange={(e) => updateNodeData({ url: e.target.value })}
          placeholder="https://example.com/api"
        />
      </div>
      
      <div className="form-group">
        <label>Headers</label>
        <div className="headers-container">
          {node.data.headers && Object.keys(node.data.headers).length > 0 && (
            <div className="headers-list">
              {Object.entries(node.data.headers).map(([key, value]) => (
                <div key={key} className="header-item">
                  <div className="header-content">
                    <strong>{key}:</strong> {value}
                  </div>
                  <button 
                    type="button" 
                    className="remove-header-btn"
                    onClick={() => removeHeader(key)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="add-header">
            <div className="header-inputs">
              <input
                type="text"
                placeholder="Header name"
                value={headerKey}
                onChange={(e) => setHeaderKey(e.target.value)}
              />
              <input
                type="text"
                placeholder="Header value"
                value={headerValue}
                onChange={(e) => setHeaderValue(e.target.value)}
              />
            </div>
            <button 
              type="button" 
              className="add-header-btn"
              onClick={addHeader}
            >
              Add
            </button>
          </div>
        </div>
      </div>
      
      <div className="form-group">
        <label>Request Body</label>
        <textarea
          rows={5}
          value={typeof node.data.body === 'object' 
            ? JSON.stringify(node.data.body, null, 2) 
            : (node.data.body || '')}
          onChange={(e) => {
            try {
              // Try to parse as JSON first
              const body = JSON.parse(e.target.value);
              updateNodeData({ body });
            } catch (error) {
              // If not valid JSON, store as string
              updateNodeData({ body: e.target.value });
            }
          }}
          placeholder='{"key": "value"}'
        />
        <div className="form-help">
          Enter a JSON object or plain text
        </div>
      </div>
      
      <div className="form-group">
        <label>Store Response In Variable</label>
        <input
          type="text"
          value={node.data.responseVariable || ''}
          onChange={(e) => updateNodeData({ responseVariable: e.target.value })}
          placeholder="responseData"
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

export default HttpNodeConfig;