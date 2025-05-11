import React, { useState, useEffect } from 'react';
import { Handle } from 'react-flow-renderer';
import { getAgents, getScripts } from '../../../services/api';

const ScriptNode = ({ data, id, selected }) => {
  return (
    <div className={`script-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position="top" />
      
      <div className="node-content">
        <div className="node-header">
          <i className="icon-script"></i>
          <span className="node-title">{data.label || 'Script'}</span>
        </div>
        
        <div className="node-body">
          <div className="script-info">
            {data.scriptId ? (
              <span>Script: {data.scriptName}</span>
            ) : (
              <span>Inline Script</span>
            )}
          </div>
          
          {data.assignedAgent && (
            <div className="agent-info">
              <span>Agent: {data.agentName || data.assignedAgent}</span>
            </div>
          )}
        </div>
      </div>
      
      <Handle type="source" position="bottom" />
    </div>
  );
};

export const ScriptNodeConfig = ({ node, onChange }) => {
  const [agents, setAgents] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [scriptType, setScriptType] = useState(node.data.scriptId ? 'library' : 'inline');
  
  useEffect(() => {
    // Load agents and scripts
    getAgents().then(setAgents);
    getScripts().then(setScripts);
  }, []);
  
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
    <div className="node-config script-node-config">
      <h3>Script Configuration</h3>
      
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
              value="library"
              checked={scriptType === 'library'}
              onChange={() => setScriptType('library')}
            />
            From Library
          </label>
          <label>
            <input
              type="radio"
              value="inline"
              checked={scriptType === 'inline'}
              onChange={() => setScriptType('inline')}
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
              const script = scripts.find(s => s._id === e.target.value);
              updateNodeData({ 
                scriptId: e.target.value,
                scriptName: script?.name || '',
                language: script?.language || 'PowerShell'
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
            />
          </div>
        </>
      )}
      
      <div className="form-group">
        <label>Assign Agent</label>
        <select
          value={node.data.assignedAgent || ''}
          onChange={(e) => {
            const agent = agents.find(a => a.agentId === e.target.value);
            updateNodeData({ 
              assignedAgent: e.target.value,
              agentName: agent?.name || ''
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
        <label>Parameters</label>
        <textarea
          rows={5}
          placeholder="Enter parameter values as JSON"
          value={JSON.stringify(node.data.parameters || {}, null, 2)}
          onChange={(e) => {
            try {
              const params = JSON.parse(e.target.value);
              updateNodeData({ parameters: params });
            } catch (err) {
              // Invalid JSON - keep the raw text but don't update parameters
            }
          }}
        />
      </div>
      
      <div className="form-group">
        <label>
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

export default ScriptNode;