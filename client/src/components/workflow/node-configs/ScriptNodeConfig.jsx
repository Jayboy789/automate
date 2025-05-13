// src/components/workflow/node-configs/ScriptNodeConfig.jsx
import React, { useState, useEffect } from 'react';

const ScriptNodeConfig = ({ node, onChange }) => {
  const [scriptType, setScriptType] = useState(node.data.scriptId ? 'library' : 'inline');
  const [scripts, setScripts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // In a real app, fetch scripts and agents from your API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API calls - replace with actual API calls
        setScripts([
          { _id: 'script1', name: 'Get System Info', language: 'PowerShell' },
          { _id: 'script2', name: 'Process Files', language: 'Python' },
          { _id: 'script3', name: 'Backup Database', language: 'Bash' }
        ]);
        
        setAgents([
          { agentId: 'agent1', name: 'Production Server', status: 'online' },
          { agentId: 'agent2', name: 'Test Server', status: 'online' },
          { agentId: 'agent3', name: 'Dev Machine', status: 'offline' }
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
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
          placeholder="Script Node"
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
              <option value="Other">Other</option>
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

export default ScriptNodeConfig;