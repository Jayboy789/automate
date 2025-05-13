// client/src/components/workflow/node-configs/ApiNodeConfig.jsx
import React, { useState } from 'react';
import { useWorkflowVariables } from '../../../contexts/WorkflowVariablesContext';

const ApiNodeConfig = ({ node, onChange }) => {
  const { getAllVariables } = useWorkflowVariables();
  const [activeTab, setActiveTab] = useState('general');
  
  // Authentication types
  const authTypes = [
    { value: 'none', label: 'None' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'apiKey', label: 'API Key' },
    { value: 'oauth2', label: 'OAuth 2.0' }
  ];
  
  // Body content types
  const bodyTypes = [
    { value: 'none', label: 'None' },
    { value: 'json', label: 'JSON' },
    { value: 'form', label: 'Form Data' },
    { value: 'text', label: 'Raw Text' }
  ];
  
  // Helper to get variables for dropdown
  const variableOptions = getAllVariables().map(v => ({
    value: v.fullPath,
    label: `${v.fullPath} (${v.type})`
  }));
  
  // Update node data
  const updateNodeData = (updates) => {
    onChange({
      ...node,
      data: {
        ...node.data,
        ...updates
      }
    });
  };
  
  // Update headers object
  const updateHeader = (key, value) => {
    const currentHeaders = { ...(node.data.headers || {}) };
    currentHeaders[key] = value;
    updateNodeData({ headers: currentHeaders });
  };
  
  // Remove header
  const removeHeader = (key) => {
    const currentHeaders = { ...(node.data.headers || {}) };
    delete currentHeaders[key];
    updateNodeData({ headers: currentHeaders });
  };
  
  // Add new header
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  
  const addHeader = () => {
    if (!newHeaderKey.trim()) return;
    
    const currentHeaders = { ...(node.data.headers || {}) };
    currentHeaders[newHeaderKey] = newHeaderValue;
    updateNodeData({ headers: currentHeaders });
    
    setNewHeaderKey('');
    setNewHeaderValue('');
  };
  
  // Update authentication settings
  const updateAuth = (updates) => {
    updateNodeData({
      authentication: {
        ...(node.data.authentication || {}),
        ...updates
      }
    });
  };
  
  return (
    <div className="node-config api-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
          placeholder="API Call"
        />
      </div>
      
      <div className="config-tabs">
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button 
            className={`tab-button ${activeTab === 'headers' ? 'active' : ''}`}
            onClick={() => setActiveTab('headers')}
          >
            Headers
          </button>
          <button 
            className={`tab-button ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => setActiveTab('body')}
          >
            Body
          </button>
          <button 
            className={`tab-button ${activeTab === 'auth' ? 'active' : ''}`}
            onClick={() => setActiveTab('auth')}
          >
            Auth
          </button>
          <button 
            className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        </div>
        
        <div className="tab-content">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="tab-pane">
              <div className="form-group">
                <label>API Name</label>
                <input
                  type="text"
                  value={node.data.apiName || ''}
                  onChange={(e) => updateNodeData({ apiName: e.target.value })}
                  placeholder="My API"
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
                <label>Endpoint URL</label>
                <input
                  type="text"
                  value={node.data.endpoint || ''}
                  onChange={(e) => updateNodeData({ endpoint: e.target.value })}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
              
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  rows={2}
                  value={node.data.description || ''}
                  onChange={(e) => updateNodeData({ description: e.target.value })}
                  placeholder="What this API call does"
                />
              </div>
              
              <div className="form-group">
                <label>Store Response in Variable</label>
                <input
                  type="text"
                  value={node.data.responseVariable || ''}
                  onChange={(e) => updateNodeData({ responseVariable: e.target.value })}
                  placeholder="apiResponse"
                />
                <div className="form-help">
                  This variable will contain the API response data
                </div>
              </div>
            </div>
          )}
          
          {/* Headers Tab */}
          {activeTab === 'headers' && (
            <div className="tab-pane">
              <div className="headers-container">
                <div className="headers-list">
                  {node.data.headers && Object.entries(node.data.headers).map(([key, value]) => (
                    <div key={key} className="header-item">
                      <div className="header-key">{key}</div>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateHeader(key, e.target.value)}
                        className="header-value"
                      />
                      <button 
                        className="remove-btn"
                        onClick={() => removeHeader(key)}
                      >
                        <i className="fa fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="add-header">
                  <input
                    type="text"
                    placeholder="Header name"
                    value={newHeaderKey}
                    onChange={(e) => setNewHeaderKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={newHeaderValue}
                    onChange={(e) => setNewHeaderValue(e.target.value)}
                  />
                  <button 
                    className="add-btn"
                    onClick={addHeader}
                    disabled={!newHeaderKey.trim()}
                  >
                    <i className="fa fa-plus"></i>
                  </button>
                </div>
              </div>
              
              <div className="form-help">
                <p>Common headers:</p>
                <button 
                  className="quick-header-btn"
                  onClick={() => {
                    setNewHeaderKey('Content-Type');
                    setNewHeaderValue('application/json');
                  }}
                >
                  Content-Type: application/json
                </button>
                <button 
                  className="quick-header-btn"
                  onClick={() => {
                    setNewHeaderKey('Accept');
                    setNewHeaderValue('application/json');
                  }}
                >
                  Accept: application/json
                </button>
              </div>
            </div>
          )}
          
          {/* Body Tab */}
          {activeTab === 'body' && (
            <div className="tab-pane">
              <div className="form-group">
                <label>Body Type</label>
                <select
                  value={node.data.bodyType || 'none'}
                  onChange={(e) => updateNodeData({ bodyType: e.target.value })}
                >
                  {bodyTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {node.data.bodyType && node.data.bodyType !== 'none' && (
                <div className="form-group">
                  <label>Request Body</label>
                  {node.data.bodyType === 'json' ? (
                    <textarea
                      rows={8}
                      value={typeof node.data.body === 'object' 
                        ? JSON.stringify(node.data.body, null, 2) 
                        : (node.data.body || '')}
                      onChange={(e) => {
                        try {
                          // Try to parse as JSON
                          const parsedBody = JSON.parse(e.target.value);
                          updateNodeData({ body: parsedBody });
                        } catch (error) {
                          // If not valid JSON, store as string
                          updateNodeData({ body: e.target.value });
                        }
                      }}
                      placeholder='{"key": "value"}'
                    />
                  ) : (
                    <textarea
                      rows={8}
                      value={node.data.body || ''}
                      onChange={(e) => updateNodeData({ body: e.target.value })}
                      placeholder="Request body content"
                    />
                  )}
                </div>
              )}
              
              <div className="form-group">
                <label>Use Variable as Body</label>
                <select
                  value={node.data.bodyVariable || ''}
                  onChange={(e) => updateNodeData({ bodyVariable: e.target.value })}
                >
                  <option value="">-- Select Variable --</option>
                  {variableOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="form-help">
                  If selected, this variable will be used instead of the body content above
                </div>
              </div>
            </div>
          )}
          
          {/* Auth Tab */}
          {activeTab === 'auth' && (
            <div className="tab-pane">
              <div className="form-group">
                <label>Authentication Type</label>
                <select
                  value={(node.data.authentication?.type) || 'none'}
                  onChange={(e) => updateAuth({ type: e.target.value })}
                >
                  {authTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {node.data.authentication?.type === 'basic' && (
                <>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={node.data.authentication.username || ''}
                      onChange={(e) => updateAuth({ username: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      value={node.data.authentication.password || ''}
                      onChange={(e) => updateAuth({ password: e.target.value })}
                    />
                  </div>
                </>
              )}
              
              {node.data.authentication?.type === 'bearer' && (
                <div className="form-group">
                  <label>Token</label>
                  <input
                    type="text"
                    value={node.data.authentication.token || ''}
                    onChange={(e) => updateAuth({ token: e.target.value })}
                  />
                </div>
              )}
              
              {node.data.authentication?.type === 'apiKey' && (
                <>
                  <div className="form-group">
                    <label>API Key Name</label>
                    <input
                      type="text"
                      value={node.data.authentication.name || ''}
                      onChange={(e) => updateAuth({ name: e.target.value })}
                      placeholder="X-API-Key"
                    />
                  </div>
                  <div className="form-group">
                    <label>API Key Value</label>
                    <input
                      type="text"
                      value={node.data.authentication.value || ''}
                      onChange={(e) => updateAuth({ value: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <select
                      value={node.data.authentication.location || 'header'}
                      onChange={(e) => updateAuth({ location: e.target.value })}
                    >
                      <option value="header">Header</option>
                      <option value="query">Query Parameter</option>
                    </select>
                  </div>
                </>
              )}
              
              {node.data.authentication?.type === 'oauth2' && (
                <div className="oauth-info">
                  <p>OAuth 2.0 configuration requires additional setup and is not available in this node configuration. Please use a dedicated OAuth connector node instead.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="tab-pane">
              <div className="form-group">
                <label>Timeout (seconds)</label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={node.data.timeout || 30}
                  onChange={(e) => updateNodeData({ timeout: parseInt(e.target.value) || 30 })}
                />
              </div>
              
              <div className="form-group">
                <label>Retry Count</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={node.data.retryCount || 0}
                  onChange={(e) => updateNodeData({ retryCount: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="form-group">
                <label>Follow Redirects</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="follow-redirects"
                    checked={node.data.followRedirects !== false}
                    onChange={(e) => updateNodeData({ followRedirects: e.target.checked })}
                  />
                  <label htmlFor="follow-redirects"></label>
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
              
              <div className="form-group">
                <label>Success Status Codes (comma separated)</label>
                <input
                  type="text"
                  value={node.data.successStatusCodes || '200,201,202,204'}
                  onChange={(e) => updateNodeData({ successStatusCodes: e.target.value })}
                  placeholder="200,201,202,204"
                />
                <div className="form-help">
                  HTTP status codes that should be considered successful
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiNodeConfig;