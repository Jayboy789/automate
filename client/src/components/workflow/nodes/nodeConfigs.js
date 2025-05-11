import React, { useState, useEffect } from 'react';
import { getAgents, getScripts } from '../../services/api';

// Script Node Configuration
export const ScriptNodeConfig = ({ node, onChange }) => {
  const [agents, setAgents] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [scriptType, setScriptType] = useState(node.data.scriptId ? 'library' : 'inline');
  const [loading, setLoading] = useState(true);
  
  // Load agents and scripts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentsData, scriptsData] = await Promise.all([
          getAgents(),
          getScripts()
        ]);
        
        setAgents(agentsData);
        setScripts(scriptsData);
      } catch (error) {
        console.error('Error loading config data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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
  
  if (loading) {
    return <div>Loading configuration...</div>;
  }
  
  return (
    <div className="node-config script-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
        />
      </div>
      
      <div className="form-group">
        <label>Script Type</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="scriptType"
              value="library"
              checked={scriptType === 'library'}
              onChange={() => {
                setScriptType('library');
                // Clear inline script if switching to library
                if (scriptType === 'inline') {
                  updateNodeData({ script: undefined });
                }
              }}
            />
            From Library
          </label>
          <label>
            <input
              type="radio"
              name="scriptType"
              value="inline"
              checked={scriptType === 'inline'}
              onChange={() => {
                setScriptType('inline');
                // Clear script ID if switching to inline
                if (scriptType === 'library') {
                  updateNodeData({ scriptId: undefined, scriptName: undefined });
                }
              }}
            />
            Inline Script
          </label>
        </div>
      </div>
      
      {scriptType === 'library' ? (
        <div className="form-group">
          <label>Select Script</label>
          <select
            value={node.data.scriptId || ''}
            onChange={(e) => {
              const scriptId = e.target.value;
              const script = scripts.find(s => s._id === scriptId);
              
              updateNodeData({
                scriptId,
                scriptName: script?.name,
                language: script?.language
              });
            }}
          >
            <option value="">-- Select a Script --</option>
            {scripts.map(script => (
              <option key={script._id} value={script._id}>
                {script.name} ({script.language})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className="form-group">
            <label>Script Language</label>
            <select
              value={node.data.language || 'PowerShell'}
              onChange={(e) => updateNodeData({ language: e.target.value })}
            >
              <option value="PowerShell">PowerShell</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Bash">Bash</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Script Content</label>
            <textarea
              rows={10}
              value={node.data.script || ''}
              onChange={(e) => updateNodeData({ script: e.target.value })}
              placeholder="Enter your script code here..."
            />
          </div>
        </>
      )}
      
      <div className="form-group">
        <label>Assign Agent</label>
        <select
          value={node.data.assignedAgent || ''}
          onChange={(e) => {
            const agentId = e.target.value;
            const agent = agents.find(a => a.agentId === agentId);
            
            updateNodeData({
              assignedAgent: agentId,
              agentName: agent?.name
            });
          }}
        >
          <option value="">Auto-select Agent</option>
          {agents.map(agent => (
            <option 
              key={agent.agentId} 
              value={agent.agentId}
              disabled={agent.status !== 'online'}
            >
              {agent.name} ({agent.status})
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label>Parameters (JSON)</label>
        <textarea
          rows={5}
          value={JSON.stringify(node.data.parameters || {}, null, 2)}
          onChange={(e) => {
            try {
              const parameters = JSON.parse(e.target.value);
              updateNodeData({ parameters });
            } catch (error) {
              // Invalid JSON - don't update
            }
          }}
          placeholder='{"param1": "value1", "param2": "value2"}'
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

// Condition Node Configuration
export const ConditionNodeConfig = ({ node, onChange }) => {
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
    <div className="node-config condition-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
        />
      </div>
      
      <div className="form-group">
        <label>Condition Expression</label>
        <textarea
          rows={5}
          value={node.data.condition || ''}
          onChange={(e) => updateNodeData({ condition: e.target.value })}
          placeholder="Variables available as: {{variableName}}"
        />
        <div className="form-help">
          Examples: <code>{{count}} > 10</code> or <code>{{status}} === 'completed'</code>
        </div>
      </div>
      
      <div className="form-group">
        <label>Description</label>
        <textarea
          rows={2}
          value={node.data.description || ''}
          onChange={(e) => updateNodeData({ description: e.target.value })}
          placeholder="Optional description of this condition"
        />
      </div>
    </div>
  );
};

// Wait Node Configuration
export const WaitNodeConfig = ({ node, onChange }) => {
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
    <div className="node-config wait-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
        />
      </div>
      
      <div className="form-group">
        <label>Wait Duration (seconds)</label>
        <input
          type="number"
          min="1"
          value={node.data.waitTime || 5}
          onChange={(e) => updateNodeData({ waitTime: parseInt(e.target.value) || 5 })}
        />
      </div>
      
      <div className="form-group">
        <label>Description</label>
        <textarea
          rows={2}
          value={node.data.description || ''}
          onChange={(e) => updateNodeData({ description: e.target.value })}
          placeholder="Optional description of this wait step"
        />
      </div>
    </div>
  );
};

// Variable Node Configuration
export const VariableNodeConfig = ({ node, onChange }) => {
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
    <div className="node-config variable-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
        />
      </div>
      
      <div className="form-group">
        <label>Variable Name</label>
        <input
          type="text"
          value={node.data.name || ''}
          onChange={(e) => updateNodeData({ name: e.target.value })}
          placeholder="myVariable"
        />
      </div>
      
      <div className="form-group">
        <label>Value</label>
        <textarea
          rows={5}
          value={node.data.value || ''}
          onChange={(e) => updateNodeData({ value: e.target.value })}
          placeholder="Value or expression with {{variables}}"
        />
      </div>
      
      <div className="form-group">
        <label>Description</label>
        <textarea
          rows={2}
          value={node.data.description || ''}
          onChange={(e) => updateNodeData({ description: e.target.value })}
          placeholder="Optional description of this variable"
        />
      </div>
    </div>
  );
};

// HTTP Node Configuration
export const HttpNodeConfig = ({ node, onChange }) => {
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
    <div className="node-config http-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
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
        <label>Headers (JSON)</label>
        <textarea
          rows={3}
          value={JSON.stringify(node.data.headers || {}, null, 2)}
          onChange={(e) => {
            try {
              const headers = JSON.parse(e.target.value);
              updateNodeData({ headers });
            } catch (error) {
              // Invalid JSON - don't update
            }
          }}
          placeholder='{"Content-Type": "application/json"}'
        />
      </div>
      
      <div className="form-group">
        <label>Body (JSON)</label>
        <textarea
          rows={5}
          value={typeof node.data.body === 'object' ? JSON.stringify(node.data.body, null, 2) : (node.data.body || '')}
          onChange={(e) => {
            try {
              const body = JSON.parse(e.target.value);
              updateNodeData({ body });
            } catch (error) {
              // If not valid JSON, store as string
              updateNodeData({ body: e.target.value });
            }
          }}
          placeholder='{"key": "value"}'
        />
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
    </div>
  );
};

// Webhook Node Configuration
export const WebhookNodeConfig = ({ node, onChange }) => {
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
    <div className="node-config webhook-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
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
          This will create a webhook at: /api/webhooks/{path}
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
    </div>
  );
};

// Schedule Node Configuration
export const ScheduleNodeConfig = ({ node, onChange }) => {
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
    <div className="node-config schedule-node-config">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateNodeData({ label: e.target.value })}
        />
      </div>
      
      <div className="form-group">
        <label>Schedule Type</label>
        <select
          value={node.data.scheduleType || 'cron'}
          onChange={(e) => updateNodeData({ scheduleType: e.target.value })}
        >
          <option value="cron">Cron Expression</option>
          <option value="interval">Interval</option>
          <option value="fixed">Fixed Time</option>
        </select>
      </div>
      
      {node.data.scheduleType === 'cron' && (
        <div className="form-group">
          <label>Cron Expression</label>
          <input
            type="text"
            value={node.data.cronExpression || ''}
            onChange={(e) => updateNodeData({ cronExpression: e.target.value })}
            placeholder="0 0 * * *"
          />
          <div className="form-help">
            Example: "0 0 * * *" (Daily at midnight)
          </div>
        </div>
      )}
      
      {node.data.scheduleType === 'interval' && (
        <div className="form-group">
          <label>Interval (minutes)</label>
          <input
            type="number"
            min="1"
            value={node.data.intervalMinutes || 60}
            onChange={(e) => updateNodeData({ intervalMinutes: parseInt(e.target.value) || 60 })}
          />
        </div>
      )}
      
      {node.data.scheduleType === 'fixed' && (
        <div className="form-group">
          <label>Fixed Time</label>
          <input
            type="time"
            value={node.data.fixedTime || ''}
            onChange={(e) => updateNodeData({ fixedTime: e.target.value })}
          />
        </div>
      )}
      
      <div className="form-group">
        <label>Description</label>
        <textarea
          rows={2}
          value={node.data.description || ''}
          onChange={(e) => updateNodeData({ description: e.target.value })}
          placeholder="What this schedule does"
        />
      </div>
    </div>
  );
};

// Loop Node Configuration
export const LoopNodeConfig = ({ node, onChange }) => {
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
          </div>
          <div className="form-group">
            <label>Item Variable</label>
            <input
              type="text"
              value={node.data.itemVariable || ''}
              onChange={(e) => updateNodeData({ itemVariable: e.target.value })}
              placeholder="item"
            />
          </div>
        </>
      )}
      
      {node.data.loopType === 'count' && (
        <>
          <div className="form-group">
            <label>Start</label>
            <input
              type="number"
              value={node.data.start || 0}
              onChange={(e) => updateNodeData({ start: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label>End</label>
            <input
              type="number"
              value={node.data.end || 10}
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
            placeholder="{{variable}} < 10"
          />
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
      </div>
    </div>
  );
};

// Transform Node Configuration
export const TransformNodeConfig = ({ node, onChange }) => {
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
      </div>
      
      <div className="form-group">
        <label>Output Variable</label>
        <input
          type="text"
          value={node.data.outputVariable || ''}
          onChange={(e) => updateNodeData({ outputVariable: e.target.value })}
          placeholder="transformedData"
        />
      </div>
      
      <div className="form-group">
        <label>Transform Function (JavaScript)</label>
        <textarea
          rows={10}
          value={node.data.transformFunction || ''}
          onChange={(e) => updateNodeData({ transformFunction: e.target.value })}
          placeholder={`// Input data is available as 'input'\n// Return the transformed output\nreturn input.map(item => ({\n  id: item.id,\n  name: item.name.toUpperCase()\n}));`}
        />
      </div>
    </div>
  );
};